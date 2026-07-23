import { LaunchCta } from "../LaunchCta";

export function CtaBand() {
  return (
    <section className="bg-canvas py-20 md:py-24">
      <div className="mx-auto max-w-container px-6">
        <div className="rounded-lg bg-soft-stone px-8 py-16 text-center md:px-16 md:py-20">
          <p className="mono-label mb-4">Ready when you are</p>
          <h2 className="mx-auto max-w-2xl font-display text-4xl tracking-tight text-ink md:text-5xl">
            Ship something. Get discovered.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-body-muted">
            Join Indian makers who refuse to wait for permission. Launch this
            week — or schedule for next Friday and build in public until then.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <LaunchCta size="lg" />
            <span className="text-sm text-ink underline-offset-4">
              Explore the leaderboard →
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
