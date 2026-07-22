"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProductResponse } from "@bh/shared";
import { VoteButton } from "./VoteButton";

export function ProductCard({
  product: initialProduct,
}: {
  product: ProductResponse;
}) {
  const [product, setProduct] = useState(initialProduct);

  // Sync local state when prop changes (e.g. after feed re-fetch with updated hasVoted)
  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);
  const logoSrc = product.logoUrl || product.heroImageUrl;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex min-h-[280px] flex-col rounded-sm bg-soft-stone p-7 transition-colors hover:bg-[#e6e4de]"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-sm border border-card-border bg-canvas">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <VoteButton
          productId={product.id}
          productSlug={product.slug}
          initialHasVoted={product.hasVoted}
          initialVoteCount={product.voteCount}
          onVote={(updated) => setProduct((prev) => ({ ...prev, ...updated }))}
          variant="card"
          inCard
        />
      </div>

      {product.heroImageUrl ? (
        <div className="mb-4 h-28 w-full overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.heroImageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <h3 className="mb-2 text-xl font-medium tracking-tight text-ink">
        {product.name}
      </h3>
      <p className="mb-5 flex-1 text-sm leading-relaxed text-body-muted">
        {product.tagline}
      </p>

      <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-hairline">
            {product.maker.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.maker.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] font-medium text-muted">
                {product.maker.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="truncate text-xs text-muted">
            {product.maker.name}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-card-border bg-canvas px-2.5 py-1 text-xs text-body-muted">
          {product.category.name}
        </span>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex min-h-[280px] animate-pulse flex-col rounded-sm bg-soft-stone p-7">
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
  );
}
