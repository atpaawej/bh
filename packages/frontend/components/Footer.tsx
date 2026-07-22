import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-container px-6">
        {/* Newsletter band */}
        <div className="flex flex-col gap-8 border-b border-white/10 py-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.08em] text-coral">
              Launches move fast
            </p>
            <h3 className="font-display text-3xl tracking-tight">Get the weekly digest</h3>
            <p className="mt-3 text-sm text-white/55">
              Top products, maker stories, and launch tips — every Friday morning.
            </p>
          </div>
          <div className="flex w-full max-w-md overflow-hidden rounded-sm border border-white/15">
            <input
              type="email"
              placeholder="you@email.com"
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none"
              aria-label="Email for weekly digest"
              readOnly
            />
            <button
              type="button"
              className="shrink-0 bg-white px-5 py-3 text-sm font-medium text-primary transition-opacity hover:opacity-90"
            >
              Subscribe →
            </button>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-10 py-14 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="font-display text-xl tracking-tight">
              <span className="font-medium">Bharat</span>Hunt
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
              India&apos;s home for makers — where creations find their people.
            </p>
          </div>

          <FooterCol
            title="Discover"
            links={[
              { label: 'Home', href: '/' },
              { label: 'Leaderboard', href: '#' },
              { label: 'Categories', href: '#' },
            ]}
          />
          <FooterCol
            title="Launch"
            links={[
              { label: 'Submit product', href: '#' },
              { label: 'Maker guide', href: '#' },
              { label: 'Best practices', href: '#' },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: 'About', href: '#' },
              { label: 'Privacy', href: '#' },
              { label: 'Terms', href: '#' },
            ]}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} BharatHunt. Made with care in India.</span>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-white/70">
              Browse all
            </Link>
            <span className="hover:text-white/70">FAQ</span>
            <span className="hover:text-white/70">Terms</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-medium text-white">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-white/50 transition-colors hover:text-white/80">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
