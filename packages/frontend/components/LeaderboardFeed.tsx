"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProductResponse } from "@bh/shared";
import { ApiClientError, fetchLeaderboard } from "../lib/api";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import {
  formatWeekLabel,
  getCurrentIsoWeek,
  getNextWeek,
  getPrevWeek,
  isCurrentWeek,
} from "../lib/week";

export function LeaderboardFeed() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekFromUrl = searchParams.get("week");

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const currentWeek = getCurrentIsoWeek();
  const week = weekFromUrl ?? currentWeek;
  const isCurrent = isCurrentWeek(week);
  const weekLabel = formatWeekLabel(week);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProducts([]);

    try {
      // Fetch all products for the week ranked by votes
      const page = await fetchLeaderboard({ week });
      setProducts(page.data);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Something went wrong loading the leaderboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts, reloadKey]);

  function navigateToWeek(nextWeek: string) {
    if (nextWeek === currentWeek) {
      router.push("/leaderboard", { scroll: false });
    } else {
      router.push(`/leaderboard?week=${nextWeek}`, { scroll: false });
    }
  }

  function handlePrev() {
    navigateToWeek(getPrevWeek(week));
  }

  function handleNext() {
    navigateToWeek(getNextWeek(week));
  }

  function handleRetry() {
    setReloadKey((k) => k + 1);
  }

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-container px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            {!isCurrent ? (
              <p className="mono-label mb-3">Archive</p>
            ) : (
              <p className="mono-label mb-3">Live</p>
            )}
            <h1 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
              Leaderboard
            </h1>
            <p className="mt-2 text-body-muted">{weekLabel}</p>
          </div>
        </div>

        {/* Week picker */}
        <div className="mb-10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            className="inline-flex items-center gap-1 rounded-pill border border-hairline bg-canvas px-4 py-2 text-sm font-medium text-ink transition hover:bg-soft-stone"
          >
            ← Previous week
          </button>

          <div className="flex items-center gap-2 text-sm text-muted">
            {isCurrent ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-deep-green/10 px-3 py-1 font-medium text-deep-green">
                <span
                  className="h-2 w-2 rounded-full bg-deep-green"
                  aria-hidden
                />
                Current week
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={isCurrent}
            className="inline-flex items-center gap-1 rounded-pill border border-hairline bg-canvas px-4 py-2 text-sm font-medium text-ink transition hover:bg-soft-stone disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next week →
          </button>
        </div>

        {/* Error state */}
        {error ? (
          <div className="rounded-sm border border-error/20 bg-soft-stone px-8 py-12 text-center">
            <p className="text-error">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-6 inline-flex items-center rounded-pill bg-primary px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Try again
            </button>
          </div>
        ) : null}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : null}

        {/* Empty state */}
        {!loading && !error && products.length === 0 ? (
          <div className="rounded-sm bg-soft-stone px-8 py-16 text-center">
            <p className="font-display text-2xl tracking-tight text-ink">
              No products launched that week
            </p>
            <p className="mt-3 text-body-muted">
              The community was quiet that week. Browse a different week or{" "}
              <a
                href="/launch"
                className="text-ink underline underline-offset-2"
              >
                launch something new
              </a>
              .
            </p>
          </div>
        ) : null}

        {/* Product grid with rank badges */}
        {!loading && products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                rank={index + 1}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
