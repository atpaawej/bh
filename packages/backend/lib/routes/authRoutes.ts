import { Router } from 'express'
import { authService } from '../services/authService'
import { loginSchema } from '../validators/authSchema'
import { validate } from '../middleware/validate'
import { authLimiter } from '../middleware/rateLimiter'
import { asyncHandler } from '../middleware/asyncHandler'
import { config } from '../config'
import type { AuthSession } from '../services/authService'
import type { Response } from 'express'

const REFRESH_COOKIE = 'refreshToken'
const PKCE_COOKIE = 'pkceCodeVerifier'
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const PKCE_MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  }
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, cookieOptions(REFRESH_MAX_AGE_MS))
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })
}

function setPkceCookie(res: Response, verifier: string) {
  res.cookie(PKCE_COOKIE, verifier, cookieOptions(PKCE_MAX_AGE_MS))
}

function clearPkceCookie(res: Response) {
  res.clearCookie(PKCE_COOKIE, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })
}

function sessionBody(session: AuthSession) {
  return {
    accessToken: session.accessToken,
    user: session.user,
  }
}

const router = Router()

/** Rate-limit only OAuth/magic-link *starts*, not callback completion. */
function loginStartLimiter(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
) {
  const body = req.body as { provider?: string; email?: string }
  if (body.provider || body.email) {
    return authLimiter(req, res, next)
  }
  return next()
}

/**
 * POST /api/auth/login
 * - { provider } → start OAuth, returns { url }
 * - { email } → send magic link
 * - { code | accessToken | tokenHash } → complete login, returns session + refresh cookie
 */
router.post(
  '/login',
  validate(loginSchema),
  loginStartLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body as {
      provider?: 'google' | 'github'
      email?: string
      code?: string
      accessToken?: string
      tokenHash?: string
      type?: 'email' | 'magiclink'
    }

    if (body.provider) {
      const { url, codeVerifier } = await authService.getOAuthUrl(body.provider)
      setPkceCookie(res, codeVerifier)
      return res.json({ url })
    }

    if (body.email) {
      await authService.sendMagicLink(body.email)
      return res.json({ message: 'Magic link sent. Check your email.' })
    }

    let session: AuthSession
    if (body.code) {
      const verifier = req.cookies?.[PKCE_COOKIE] as string | undefined
      session = await authService.completeWithCode(body.code, verifier)
      clearPkceCookie(res)
    } else if (body.accessToken) {
      session = await authService.completeWithAccessToken(body.accessToken)
    } else {
      session = await authService.completeWithTokenHash(body.tokenHash!, body.type ?? 'email')
    }

    setRefreshCookie(res, session.refreshToken)
    return res.json(sessionBody(session))
  })
)

/**
 * POST /api/auth/refresh
 * Issues a new access token from the HTTP-only refresh cookie (rotation).
 * Note: not authLimiter — that limit is for login attempts; refresh runs on every page load.
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined
    if (!raw) {
      clearRefreshCookie(res)
      return res.status(401).json({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No refresh token',
      })
    }

    try {
      const session = await authService.refresh(raw)
      setRefreshCookie(res, session.refreshToken)
      return res.json(sessionBody(session))
    } catch (err) {
      clearRefreshCookie(res)
      throw err
    }
  })
)

/**
 * POST /api/auth/logout
 * Clears refresh cookie and invalidates the token in the database.
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined
    await authService.logout(raw)
    clearRefreshCookie(res)
    return res.status(204).send()
  })
)

export default router
