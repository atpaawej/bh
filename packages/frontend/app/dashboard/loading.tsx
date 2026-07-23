export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-container animate-pulse px-6 pb-20 pt-12 md:pt-16">
      <div className="mb-8 space-y-3">
        <div className="h-4 w-20 rounded bg-hairline/50" />
        <div className="h-10 w-48 rounded bg-hairline/60 md:h-12" />
        <div className="h-4 w-32 rounded bg-hairline/40" />
      </div>

      <div className="overflow-hidden rounded-sm border border-hairline">
        <div className="hidden border-b border-hairline bg-soft-stone/50 px-6 py-3 md:grid md:grid-cols-[2fr_100px_80px_80px_100px_60px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 rounded bg-hairline/40" />
          ))}
        </div>

        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-[2fr_100px_80px_80px_100px_60px] md:items-center md:gap-0 ${
              i < 3 ? "border-b border-hairline" : ""
            }`}
          >
            <div className="space-y-2">
              <div className="h-4 w-40 rounded bg-hairline/60" />
              <div className="h-3 w-56 rounded bg-hairline/40" />
            </div>
            <div className="h-5 w-16 rounded-full bg-hairline/50 md:mx-auto" />
            <div className="h-4 w-8 rounded bg-hairline/50 md:mx-auto" />
            <div className="h-4 w-8 rounded bg-hairline/50 md:mx-auto" />
            <div className="h-4 w-16 rounded bg-hairline/50 md:mx-auto" />
            <div className="h-4 w-6 rounded bg-hairline/50 md:ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
