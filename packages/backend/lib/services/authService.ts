import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Prisma } from "@prisma/client";
import { slugify } from "../shared/utils";
import { db } from "../db";
import { config } from "../config";
import { AppError } from "../middleware/errorHandler";
import { getSupabaseAnon, getSupabaseAdmin } from "../supabase";
import type { AuthUser } from "../middleware/auth";

type SupabaseUserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export type OAuthProvider = "google" | "github";

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface OAuthStart {
  url: string;
  /** PKCE code verifier — store in an HTTP-only cookie for the callback exchange */
  codeVerifier: string;
}

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * PKCE helpers — implemented ourselves because supabase-js ignores custom
 * storage when persistSession is false (it uses an internal memory map we
 * cannot read across the OAuth redirect round-trip).
 */
function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
}

function buildOAuthAuthorizeUrl(
  provider: OAuthProvider,
  redirectTo: string,
  codeChallenge: string,
): string {
  const params = new URLSearchParams({
    provider,
    redirect_to: redirectTo,
    code_challenge: codeChallenge,
    code_challenge_method: "s256",
  });
  return `${config.SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;
}

async function exchangePkceCode(
  code: string,
  codeVerifier: string,
): Promise<{ user: SupabaseUserLike & { email?: string | null } }> {
  const res = await fetch(
    `${config.SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        auth_code: code,
        code_verifier: codeVerifier,
      }),
    },
  );

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    error_description?: string;
    msg?: string;
    user?: SupabaseUserLike & { email?: string | null };
    access_token?: string;
  };

  if (!res.ok) {
    throw AppError.unauthorized(
      body.error_description ||
        body.msg ||
        body.error ||
        "Invalid or expired auth code",
    );
  }

  // Token response may nest user under different shapes; fall back to getUser
  if (body.user?.email) {
    return { user: body.user };
  }

  if (body.access_token) {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(body.access_token);
    if (error || !data.user) {
      throw AppError.unauthorized(
        error?.message ?? "Unable to load user after OAuth",
      );
    }
    return { user: data.user };
  }

  throw AppError.unauthorized("Invalid or expired auth code");
}

async function generateUsername(name: string, email: string): Promise<string> {
  const base = slugify(name) || email.split("@")[0] || "maker";
  // Try base first; append counter if taken
  const existing = await db.user.findUnique({ where: { username: base } });
  if (!existing) return base;
  for (let i = 1; i < 100; i++) {
    const candidate = `${base}-${i}`;
    const taken = await db.user.findUnique({ where: { username: candidate } });
    if (!taken) return candidate;
  }
  // Fallback — extremely unlikely
  return `${base}-${Date.now()}`;
}

function displayName(user: SupabaseUserLike, email: string): string {
  const meta = user.user_metadata ?? {};
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.user_name === "string" && meta.user_name) ||
    null;
  if (fromMeta?.trim()) return fromMeta.trim();
  return email.split("@")[0] || "Maker";
}

function avatarFrom(user: SupabaseUserLike): string | null {
  const meta = user.user_metadata ?? {};
  const url =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;
  return url;
}

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
  };
}

function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    {
      email: user.email,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
    },
    config.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    },
  );
}

function newRefreshTokenValue(): string {
  return crypto.randomBytes(48).toString("base64url");
}

/** Store only an HMAC of the refresh token so a DB leak is not enough to steal sessions. */
function hashRefreshToken(raw: string): string {
  return crypto
    .createHmac("sha256", config.REFRESH_TOKEN_SECRET)
    .update(raw)
    .digest("base64url");
}

async function upsertUserFromSupabase(supabaseUser: SupabaseUserLike) {
  const email = supabaseUser.email?.toLowerCase().trim();
  if (!email) {
    throw AppError.unauthorized(
      "Authenticated provider did not return an email",
    );
  }

  const name = displayName(supabaseUser, email);
  const avatarUrl = avatarFrom(supabaseUser);

  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    const username = await generateUsername(name, email);
    return db.user.create({
      data: { email, name, username, avatarUrl },
    });
  }

  // Keep profile in sync with provider when name/avatar changed
  if (existing.name !== name || existing.avatarUrl !== avatarUrl) {
    return db.user.update({
      where: { id: existing.id },
      data: { name, avatarUrl },
    });
  }

  return existing;
}

async function issueSession(user: {
  id: string;
  email: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}): Promise<AuthSession> {
  const authUser = toAuthUser(user);
  const accessToken = signAccessToken(authUser);
  const refreshToken = newRefreshTokenValue();

  await db.refreshToken.create({
    data: {
      token: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken, refreshToken, user: authUser };
}

export const authService = {
  /**
   * Starts OAuth and returns the authorize URL plus the PKCE verifier.
   * The verifier must be stored (HTTP-only cookie) and sent back on code exchange.
   */
  async getOAuthUrl(provider: OAuthProvider): Promise<OAuthStart> {
    const { verifier, challenge } = generatePkcePair();
    const url = buildOAuthAuthorizeUrl(
      provider,
      `${config.FRONTEND_URL}/auth/callback`,
      challenge,
    );
    return { url, codeVerifier: verifier };
  },

  async sendMagicLink(email: string): Promise<void> {
    const supabase = getSupabaseAnon();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${config.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) {
      throw AppError.validation(error.message);
    }
  },

  async completeWithCode(
    code: string,
    codeVerifier?: string,
  ): Promise<AuthSession> {
    if (!codeVerifier) {
      throw AppError.unauthorized(
        "Missing PKCE verifier — restart sign-in from the login page (cookies may have been cleared)",
      );
    }

    const { user: supabaseUser } = await exchangePkceCode(code, codeVerifier);
    const user = await upsertUserFromSupabase(supabaseUser);
    return issueSession(user);
  },

  async completeWithAccessToken(accessToken: string): Promise<AuthSession> {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      throw AppError.unauthorized(
        error?.message ?? "Invalid or expired access token",
      );
    }

    const user = await upsertUserFromSupabase(data.user);
    return issueSession(user);
  },

  async completeWithTokenHash(
    tokenHash: string,
    type: "email" | "magiclink" = "email",
  ): Promise<AuthSession> {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error || !data.user) {
      throw AppError.unauthorized(
        error?.message ?? "Invalid or expired magic link",
      );
    }

    const user = await upsertUserFromSupabase(data.user);
    return issueSession(user);
  },

  async refresh(rawToken: string): Promise<AuthSession> {
    const tokenHash = hashRefreshToken(rawToken);

    return db.$transaction(async (tx: Prisma.TransactionClient) => {
      const stored = await tx.refreshToken.findUnique({
        where: { token: tokenHash },
        include: { user: true },
      });

      if (!stored) {
        throw AppError.unauthorized("Invalid refresh token");
      }

      if (stored.expiresAt.getTime() <= Date.now()) {
        await tx.refreshToken.delete({ where: { id: stored.id } });
        throw AppError.unauthorized("Refresh token expired");
      }

      // Rotation inside the transaction: delete old, create new (atomic)
      await tx.refreshToken.delete({ where: { id: stored.id } });

      const authUser = toAuthUser(stored.user);
      const accessToken = signAccessToken(authUser);
      const refreshToken = newRefreshTokenValue();

      await tx.refreshToken.create({
        data: {
          token: hashRefreshToken(refreshToken),
          userId: stored.user.id,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      });

      return { accessToken, refreshToken, user: authUser };
    });
  },

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await db.refreshToken.deleteMany({
      where: { token: hashRefreshToken(rawToken) },
    });
  },
};
