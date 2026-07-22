import { ProductFeed } from '../components/ProductFeed'

export default function HomePage() {
  return (
    <>
      <section className="pb-8 pt-14 md:pb-12 md:pt-20">
        <div className="mx-auto max-w-container px-6 text-center">
          <p className="mono-label mb-4">Built for Indian makers</p>
          <h1 className="mx-auto max-w-4xl font-display text-5xl leading-none tracking-tight text-ink md:text-6xl lg:text-7xl">
            Discover what <span className="text-deep-green">India</span> is shipping this week
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-body-muted">
            BharatHunt is where makers launch products, early adopters find the next big thing, and
            the community decides what rises.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center rounded-pill bg-primary px-6 py-3 text-sm font-medium text-white">
              Launch your product
            </span>
            <span className="text-sm text-ink underline-offset-4 hover:underline">
              Explore leaderboard →
            </span>
          </div>
        </div>
      </section>

      <ProductFeed />
    </>
  )
}
