const CAPABILITIES = [
  {
    title: "Weekly ranking",
    body: "Friday to Thursday cycles. Every product starts equal — the community decides what wins.",
    icon: (
      <svg
        className="h-9 w-9"
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <circle cx="18" cy="18" r="14" />
        <path d="M18 10v8l5 3" />
      </svg>
    ),
  },
  {
    title: "One vote, real signal",
    body: "One upvote per product per user. No bots, no pile-ons — just genuine community taste.",
    icon: (
      <svg
        className="h-9 w-9"
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M8 26L18 8l10 18H8z" />
        <path d="M14 20h8" />
      </svg>
    ),
  },
  {
    title: "Built for Indian makers",
    body: "A launchpad that understands UPI, vernacular product sense, and the hustle of shipping from India.",
    icon: (
      <svg
        className="h-9 w-9"
        viewBox="0 0 36 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <rect x="6" y="10" width="24" height="16" rx="2" />
        <path d="M6 16h24" />
        <circle cx="12" cy="13" r="1" fill="currentColor" />
      </svg>
    ),
  },
];

export function WhySection() {
  return (
    <section className="bg-deep-green py-20 text-white md:py-24">
      <div className="mx-auto max-w-container px-6">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.08em] text-white/45">
          Why BharatHunt
        </p>
        <h2 className="mb-4 max-w-xl font-display text-4xl tracking-tight md:text-5xl">
          A fair launchpad for every maker
        </h2>
        <p className="mb-12 max-w-lg text-lg text-white/70">
          No gatekeepers. No editorial review. Weekly cycles give every product
          a clean shot at the top — whether you ship from Bengaluru, Indore, or
          a hostel room in Pune.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {CAPABILITIES.map((item) => (
            <div
              key={item.title}
              className="rounded-xs border border-white/10 bg-white/[0.04] p-7"
            >
              <div className="mb-5 text-white/80">{item.icon}</div>
              <h3 className="mb-2 text-xl font-medium tracking-tight">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/65">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
