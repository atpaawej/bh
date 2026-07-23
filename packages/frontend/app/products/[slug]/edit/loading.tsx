export default function EditProductLoading() {
  return (
    <div className="mx-auto max-w-[680px] animate-pulse px-6 py-12">
      <div className="mx-auto mb-2 h-4 w-20 rounded bg-hairline/50" />
      <div className="mx-auto mb-3 h-10 w-72 rounded bg-hairline/60 md:h-12" />
      <div className="mx-auto mb-10 h-4 w-56 rounded bg-hairline/40" />
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 h-4 w-24 rounded bg-hairline/40" />
            <div className="h-10 w-full rounded-sm bg-hairline/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
