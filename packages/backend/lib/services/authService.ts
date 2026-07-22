import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { db } from '../db'
import { config } from '../config'
import { AppError } from '../middleware/errorHandler'
import { getSupabaseAnon, getSupabaseAdmin } from '../supabase'
import type { AuthUser } from '../middleware/auth'

export type OAuthProvider = 'google' | 'github'

export interface AuthSession {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface OAuthStart {
  url: string
  /** PKCE code verifier — store in an HTTP-only cookie for the callback exchange */
  codeVerifier: string
}

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/** In-memory storage so we can capture/seed the PKCE code verifier. */
function createMemoryStorage(seed: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(seed))
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
    /** Test helper / internal read of all keys */
    _map: map,
  }
}

function supabaseProjectRef(): string {
  try {
    return new URL(config.SUPABASE_URL).hostname.split('.')[0] ?? 'supabase'
  } catch {
    return 'supabase'
  }
}

function codeVerifierStorageKey(): string {
  return `sb-${supabaseProjectRef()}-auth-token-code-verifier`
}

type SupabaseUserLike = {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

function displayName(user: SupabaseUserLike, email: string): string {
  const meta = user.user_metadata ?? {}
  const fromMeta =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.user_name === 'string' && meta.user_name) ||
    null
  if (fromMeta?.trim()) return fromMeta.trim()
  return email.split('@')[0] || 'Maker'
}

function avatarFrom(user: SupabaseUserLike): string | null {
  const meta = user.user_metadata ?? {}
  const url =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    null
  return url
}

function toAuthUser(user: {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  }
}

function signAccessToken(user: AuthUser): string {
  return jwt.sign(
    {
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    config.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }
  )
}

function newRefreshTokenValue(): string {
  return crypto.randomBytes(48).toString('base64url')
}

/** Store only an HMAC of the refresh token so a DB leak is not enough to steal sessions. */
function hashRefreshToken(raw: string): string {
  return crypto.createHmac('sha256', config.REFRESH_TOKEN_SECRET).update(raw).digest('base64url')
}

async function upsertUserFromSupabase(supabaseUser: SupabaseUserLike) {
  const email = supabaseUser.email?.toLowerCase().trim()
  if (!email) {
    throw AppError.unauthorized('Authenticated provider did not return an email')
  }

  const name = displayName(supabaseUser, email)
  const avatarUrl = avatarFrom(supabaseUser)

  const existing = await db.user.findUnique({ where: { email } })
  if (!existing) {
    return db.user.create({
      data: { email, name, avatarUrl },
    })
  }

  // Keep profile in sync with provider when name/avatar changed
  if (existing.name !== name || existing.avatarUrl !== avatarUrl) {
    return db.user.update({
      where: { id: existing.id },
      data: { name, avatarUrl },
    })
  }

  return existing
}

async function issueSession(user: {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}): Promise<AuthSession> {
  const authUser = toAuthUser(user)
  const accessToken = signAccessToken(authUser)
  const refreshToken = newRefreshTokenValue()

  await db.refreshToken.create({
    data: {
      token: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })

  return { accessToken, refreshToken, user: authUser }
}

export const authService = {
  /**
   * Starts OAuth and returns the authorize URL plus the PKCE verifier.
   * The verifier must be stored (HTTP-only cookie) and sent back on code exchange.
   */
  async getOAuthUrl(provider: OAuthProvider): Promise<OAuthStart> {
    const storage = createMemoryStorage()
    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        storage,
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${config.FRONTEND_URL}/auth/callback`,
        skipBrowserRedirect: true,
      },
    })

    if (error || !data.url) {
      throw AppError.validation(error?.message ?? 'Unable to start OAuth login')
    }

    const rawVerifier = storage.getItem(codeVerifierStorageKey())
    // supabase may store "verifier" or "verifier/redirectType"
    const codeVerifier = (rawVerifier ?? '').split('/')[0]
    if (!codeVerifier) {
      throw AppError.validation('Failed to initialize OAuth PKCE verifier')
    }

    return { url: data.url, codeVerifier }
  },

  async sendMagicLink(email: string): Promise<void> {
    const supabase = getSupabaseAnon()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${config.FRONTEND_URL}/auth/callback`,
      },
    })

    if (error) {
      throw AppError.validation(error.message)
    }
  },

  async completeWithCode(code: string, codeVerifier?: string): Promise<AuthSession> {
    let supabase = getSupabaseAnon()

    if (codeVerifier) {
      const storage = createMemoryStorage({
        [codeVerifierStorageKey()]: codeVerifier,
      })
      supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: {
          storage,
          flowType: 'pkce',
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      throw AppError.unauthorized(error?.message ?? 'Invalid or expired auth code')
    }

    const user = await upsertUserFromSupabase(data.user)
    return issueSession(user)
  },

  async completeWithAccessToken(accessToken: string): Promise<AuthSession> {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.auth.getUser(accessToken)

    if (error || !data.user) {
      throw AppError.unauthorized(error?.message ?? 'Invalid or expired access token')
    }

    const user = await upsertUserFromSupabase(data.user)
    return issueSession(user)
  },

  async completeWithTokenHash(
    tokenHash: string,
    type: 'email' | 'magiclink' = 'email'
  ): Promise<AuthSession> {
    const supabase = getSupabaseAnon()
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (error || !data.user) {
      throw AppError.unauthorized(error?.message ?? 'Invalid or expired magic link')
    }

    const user = await upsertUserFromSupabase(data.user)
    return issueSession(user)
  },

  async refresh(rawToken: string): Promise<AuthSession> {
    const tokenHash = hashRefreshToken(rawToken)

    return db.$transaction(async (tx) => {
      const stored = await tx.refreshToken.findUnique({
        where: { token: tokenHash },
        include: { user: true },
      })

      if (!stored) {
        throw AppError.unauthorized('Invalid refresh token')
      }

      if (stored.expiresAt.getTime() <= Date.now()) {
        await tx.refreshToken.delete({ where: { id: stored.id } })
        throw AppError.unauthorized('Refresh token expired')
      }

      // Rotation inside the transaction: delete old, create new (atomic)
      await tx.refreshToken.delete({ where: { id: stored.id } })

      const authUser = toAuthUser(stored.user)
      const accessToken = signAccessToken(authUser)
      const refreshToken = newRefreshTokenValue()

      await tx.refreshToken.create({
        data: {
          token: hashRefreshToken(refreshToken),
          userId: stored.user.id,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        },
      })

      return { accessToken, refreshToken, user: authUser }
    })
  },

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return
    await db.refreshToken.deleteMany({ where: { token: hashRefreshToken(rawToken) } })
  },
}
