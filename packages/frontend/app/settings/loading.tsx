export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-[640px] animate-pulse px-6 py-12">
      <div className="mb-2 h-4 w-20 rounded bg-hairline/50" />
      <div className="mb-8 h-10 w-48 rounded bg-hairline/60 md:h-12" />
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 h-4 w-24 rounded bg-hairline/40" />
            <div className="h-10 w-full rounded-sm bg-hairline/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
