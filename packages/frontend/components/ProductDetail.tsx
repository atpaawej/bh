"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ProductResponse } from "@bh/shared";
import { ApiClientError, fetchProductBySlug } from "../lib/api";
import { useAuth } from "../lib/auth/AuthContext";
import { makerInitials, toVideoEmbedUrl } from "../lib/videoEmbed";
import { VoteButton } from "./VoteButton";
import { CommentSection } from "./CommentSection";

function formatVotes(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return String(count);
}

function formatLaunchDate(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

type ProductDetailProps = {
  /** Server-fetched product (public; hasVoted may be false). */
  initialProduct: ProductResponse;
};

/**
 * Full product detail view matching the Cohere prototype layout.
 * Re-fetches with the access token once auth is ready so hasVoted is accurate.
 */
export function ProductDetail({ initialProduct }: ProductDetailProps) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [product, setProduct] = useState(initialProduct);
  const isMaker = user?.id === product.maker.id;

  // Keep local state in sync when Next navigates between product slugs
  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    let cancelled = false;
    void fetchProductBySlug(initialProduct.slug)
      .then((fresh) => {
        if (!cancelled) setProduct(fresh);
      })
      .catch((err) => {
        // Keep SSR data if refresh fails (e.g. transient network)
        if (!(err instanceof ApiClientError)) return;
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, initialProduct.slug]);

  const embedUrl = product.videoUrl ? toVideoEmbedUrl(product.videoUrl) : null;
  const descriptionParagraphs = product.description
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-8">
      <nav
        className="mb-7 flex flex-wrap items-center gap-2 text-[13px] text-muted"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="transition hover:text-ink">
          Home
        </Link>
        <span aria-hidden>→</span>
        <span className="text-muted">{product.category.name}</span>
        <span aria-hidden>→</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 pb-16 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-7 aspect-video overflow-hidden rounded-lg bg-soft-stone">
            {product.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.heroImageUrl}
                alt={`${product.name} hero`}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="mb-4 flex items-start gap-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-card-border bg-canvas">
              {product.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.logoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-3xl tracking-tight text-ink md:text-4xl">
                {product.name}
              </h1>
              <p className="mt-2 text-lg leading-snug text-body-muted">
                {product.tagline}
              </p>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-medium text-coral">
              {product.category.name}
            </span>
            {product.launchedAt ? (
              <span className="rounded-full bg-soft-stone px-3 py-1 text-xs text-body-muted">
                Launched {formatLaunchDate(product.launchedAt)}
              </span>
            ) : null}
          </div>

          {isMaker ? (
            <div className="mb-5">
              <Link
                href={`/products/${product.slug}/edit`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-hairline px-4 py-2 text-xs font-medium text-ink transition hover:bg-soft-stone"
              >
                Edit product
              </Link>
            </div>
          ) : null}

          <div className="mb-9 flex items-center gap-3 border-y border-hairline py-[18px]">
            <Link
              href={product.maker.username ? `/users/${product.maker.username}` : "#"}
              onClick={(e) => {
                if (!product.maker.username) e.preventDefault();
              }}
              className="shrink-0"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-deep-green text-[13px] font-medium text-white">
                {product.maker.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.maker.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  makerInitials(product.maker.name)
                )}
              </div>
            </Link>
            <div className="min-w-0">
              <Link
                href={product.maker.username ? `/users/${product.maker.username}` : "#"}
                onClick={(e) => {
                  if (!product.maker.username) e.preventDefault();
                }}
                className="text-[15px] font-medium text-ink transition hover:text-deep-green"
              >
                {product.maker.name}
              </Link>
              <div className="text-[13px] text-muted">Maker</div>
            </div>
          </div>

          <section className="mb-9">
            <h2 className="mb-3 text-xl font-medium tracking-tight text-ink">
              About
            </h2>
            {descriptionParagraphs.map((paragraph, i) => (
              <p
                key={i}
                className="mb-4 text-[15px] leading-relaxed text-body-muted last:mb-0"
              >
                {paragraph}
              </p>
            ))}
          </section>

          {product.galleryUrls.length > 0 ? (
            <section className="mb-9">
              <h2 className="mb-4 text-xl font-medium tracking-tight text-ink">
                Gallery
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {product.galleryUrls.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="aspect-video overflow-hidden rounded-md bg-soft-stone"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${product.name} gallery ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {product.videoUrl ? (
            <section className="mb-9">
              <h2 className="mb-4 text-xl font-medium tracking-tight text-ink">
                Video
              </h2>
              {embedUrl ? (
                <div className="aspect-video overflow-hidden rounded-lg bg-soft-stone">
                  <iframe
                    src={embedUrl}
                    title={`${product.name} video`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-action-blue underline-offset-4 hover:underline"
                >
                  Watch video ↗
                </a>
              )}
            </section>
          ) : null}

          <CommentSection productSlug={product.slug} />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 rounded-sm bg-soft-stone p-7 text-center">
            <div className="font-display text-5xl tracking-tight text-deep-green">
              {formatVotes(product.voteCount)}
            </div>
            <div className="mb-5 text-[13px] text-muted">upvotes</div>

            <VoteButton
              productId={product.id}
              productSlug={product.slug}
              initialHasVoted={product.hasVoted}
              initialVoteCount={product.voteCount}
              onVote={(updated) =>
                setProduct((prev) => ({ ...prev, ...updated }))
              }
              variant="detail"
            />

            <a
              href={product.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-pill border border-primary px-6 py-3 text-sm font-medium text-primary transition hover:bg-canvas"
            >
              Visit website
            </a>

            {product.demoUrl ? (
              <a
                href={product.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex w-full items-center justify-center rounded-pill border border-hairline px-6 py-3 text-sm font-medium text-ink transition hover:bg-canvas"
              >
                Try demo
              </a>
            ) : null}
          </div>

          <div className="rounded-sm border border-hairline bg-canvas p-6">
            <h3 className="mb-4 text-sm font-medium text-ink">Details</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Category</dt>
                <dd className="text-right text-ink">{product.category.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Launched</dt>
                <dd className="text-right text-ink">
                  {formatLaunchDate(product.launchedAt)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Maker</dt>
                <dd className="text-right text-ink">{product.maker.name}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-container animate-pulse px-6 pb-20 pt-8">
      <div className="mb-7 h-4 w-48 rounded bg-hairline/50" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-7 aspect-video rounded-lg bg-soft-stone" />
          <div className="mb-4 flex gap-4">
            <div className="h-14 w-14 rounded-sm bg-hairline/60" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-8 w-2/3 rounded bg-hairline/60" />
              <div className="h-5 w-full rounded bg-hairline/40" />
            </div>
          </div>
          <div className="mb-5 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-hairline/50" />
            <div className="h-6 w-28 rounded-full bg-hairline/40" />
          </div>
          <div className="mb-9 flex gap-3 border-y border-hairline py-4">
            <div className="h-10 w-10 rounded-full bg-hairline/60" />
            <div className="space-y-2 pt-1">
              <div className="h-4 w-32 rounded bg-hairline/50" />
              <div className="h-3 w-16 rounded bg-hairline/40" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-5 w-24 rounded bg-hairline/50" />
            <div className="h-4 w-full rounded bg-hairline/40" />
            <div className="h-4 w-full rounded bg-hairline/40" />
            <div className="h-4 w-4/5 rounded bg-hairline/40" />
          </div>
        </div>
        <aside>
          <div className="mb-3 rounded-sm bg-soft-stone p-7">
            <div className="mx-auto mb-2 h-12 w-20 rounded bg-hairline/50" />
            <div className="mx-auto mb-5 h-3 w-28 rounded bg-hairline/40" />
            <div className="mb-2 h-11 w-full rounded-pill bg-hairline/50" />
            <div className="h-11 w-full rounded-pill bg-hairline/40" />
          </div>
          <div className="h-40 rounded-sm border border-hairline bg-canvas" />
        </aside>
      </div>
    </div>
  );
}
