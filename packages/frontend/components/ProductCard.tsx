"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProductResponse } from "@bh/shared";
import { VoteButton } from "./VoteButton";

export function ProductCard({
  product: initialProduct,
  rank,
}: {
  product: ProductResponse;
  /** Optional rank position to display as a badge (leaderboard). */
  rank?: number;
}) {
  const router = useRouter();
  const [product, setProduct] = useState(initialProduct);

  // Sync local state when prop changes (e.g. after feed re-fetch with updated hasVoted)
  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  const logoSrc = product.logoUrl || product.heroImageUrl;

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't navigate when clicking on interactive children (links, buttons)
      if ((e.target as HTMLElement).closest("a, button")) return;
      router.push(`/products/${product.slug}`);
    },
    [router, product.slug],
  );

  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        router.push(`/products/${product.slug}`);
      }
    },
    [router, product.slug],
  );

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      className="group flex min-h-[280px] cursor-pointer flex-col rounded-sm bg-soft-stone p-7 transition-colors hover:bg-[#e6e4de]"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {rank != null ? (
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm font-mono text-sm font-medium ${
                rank <= 3
                  ? "bg-deep-green text-white"
                  : "border border-hairline text-muted"
              }`}
            >
              {rank}
            </span>
          ) : null}
          <div className="h-12 w-12 overflow-hidden rounded-sm border border-card-border bg-canvas">
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
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
          <Link
            href={product.maker.username ? `/users/${product.maker.username}` : "#"}
            onClick={(e) => {
              if (!product.maker.username) e.preventDefault();
            }}
            className="shrink-0"
          >
            <div className="h-6 w-6 overflow-hidden rounded-full bg-hairline">
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
          </Link>
          <Link
            href={product.maker.username ? `/users/${product.maker.username}` : "#"}
            onClick={(e) => {
              if (!product.maker.username) e.preventDefault();
            }}
            className="truncate text-xs text-muted transition hover:text-ink"
          >
            {product.maker.name}
          </Link>
        </div>
        <span className="shrink-0 rounded-full border border-card-border bg-canvas px-2.5 py-1 text-xs text-body-muted">
          {product.category.name}
        </span>
      </div>
    </div>
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
