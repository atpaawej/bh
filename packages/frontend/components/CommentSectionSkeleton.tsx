/**
 * Loading skeleton shown while comments are being fetched.
 */
export function CommentSectionSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-5 w-32 rounded bg-hairline/50" />
      <div className="h-20 w-full rounded-sm bg-soft-stone" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="h-9 w-9 rounded-full bg-hairline/60" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="flex gap-2">
              <div className="h-3 w-24 rounded bg-hairline/50" />
              <div className="h-3 w-12 rounded bg-hairline/40" />
            </div>
            <div className="h-4 w-3/4 rounded bg-hairline/40" />
            <div className="h-4 w-1/2 rounded bg-hairline/40" />
          </div>
        </div>
      ))}
    </div>
  );
}
