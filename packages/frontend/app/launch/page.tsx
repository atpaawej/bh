'use client'

import { ProtectedRoute } from '../../components/auth/ProtectedRoute'

/**
 * Placeholder until the full launch form ships (product submission issue).
 * Auth-gated so Launch CTAs have a real destination after login.
 */
export default function LaunchPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-container px-6 py-20 text-center">
        <p className="mono-label mb-4">Launch</p>
        <h1 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
          Ship your product
        </h1>
        <p className="mx-auto mt-4 max-w-md text-body-muted">
          The full launch form is coming next. You&apos;re signed in and ready — hang tight.
        </p>
      </div>
    </ProtectedRoute>
  )
}
