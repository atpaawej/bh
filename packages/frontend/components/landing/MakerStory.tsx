const MOMENTS = [
  {
    label: "01",
    title: "You built something real",
    body: "A side project at 2 a.m. A SaaS for your local shop. An API that finally works. The hard part is done — but the internet still does not know your name.",
  },
  {
    label: "02",
    title: "You deserve a fair stage",
    body: "Global platforms are crowded and curated. Social feeds bury you in noise. BharatHunt gives every launch the same Friday start line — and lets the community decide.",
  },
  {
    label: "03",
    title: "India finds you",
    body: "Early adopters, fellow makers, and curious builders show up. One honest upvote. One comment that unlocks your next feature. Momentum that feels earned.",
  },
];

export function MakerStory() {
  return (
    <section className="bg-canvas py-20 md:py-24">
      <div className="mx-auto max-w-container px-6">
        <div className="mb-14 max-w-2xl">
          <p className="mono-label mb-4">The story</p>
          <h2 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
            Creations deserve to find their people
          </h2>
          <p className="mt-5 text-lg text-body-muted">
            Indian makers ship incredible products every week — tools, apps,
            experiments, and quiet revolutions. Most of them never get a proper
            launchpad. We built BharatHunt so they do.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-sm border border-hairline bg-hairline md:grid-cols-3">
          {MOMENTS.map((m) => (
            <article key={m.label} className="bg-canvas p-8 md:p-10">
              <p className="mb-6 font-mono text-xs tracking-[0.12em] text-coral">
                {m.label}
              </p>
              <h3 className="mb-3 text-2xl font-medium tracking-tight text-ink">
                {m.title}
              </h3>
              <p className="text-sm leading-relaxed text-body-muted">
                {m.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
