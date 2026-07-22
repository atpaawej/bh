const NAMES = ['Zerodha', 'Razorpay', 'CRED', 'Groww', 'Meesho', 'BharatPe', 'PhonePe', 'Postman']

export function TrustStrip() {
  return (
    <section className="border-y border-hairline py-14 md:py-16">
      <div className="mx-auto max-w-container px-6 text-center">
        <p className="mono-label mb-8">Trusted by makers who shipped at</p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:gap-x-14">
          {NAMES.map((name) => (
            <span
              key={name}
              className="font-display text-lg tracking-tight text-ink/70 md:text-xl"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
