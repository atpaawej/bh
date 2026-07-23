"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ProductResponse } from "@bh/shared";
import { fetchMyProducts, ApiClientError } from "../lib/api";
import { ProtectedRoute } from "./auth/ProtectedRoute";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

type StatusConfig = {
  label: string;
  classes: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    label: "Draft",
    classes:
      "rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700",
  },
  submitted: {
    label: "Submitted",
    classes:
      "rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-700",
  },
  featured: {
    label: "Featured",
    classes:
      "rounded-full bg-deep-green/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-deep-green",
  },
};

type DashboardState = "loading" | "error" | "empty" | "success";

export function DashboardClient() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [state, setState] = useState<DashboardState>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await fetchMyProducts();
      setProducts(data);
      setState(data.length === 0 ? "empty" : "success");
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load your products. Please try again.";
      setError(message);
      setState("error");
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  if (state === "loading") {
    return <DashboardSkeleton />;
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-container px-6 pb-20 pt-12 md:pt-16">
        <div className="rounded-sm border border-error/30 bg-error/5 px-6 py-8 text-center">
          <p className="mb-4 text-sm text-error">{error}</p>
          <button
            type="button"
            onClick={loadProducts}
            className="inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div className="mx-auto max-w-container px-6 pb-20 pt-12 md:pt-16">
        <div className="mb-10">
          <p className="mono-label mb-2 text-xs text-muted">DASHBOARD</p>
          <h1 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
            My products
          </h1>
        </div>

        <div className="rounded-sm bg-soft-stone px-8 py-20 text-center">
          <p className="font-display text-2xl tracking-tight text-ink">
            You haven&apos;t launched anything yet
          </p>
          <p className="mt-3 text-body-muted">
            Be the first maker to share your product with the community.
          </p>
          <Link
            href="/launch"
            className="mt-8 inline-flex items-center justify-center rounded-pill bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Launch your first product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-12 md:pt-16">
      <div className="mb-8">
        <p className="mono-label mb-2 text-xs text-muted">DASHBOARD</p>
        <h1 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
          My products
        </h1>
        <p className="mt-2 text-body-muted">
          {products.length}{" "}
          {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      {/* Product list — table-like layout */}
      <div className="overflow-hidden rounded-sm border border-hairline">
        {/* Table header */}
        <div className="hidden border-b border-hairline bg-soft-stone/50 px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted md:grid md:grid-cols-[2fr_100px_80px_80px_100px_60px]">
          <span>Product</span>
          <span className="text-center">Status</span>
          <span className="text-center">Votes</span>
          <span className="text-center">Comments</span>
          <span className="text-center">Launched</span>
          <span className="text-right">Edit</span>
        </div>

        {products.map((product, i) => {
          const statusCfg = STATUS_CONFIG[product.status] ?? STATUS_CONFIG.draft;
          const isLast = i === products.length - 1;

          return (
            <div
              key={product.id}
              className={`grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-[2fr_100px_80px_80px_100px_60px] md:items-center md:gap-0 ${
                !isLast ? "border-b border-hairline" : ""
              }`}
            >
              {/* Product name + tagline */}
              <div className="min-w-0">
                <Link
                  href={`/products/${product.slug}`}
                  className="truncate text-sm font-medium text-ink transition hover:text-primary"
                >
                  {product.name}
                </Link>
                <p className="truncate text-xs text-muted">{product.tagline}</p>
              </div>

              {/* Status — mobile label */}
              <div className="flex items-center gap-2 md:justify-center">
                <span className="text-xs text-muted md:hidden">Status</span>
                <span className={statusCfg.classes}>{statusCfg.label}</span>
              </div>

              {/* Votes */}
              <div className="flex items-center gap-2 md:justify-center">
                <span className="text-xs text-muted md:hidden">Votes</span>
                <span className="text-sm text-ink">{product.voteCount}</span>
              </div>

              {/* Comments */}
              <div className="flex items-center gap-2 md:justify-center">
                <span className="text-xs text-muted md:hidden">Comments</span>
                <span className="text-sm text-ink">
                  {product.commentCount}
                </span>
              </div>

              {/* Launch date */}
              <div className="flex items-center gap-2 md:justify-center">
                <span className="text-xs text-muted md:hidden">Launched</span>
                <span className="text-sm text-ink">
                  {formatDate(product.launchedAt || null)}
                </span>
              </div>

              {/* Edit link */}
              <div className="flex items-center justify-end gap-2 md:justify-end">
                <Link
                  href={`/products/${product.slug}/edit`}
                  className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-ink"
                  title={`Edit ${product.name}`}
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.5} />
                  <span className="text-xs md:hidden">Edit</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
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
