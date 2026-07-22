'use client'

import Link from 'next/link'
import { useAuth } from '../lib/auth/AuthContext'

type LaunchCtaProps = {
  /** Button label when logged out (default: Launch your product) */
  labelLoggedOut?: string
  /** Button label when logged in (default: same as logged out) */
  labelLoggedIn?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-7 py-3.5 text-sm',
} as const

/**
 * Primary maker CTA: /launch when signed in, otherwise login with return URL.
 */
export function LaunchCta({
  labelLoggedOut = 'Launch your product',
  labelLoggedIn,
  className = '',
  size = 'md',
}: LaunchCtaProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const label = isAuthenticated ? (labelLoggedIn ?? labelLoggedOut) : labelLoggedOut
  const href = isAuthenticated
    ? '/launch'
    : `/auth/login?redirect=${encodeURIComponent('/launch')}`

  if (isLoading) {
    return (
      <span
        className={`inline-flex items-center rounded-pill bg-primary/80 ${sizeClass[size]} font-medium text-white opacity-70 ${className}`}
        aria-hidden
      >
        {labelLoggedOut}
      </span>
    )
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-pill bg-primary ${sizeClass[size]} font-medium text-white transition hover:opacity-90 ${className}`}
    >
      {label}
    </Link>
  )
}

/** Text / nav link style for “Launch” destinations. */
export function LaunchNavLink({ className = '' }: { className?: string }) {
  const { isAuthenticated, isLoading } = useAuth()
  const href = isAuthenticated
    ? '/launch'
    : `/auth/login?redirect=${encodeURIComponent('/launch')}`

  if (isLoading) {
    return <span className={`text-sm text-muted ${className}`}>Launch</span>
  }

  return (
    <Link href={href} className={`text-sm font-medium text-ink transition hover:text-deep-green ${className}`}>
      Launch
    </Link>
  )
}
