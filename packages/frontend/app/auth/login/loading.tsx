export default function LoginLoading() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] animate-pulse items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-hairline bg-canvas p-8 shadow-sm md:p-10">
        <div className="mb-4 h-4 w-24 rounded bg-hairline/50" />
        <div className="mb-3 h-10 w-64 rounded bg-hairline/60" />
        <div className="mb-8 h-4 w-56 rounded bg-hairline/40" />
        <div className="space-y-4">
          <div className="h-12 w-full rounded-sm bg-hairline/50" />
          <div className="h-12 w-full rounded-sm bg-hairline/50" />
        </div>
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-hairline" />
          <div className="h-3 w-8 rounded bg-hairline/40" />
          <div className="h-px flex-1 bg-hairline" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-hairline/40" />
          <div className="h-12 w-full rounded-sm bg-hairline/50" />
          <div className="h-12 w-full rounded-pill bg-hairline/50" />
        </div>
      </div>
    </div>
  );
}
