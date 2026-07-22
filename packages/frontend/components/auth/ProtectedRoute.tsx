'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth/AuthContext'
import { safeRedirectPath } from '../../lib/auth/redirect'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Client wrapper that redirects unauthenticated users to /auth/login?redirect=
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(safeRedirectPath(pathname || '/'))
      router.replace(`/auth/login?redirect=${redirect}`)
    }
  }, [isAuthenticated, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted">Checking session…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-muted">Redirecting to sign in…</p>
      </div>
    )
  }

  return <>{children}</>
}
