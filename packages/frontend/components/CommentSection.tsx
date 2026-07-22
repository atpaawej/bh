"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { CommentResponse } from "@bh/shared";
import { ApiClientError, fetchComments } from "../lib/api";
import { useAuth } from "../lib/auth/AuthContext";
import { CommentInput } from "./CommentInput";
import { CommentList } from "./CommentList";
import { CommentSectionSkeleton } from "./CommentSectionSkeleton";

type CommentSectionProps = {
  productSlug: string;
};

/**
 * Full threaded comment section for a product detail page.
 * Handles loading, empty, authenticated/unauthenticated states.
 */
export function CommentSection({ productSlug }: CommentSectionProps) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch comments
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchComments(productSlug);
        if (!cancelled) setComments(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Failed to load comments",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [productSlug, refreshKey]);

  // After a comment/reply is submitted or deleted, refresh the whole tree
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const currentUserId = user?.id ?? null;

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="mb-6 text-xl font-medium tracking-tight text-ink">
        Comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </h2>

      {/* Auth gate or input */}
      {authLoading ? (
        <div className="mb-6 h-20 animate-pulse rounded-sm bg-soft-stone" />
      ) : isAuthenticated ? (
        <div className="mb-8">
          <CommentInput
            productSlug={productSlug}
            onSubmitted={handleRefresh}
            placeholder="Share your thoughts…"
          />
        </div>
      ) : (
        <div className="mb-8 rounded-sm border border-hairline bg-soft-stone/50 px-5 py-4 text-center text-sm text-muted">
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(`/products/${productSlug}`)}`}
            className="font-medium text-action-blue underline-offset-4 hover:underline"
          >
            Sign in
          </Link>{" "}
          to leave a comment.
        </div>
      )}

      {/* States */}
      {loading ? (
        <CommentSectionSkeleton />
      ) : error ? (
        <div className="rounded-sm border border-error/20 bg-error/5 px-5 py-4 text-center">
          <p className="text-sm text-error">{error}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="mt-2 text-xs font-medium text-action-blue underline-offset-4 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-sm bg-soft-stone/50 px-5 py-10 text-center">
          <MessageSquare className="h-8 w-8 text-muted" strokeWidth={1.5} />
          <p className="text-sm text-muted">
            No comments yet — be the first to share feedback!
          </p>
        </div>
      ) : (
        <CommentList
          comments={comments}
          productSlug={productSlug}
          currentUserId={currentUserId}
          onDeleted={handleRefresh}
          onReplySubmitted={handleRefresh}
        />
      )}
    </section>
  );
}
