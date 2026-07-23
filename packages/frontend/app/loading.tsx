export default function RootLoading() {
  return (
    <div className="mx-auto max-w-container px-6 py-20">
      <div className="animate-pulse space-y-10">
        {/* Hero skeleton */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 h-4 w-28 rounded bg-hairline/40" />
          <div className="mx-auto mb-4 h-14 w-3/4 rounded bg-hairline/60" />
          <div className="mx-auto mb-6 h-16 w-2/3 rounded bg-hairline/40" />
          <div className="flex justify-center gap-4">
            <div className="h-12 w-36 rounded-pill bg-hairline/50" />
            <div className="h-12 w-44 rounded bg-hairline/40" />
          </div>
        </div>

        {/* Feed skeleton */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-[280px] animate-pulse flex-col rounded-sm bg-soft-stone p-7"
            >
              <div className="mb-5 flex items-start justify-between">
                <div className="h-12 w-12 rounded-sm bg-hairline/60" />
                <div className="h-12 w-14 rounded-sm bg-hairline/60" />
              </div>
              <div className="mb-4 h-28 w-full rounded-sm bg-hairline/50" />
              <div className="mb-2 h-6 w-2/3 rounded bg-hairline/60" />
              <div className="mb-2 h-4 w-full rounded bg-hairline/40" />
              <div className="mb-5 h-4 w-4/5 rounded bg-hairline/40" />
              <div className="mt-auto flex items-center justify-between border-t border-black/[0.06] pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-hairline/60" />
                  <div className="h-3 w-16 rounded bg-hairline/40" />
                </div>
                <div className="h-6 w-20 rounded-full bg-hairline/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
