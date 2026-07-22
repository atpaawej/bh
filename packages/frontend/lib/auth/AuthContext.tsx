'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthSessionResponse, AuthUserResponse } from '@bh/shared'
import {
  completeAuthWithAccessToken,
  completeAuthWithCode,
  completeAuthWithTokenHash,
  logoutRequest,
  refreshSession,
  requestMagicLink,
  startOAuth,
} from '../api'
import { setAccessToken } from './tokenStore'

interface AuthContextValue {
  user: AuthUserResponse | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  loginWithGoogle: () => Promise<void>
  loginWithGitHub: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  completeFromCallback: (params: {
    code?: string | null
    accessToken?: string | null
    tokenHash?: string | null
    type?: string | null
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applySession(session: AuthSessionResponse, setUser: (u: AuthUserResponse) => void) {
  setAccessToken(session.accessToken)
  setUser(session.user)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserResponse | null>(null)
  const [accessToken, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const apply = useCallback((session: AuthSessionResponse) => {
    applySession(session, setUser)
    setTokenState(session.accessToken)
  }, [])

  // Auto-refresh from HTTP-only cookie on first load
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const session = await refreshSession()
        if (!cancelled) apply(session)
      } catch {
        if (!cancelled) {
          setAccessToken(null)
          setUser(null)
          setTokenState(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [apply])

  const loginWithGoogle = useCallback(async () => {
    const { url } = await startOAuth('google')
    window.location.href = url
  }, [])

  const loginWithGitHub = useCallback(async () => {
    const { url } = await startOAuth('github')
    window.location.href = url
  }, [])

  const sendMagicLink = useCallback(async (email: string) => {
    await requestMagicLink(email)
  }, [])

  const completeFromCallback = useCallback(
    async (params: {
      code?: string | null
      accessToken?: string | null
      tokenHash?: string | null
      type?: string | null
    }) => {
      let session: AuthSessionResponse
      if (params.code) {
        session = await completeAuthWithCode(params.code)
      } else if (params.tokenHash) {
        const type =
          params.type === 'magiclink' || params.type === 'email' ? params.type : 'email'
        session = await completeAuthWithTokenHash(params.tokenHash, type)
      } else if (params.accessToken) {
        session = await completeAuthWithAccessToken(params.accessToken)
      } else {
        throw new Error('Missing auth credentials in callback')
      }
      apply(session)
    },
    [apply]
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setAccessToken(null)
      setUser(null)
      setTokenState(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      loginWithGoogle,
      loginWithGitHub,
      sendMagicLink,
      completeFromCallback,
      logout,
    }),
    [
      user,
      accessToken,
      isLoading,
      loginWithGoogle,
      loginWithGitHub,
      sendMagicLink,
      completeFromCallback,
      logout,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
