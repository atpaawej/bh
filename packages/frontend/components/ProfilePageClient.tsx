"use client";

import Link from "next/link";
import type { ProfileResponse, ProductResponse } from "@bh/shared";
import { Globe, Twitter } from "lucide-react";
import { makerInitials } from "../lib/videoEmbed";
import { ProductCard } from "./ProductCard";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

type ProfilePageClientProps = {
  initialProfile: ProfileResponse;
};

export function ProfilePageClient({ initialProfile }: ProfilePageClientProps) {
  const { user, products } = initialProfile;
  const productCount = products.length;
  const joinedDate = formatDate(user.createdAt);

  return (
    <div className="mx-auto max-w-container px-6 pb-20 pt-12 md:pt-16">
      {/* Profile header */}
      <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {/* Avatar */}
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-deep-green text-3xl font-medium text-white md:h-28 md:w-28">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          ) : (
            makerInitials(user.name)
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <h1 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
            {user.name}
          </h1>

          {user.bio ? (
            <p className="mt-2 max-w-xl text-body-muted">{user.bio}</p>
          ) : null}

          {/* Social links */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
            {user.twitterHandle ? (
              <a
                href={`https://twitter.com/${user.twitterHandle.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition hover:text-ink"
              >
                <Twitter className="h-4 w-4" strokeWidth={1.5} />
                @{user.twitterHandle.replace(/^@/, "")}
              </a>
            ) : null}

            {user.website ? (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition hover:text-ink"
              >
                <Globe className="h-4 w-4" strokeWidth={1.5} />
                {new URL(user.website).hostname}
              </a>
            ) : null}

            {joinedDate ? (
              <span className="inline-flex items-center gap-1.5">
                Joined {joinedDate}
              </span>
            ) : null}
          </div>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted">
              <strong className="text-ink">{productCount}</strong>{" "}
              {productCount === 1 ? "product" : "products"} launched
            </span>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div>
        <p className="mono-label mb-6">Products launched</p>

        {productCount === 0 ? (
          <div className="rounded-sm bg-soft-stone px-8 py-16 text-center">
            <p className="font-display text-2xl tracking-tight text-ink">
              No products yet
            </p>
            <p className="mt-3 text-body-muted">
              This maker hasn&apos;t launched any products yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product: ProductResponse) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="mx-auto max-w-container animate-pulse px-6 pb-20 pt-12 md:pt-16">
      <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <div className="h-24 w-24 rounded-sm bg-hairline/60 md:h-28 md:w-28" />
        <div className="flex-1 space-y-3">
          <div className="h-10 w-64 rounded bg-hairline/60 md:h-12" />
          <div className="h-5 w-96 max-w-full rounded bg-hairline/40" />
          <div className="flex gap-4">
            <div className="h-4 w-28 rounded bg-hairline/40" />
            <div className="h-4 w-32 rounded bg-hairline/40" />
            <div className="h-4 w-24 rounded bg-hairline/40" />
          </div>
          <div className="h-4 w-36 rounded bg-hairline/40" />
        </div>
      </div>

      <div className="mb-6 h-4 w-36 rounded bg-hairline/50" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[280px] animate-pulse flex-col rounded-sm bg-soft-stone p-7"
          >
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
        ))}
      </div>
    </div>
  );
}
