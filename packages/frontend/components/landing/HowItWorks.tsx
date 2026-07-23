const STEPS = [
  {
    day: "Fri",
    title: "New week opens",
    body: "The leaderboard resets at 00:00 UTC. Scheduled launches go live. Everyone starts fresh.",
  },
  {
    day: "Sat–Wed",
    title: "Ship & rise",
    body: "Launch instantly or ride the week. Collect upvotes, answer comments, watch the ranking move.",
  },
  {
    day: "Thu",
    title: "Week closes",
    body: "Final votes land. Winners freeze into history. The archive keeps every week forever.",
  },
  {
    day: "You",
    title: "One honest vote",
    body: "No downvotes. No paid boosts. One upvote per product — pure community signal.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-soft-stone py-20 md:py-24">
      <div className="mx-auto max-w-container px-6">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mono-label mb-3">How it works</p>
            <h2 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
              A week that treats every launch fairly
            </h2>
          </div>
          <p className="max-w-sm text-body-muted md:text-right">
            Same window. Same rules. Pure vote count. That is the entire game.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.day} className="rounded-sm bg-canvas p-7">
              <span className="mb-5 inline-flex rounded-full border border-coral-soft px-3 py-1 font-mono text-xs text-coral">
                {step.day}
              </span>
              <h3 className="mb-2 text-xl font-medium tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-body-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
