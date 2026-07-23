import { ProductCardSkeleton } from "../../components/ProductCard";

export default function LeaderboardLoading() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-container px-6">
        <div className="mb-10 animate-pulse space-y-3">
          <div className="h-4 w-16 rounded bg-hairline/40" />
          <div className="h-12 w-64 rounded bg-hairline/60" />
          <div className="h-5 w-40 rounded bg-hairline/40" />
        </div>

        <div className="mb-10 flex animate-pulse items-center justify-between">
          <div className="h-9 w-36 rounded-pill bg-hairline/50" />
          <div className="h-5 w-24 rounded-full bg-deep-green/10" />
          <div className="h-9 w-36 rounded-pill bg-hairline/50" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
