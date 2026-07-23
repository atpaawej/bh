import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authService } from "./authService";
import { db } from "../db";
import { AppError } from "../middleware/errorHandler";
import { getSupabaseAnon, getSupabaseAdmin } from "../supabase";
import jwt from "jsonwebtoken";
import { config } from "../config";

vi.mock("../db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../supabase", () => ({
  getSupabaseAnon: vi.fn(),
  getSupabaseAdmin: vi.fn(),
}));

const findUser = vi.mocked(db.user.findUnique);
const createUser = vi.mocked(db.user.create);
const updateUser = vi.mocked(db.user.update);
const createRefresh = vi.mocked(db.refreshToken.create);
const findRefresh = vi.mocked(db.refreshToken.findUnique);
const deleteRefresh = vi.mocked(db.refreshToken.delete);
const deleteManyRefresh = vi.mocked(db.refreshToken.deleteMany);
const mockGetAnon = vi.mocked(getSupabaseAnon);
const mockGetAdmin = vi.mocked(getSupabaseAdmin);

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const now = new Date("2026-07-22T12:00:00.000Z");

const dbUser = {
  id: "user-1",
  email: "asha@example.com",
  name: "Asha",
  avatarUrl: "https://example.com/a.jpg",
  bio: null,
  twitterHandle: null,
  website: null,
  createdAt: now,
  updatedAt: now,
};

function mockAnonClient(overrides: Record<string, unknown> = {}) {
  const client = {
    auth: {
      signInWithOAuth: vi.fn(),
      signInWithOtp: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      verifyOtp: vi.fn(),
      ...overrides,
    },
  };
  mockGetAnon.mockReturnValue(client as never);
  return client;
}

function mockAdminClient(overrides: Record<string, unknown> = {}) {
  const client = {
    auth: {
      getUser: vi.fn(),
      ...overrides,
    },
  };
  mockGetAdmin.mockReturnValue(client as never);
  return client;
}

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getOAuthUrl", () => {
    it("returns a Supabase authorize URL with PKCE for Google", async () => {
      const result = await authService.getOAuthUrl("google");

      expect(result.url).toContain(`${config.SUPABASE_URL}/auth/v1/authorize`);
      expect(result.url).toContain("provider=google");
      expect(result.url).toContain("code_challenge=");
      expect(result.url).toContain("code_challenge_method=s256");
      expect(result.url).toContain(
        encodeURIComponent(`${config.FRONTEND_URL}/auth/callback`),
      );
      expect(result.codeVerifier).toBeTruthy();
      expect(result.codeVerifier.length).toBeGreaterThan(20);
    });

    it("returns a Supabase authorize URL with PKCE for GitHub", async () => {
      const result = await authService.getOAuthUrl("github");

      expect(result.url).toContain("provider=github");
      expect(result.url).toContain("code_challenge=");
      expect(result.codeVerifier).toBeTruthy();
    });

    it("returns a fresh verifier each time", async () => {
      const a = await authService.getOAuthUrl("google");
      const b = await authService.getOAuthUrl("google");
      expect(a.codeVerifier).not.toBe(b.codeVerifier);
    });
  });

  describe("sendMagicLink", () => {
    it("sends a magic link via Supabase OTP", async () => {
      const anon = mockAnonClient();
      anon.auth.signInWithOtp.mockResolvedValue({ data: {}, error: null });

      await authService.sendMagicLink("asha@example.com");

      expect(anon.auth.signInWithOtp).toHaveBeenCalledWith({
        email: "asha@example.com",
        options: {
          emailRedirectTo: `${config.FRONTEND_URL}/auth/callback`,
        },
      });
    });

    it("throws when Supabase rejects the magic link request", async () => {
      const anon = mockAnonClient();
      anon.auth.signInWithOtp.mockResolvedValue({
        data: {},
        error: { message: "rate limited" },
      });

      await expect(
        authService.sendMagicLink("asha@example.com"),
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe("completeWithCode", () => {
    function mockPkceTokenSuccess(user: Record<string, unknown>) {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "supabase-access",
          user,
        }),
      });
    }

    it("exchanges code, upserts user, and returns session tokens", async () => {
      mockPkceTokenSuccess({
        id: "sb-1",
        email: "asha@example.com",
        user_metadata: {
          full_name: "Asha",
          avatar_url: "https://example.com/a.jpg",
        },
      });

      findUser.mockResolvedValue(null);
      createUser.mockResolvedValue(dbUser as never);
      createRefresh.mockResolvedValue({
        id: "rt-1",
        token: "refresh-token",
        userId: dbUser.id,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        createdAt: now,
      } as never);

      const session = await authService.completeWithCode(
        "pkce-code",
        "verifier",
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `${config.SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            auth_code: "pkce-code",
            code_verifier: "verifier",
          }),
        }),
      );
      expect(createUser).toHaveBeenCalledWith({
        data: {
          email: "asha@example.com",
          name: "Asha",
          avatarUrl: "https://example.com/a.jpg",
        },
      });
      expect(session.user).toEqual({
        id: "user-1",
        email: "asha@example.com",
        name: "Asha",
        avatarUrl: "https://example.com/a.jpg",
      });
      expect(session.accessToken).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();

      const payload = jwt.verify(
        session.accessToken,
        config.JWT_SECRET,
      ) as jwt.JwtPayload;
      expect(payload.sub).toBe("user-1");
      expect(payload.email).toBe("asha@example.com");
    });

    it("updates existing user profile fields from provider metadata", async () => {
      mockPkceTokenSuccess({
        id: "sb-1",
        email: "asha@example.com",
        user_metadata: {
          name: "Asha Updated",
          avatar_url: "https://example.com/new.jpg",
        },
      });

      findUser.mockResolvedValue(dbUser as never);
      updateUser.mockResolvedValue({
        ...dbUser,
        name: "Asha Updated",
        avatarUrl: "https://example.com/new.jpg",
      } as never);
      createRefresh.mockResolvedValue({
        id: "rt-1",
        token: "r",
        userId: dbUser.id,
        expiresAt: new Date(now.getTime() + 1),
        createdAt: now,
      } as never);

      const session = await authService.completeWithCode("code", "verifier");

      expect(updateUser).toHaveBeenCalled();
      expect(session.user.name).toBe("Asha Updated");
    });

    it("throws unauthorized when code exchange fails", async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        json: async () => ({ error_description: "invalid code" }),
      });

      await expect(
        authService.completeWithCode("bad", "verifier"),
      ).rejects.toMatchObject({
        status: 401,
        code: "UNAUTHORIZED",
      });
    });

    it("throws unauthorized when PKCE verifier cookie is missing", async () => {
      await expect(authService.completeWithCode("code")).rejects.toMatchObject({
        status: 401,
        code: "UNAUTHORIZED",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("completeWithAccessToken", () => {
    it("verifies Supabase token and issues app session", async () => {
      const admin = mockAdminClient();
      admin.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: "sb-1",
            email: "asha@example.com",
            user_metadata: { full_name: "Asha", avatar_url: null },
          },
        },
        error: null,
      });

      findUser.mockResolvedValue(dbUser as never);
      createRefresh.mockResolvedValue({
        id: "rt-1",
        token: "r",
        userId: dbUser.id,
        expiresAt: new Date(now.getTime() + 1),
        createdAt: now,
      } as never);

      const session = await authService.completeWithAccessToken("supabase-jwt");

      expect(admin.auth.getUser).toHaveBeenCalledWith("supabase-jwt");
      expect(session.user.id).toBe("user-1");
      expect(session.accessToken).toBeTruthy();
    });

    it("rejects invalid Supabase tokens", async () => {
      const admin = mockAdminClient();
      admin.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "invalid JWT" },
      });

      await expect(
        authService.completeWithAccessToken("bad"),
      ).rejects.toMatchObject({
        status: 401,
      });
    });
  });

  describe("completeWithTokenHash", () => {
    it("verifies magic-link token hash and issues session", async () => {
      const anon = mockAnonClient();
      anon.auth.verifyOtp.mockResolvedValue({
        data: {
          user: {
            id: "sb-1",
            email: "asha@example.com",
            user_metadata: { full_name: "Asha" },
          },
          session: { access_token: "t" },
        },
        error: null,
      });

      findUser.mockResolvedValue(dbUser as never);
      createRefresh.mockResolvedValue({
        id: "rt-1",
        token: "r",
        userId: dbUser.id,
        expiresAt: new Date(now.getTime() + 1),
        createdAt: now,
      } as never);

      const session = await authService.completeWithTokenHash(
        "hash-value",
        "email",
      );

      expect(anon.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: "hash-value",
        type: "email",
      });
      expect(session.user.email).toBe("asha@example.com");
    });
  });

  describe("refresh", () => {
    function mockTransaction() {
      const tx = {
        refreshToken: {
          findUnique: findRefresh,
          delete: deleteRefresh,
          create: createRefresh,
        },
      };
      (
        db as unknown as { $transaction: ReturnType<typeof vi.fn> }
      ).$transaction = vi
        .fn()
        .mockImplementation(async (fn: (t: typeof tx) => Promise<unknown>) =>
          fn(tx),
        );
    }

    it("rotates refresh token and returns a new access token", async () => {
      mockTransaction();
      const stored = {
        id: "rt-old",
        token: "hashed",
        userId: dbUser.id,
        expiresAt: new Date(now.getTime() + 60_000),
        createdAt: now,
        user: dbUser,
      };
      findRefresh.mockResolvedValue(stored as never);
      deleteRefresh.mockResolvedValue(stored as never);
      createRefresh.mockResolvedValue({
        id: "rt-new",
        token: "hashed-new",
        userId: dbUser.id,
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        createdAt: now,
      } as never);

      const session = await authService.refresh("old-refresh");

      expect(deleteRefresh).toHaveBeenCalledWith({ where: { id: "rt-old" } });
      expect(createRefresh).toHaveBeenCalled();
      // Stored value is HMAC, not the raw cookie token
      const createArg = createRefresh.mock.calls[0][0] as {
        data: { token: string };
      };
      expect(createArg.data.token).not.toBe(session.refreshToken);
      expect(session.refreshToken).toBeTruthy();
      expect(session.refreshToken).not.toBe("old-refresh");
      expect(session.user.id).toBe("user-1");

      const payload = jwt.verify(
        session.accessToken,
        config.JWT_SECRET,
      ) as jwt.JwtPayload;
      expect(payload.sub).toBe("user-1");
    });

    it("rejects missing refresh tokens", async () => {
      mockTransaction();
      findRefresh.mockResolvedValue(null);

      await expect(authService.refresh("missing")).rejects.toMatchObject({
        status: 401,
      });
    });

    it("rejects expired refresh tokens and deletes them", async () => {
      mockTransaction();
      findRefresh.mockResolvedValue({
        id: "rt-old",
        token: "hashed",
        userId: dbUser.id,
        expiresAt: new Date(now.getTime() - 1000),
        createdAt: now,
        user: dbUser,
      } as never);
      deleteRefresh.mockResolvedValue({} as never);

      await expect(authService.refresh("old-refresh")).rejects.toMatchObject({
        status: 401,
      });
      expect(deleteRefresh).toHaveBeenCalledWith({ where: { id: "rt-old" } });
    });
  });

  describe("logout", () => {
    it("deletes the hashed refresh token when present", async () => {
      deleteManyRefresh.mockResolvedValue({ count: 1 } as never);

      await authService.logout("some-refresh");

      expect(deleteManyRefresh).toHaveBeenCalled();
      const arg = deleteManyRefresh.mock.calls[0][0] as {
        where: { token: string };
      };
      expect(arg.where.token).not.toBe("some-refresh");
      expect(arg.where.token).toBeTruthy();
    });

    it("is a no-op when no token is provided", async () => {
      await authService.logout(undefined);
      expect(deleteManyRefresh).not.toHaveBeenCalled();
    });
  });
});
