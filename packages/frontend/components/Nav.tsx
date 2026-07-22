import Link from 'next/link'

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-hairline bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-container grid-cols-[1fr_auto] items-center px-6 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="font-display text-xl tracking-tight text-ink">
          <span className="font-medium">Bharat</span>Hunt
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-medium text-ink">
            Discover
          </Link>
          <span className="text-sm text-muted">Leaderboard</span>
          <span className="text-sm text-muted">Categories</span>
          <span className="text-sm text-muted">Launch</span>
        </div>

        <div className="flex items-center justify-end gap-4">
          <span className="hidden text-sm text-muted sm:inline">Sign in</span>
          <span className="inline-flex items-center rounded-pill bg-primary px-4 py-2 text-sm font-medium text-white">
            Get Started
          </span>
        </div>
      </div>
    </nav>
  )
}
