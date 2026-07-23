import { Router, type Response } from "express";
import { authService } from "../services/authService";
import { loginSchema, type LoginInput } from "../validators/authSchema";
import { validate } from "../middleware/validate";
import { authLimiter } from "../middleware/rateLimiter";
import { asyncHandler } from "../middleware/asyncHandler";
import { config } from "../config";
import { AppError } from "../middleware/errorHandler";
import type { AuthSession } from "../services/authService";

const REFRESH_COOKIE = "refreshToken";
const PKCE_COOKIE = "pkceCodeVerifier";
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const PKCE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function baseCookieOptions() {
  return {
    httpOnly: true as const,
    secure: config.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
  };
}

function cookieOptions(maxAge: number) {
  return { ...baseCookieOptions(), maxAge };
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, cookieOptions(REFRESH_MAX_AGE_MS));
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions());
}

function setPkceCookie(res: Response, verifier: string) {
  res.cookie(PKCE_COOKIE, verifier, cookieOptions(PKCE_MAX_AGE_MS));
}

function clearPkceCookie(res: Response) {
  res.clearCookie(PKCE_COOKIE, baseCookieOptions());
}

function sessionBody(session: AuthSession) {
  return {
    accessToken: session.accessToken,
    user: session.user,
  };
}

const router = Router();

/**
 * POST /api/auth/login
 * - { provider } → start OAuth, returns { url }
 * - { email } → send magic link
 * - { code | accessToken | tokenHash } → complete login, returns session + refresh cookie
 *
 * authLimiter runs first so invalid payloads still count toward the 5/15min budget.
 */
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as LoginInput;

    if (body.provider) {
      const { url, codeVerifier } = await authService.getOAuthUrl(
        body.provider,
      );
      setPkceCookie(res, codeVerifier);
      return res.json({ url });
    }

    if (body.email) {
      await authService.sendMagicLink(body.email);
      return res.json({ message: "Magic link sent. Check your email." });
    }

    let session: AuthSession;
    if (body.code) {
      const verifier = req.cookies?.[PKCE_COOKIE] as string | undefined;
      try {
        session = await authService.completeWithCode(body.code, verifier);
      } finally {
        // Always drop PKCE state — success or failure — so retries start clean
        clearPkceCookie(res);
      }
    } else if (body.accessToken) {
      session = await authService.completeWithAccessToken(body.accessToken);
    } else {
      session = await authService.completeWithTokenHash(
        body.tokenHash!,
        body.type ?? "email",
      );
    }

    setRefreshCookie(res, session.refreshToken);
    return res.json(sessionBody(session));
  }),
);

/**
 * POST /api/auth/refresh
 * Issues a new access token from the HTTP-only refresh cookie (rotation).
 * Not authLimiter — refresh runs on every page load.
 */
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) {
      clearRefreshCookie(res);
      throw AppError.unauthorized("No refresh token");
    }

    try {
      const session = await authService.refresh(raw);
      setRefreshCookie(res, session.refreshToken);
      return res.json(sessionBody(session));
    } catch (err) {
      clearRefreshCookie(res);
      throw err;
    }
  }),
);

/**
 * POST /api/auth/logout
 * Clears refresh cookie and invalidates the token in the database.
 * Cookie is always cleared even if DB invalidation fails.
 */
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    try {
      await authService.logout(raw);
    } finally {
      clearRefreshCookie(res);
    }
    return res.status(204).send();
  }),
);

export default router;
