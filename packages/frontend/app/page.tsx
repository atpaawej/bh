import { ProductFeed } from '../components/ProductFeed'
import { LaunchCta } from '../components/LaunchCta'
import { CtaBand } from '../components/landing/CtaBand'
import { HowItWorks } from '../components/landing/HowItWorks'
import { MakerStory } from '../components/landing/MakerStory'
import { TrustStrip } from '../components/landing/TrustStrip'
import { WhySection } from '../components/landing/WhySection'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
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
            <LaunchCta size="md" />
            <span className="text-sm text-ink underline-offset-4 hover:underline">
              Explore leaderboard →
            </span>
          </div>
        </div>
      </section>

      {/* Live weekly feed */}
      <ProductFeed />

      {/* Marketing story below the feed */}
      <TrustStrip />
      <WhySection />
      <MakerStory />
      <HowItWorks />
      <CtaBand />
    </>
  )
}
