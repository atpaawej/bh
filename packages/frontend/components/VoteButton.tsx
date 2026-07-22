"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiClientError, voteForProduct, unvoteForProduct } from "../lib/api";
import { useAuth } from "../lib/auth/AuthContext";

function formatVotes(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return String(count);
}

interface VoteButtonProps {
  productId: string;
  productSlug: string;
  initialHasVoted: boolean;
  initialVoteCount: number;
  /** Called with the server-returned product data after a successful vote/unvote. */
  onVote?: (updated: { hasVoted: boolean; voteCount: number }) => void;
  /** Visual variant: 'card' renders inline with the card layout, 'detail' renders the sidebar button. */
  variant?: "card" | "detail";
  /** For card variant, the wrapping link triggers stopPropagation. */
  inCard?: boolean;
}

/**
 * Upvote button with optimistic UI.
 *
 * - Authenticated: toggles vote/unvote instantly with optimistic count.
 * - Unauthenticated: redirects to login with return URL.
 * - Rate-limited: shows a temporary inline error.
 * - API failure: reverts optimistic state.
 */
export function VoteButton({
  productId,
  productSlug,
  initialHasVoted,
  initialVoteCount,
  onVote,
  variant = "detail",
  inCard = false,
}: VoteButtonProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Sync when the parent re-renders with new initial values (e.g. after server re-fetch)
  const initialRef = useRef({ initialHasVoted, initialVoteCount });
  useEffect(() => {
    if (
      initialHasVoted !== initialRef.current.initialHasVoted ||
      initialVoteCount !== initialRef.current.initialVoteCount
    ) {
      initialRef.current = { initialHasVoted, initialVoteCount };
      setHasVoted(initialHasVoted);
      setVoteCount(initialVoteCount);
    }
  }, [initialHasVoted, initialVoteCount]);

  // Also clear local error when external state changes (prop sync)
  useEffect(() => {
    setError(null);
  }, [initialHasVoted, initialVoteCount]);

  // Auto-clear inline error after 4 s
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(id);
  }, [error]);

  const handleVote = useCallback(
    async (e: React.MouseEvent) => {
      if (inCard) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (authLoading) return;
      if (!isAuthenticated) {
        router.push(
          `/auth/login?redirect=${encodeURIComponent(`/products/${productSlug}`)}`,
        );
        return;
      }

      if (pending) return;

      // ── Optimistic update ──
      const prevHasVoted = hasVoted;
      const prevVoteCount = voteCount;
      setPending(true);
      setError(null);

      // Optimistically toggle
      setHasVoted(!prevHasVoted);
      setVoteCount((c) => (prevHasVoted ? c - 1 : c + 1));

      try {
        const updated = prevHasVoted
          ? await unvoteForProduct(productSlug)
          : await voteForProduct(productSlug);

        // Apply server truth
        setHasVoted(updated.hasVoted);
        setVoteCount(updated.voteCount);
        onVote?.({ hasVoted: updated.hasVoted, voteCount: updated.voteCount });
      } catch (err) {
        // Revert optimistic update
        setHasVoted(prevHasVoted);
        setVoteCount(prevVoteCount);

        if (err instanceof ApiClientError && err.code === "RATE_LIMITED") {
          setError("Voting too fast — please slow down");
        } else if (err instanceof ApiClientError && err.status === 409) {
          setError(prevHasVoted ? "You haven't voted yet" : "Already voted");
        } else {
          setError("Something went wrong");
        }
      } finally {
        setPending(false);
      }
    },
    [
      authLoading,
      hasVoted,
      inCard,
      isAuthenticated,
      onVote,
      pending,
      productSlug,
      router,
      voteCount,
    ],
  );

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleVote}
        disabled={pending || authLoading}
        aria-label={hasVoted ? "Remove upvote" : "Upvote"}
        className={`relative inline-flex min-w-[52px] flex-col items-center gap-0.5 rounded-sm border px-3 py-2 font-mono text-xs transition-colors ${
          hasVoted
            ? "border-deep-green bg-deep-green/10 text-deep-green"
            : "border-hairline bg-canvas text-ink hover:border-deep-green hover:text-deep-green"
        } ${pending ? "cursor-wait opacity-60" : ""}`}
      >
        <span className="text-[10px] leading-none" aria-hidden>
          ▲
        </span>
        <span>{formatVotes(voteCount)}</span>
        {error ? (
          <span className="absolute mt-10 w-max max-w-[140px] whitespace-nowrap rounded-sm bg-error px-2 py-1 text-[10px] font-sans text-white">
            {error}
          </span>
        ) : null}
      </button>
    );
  }

  // ── Detail variant ──
  return (
    <>
      <button
        type="button"
        onClick={handleVote}
        disabled={pending || authLoading}
        aria-label={hasVoted ? "Remove upvote" : "Upvote"}
        className={`mb-2 inline-flex w-full items-center justify-center gap-2 rounded-pill px-6 py-3 text-sm font-medium text-white transition ${
          hasVoted
            ? "bg-deep-green hover:bg-deep-green/90"
            : "bg-primary hover:opacity-90"
        } ${pending ? "cursor-wait opacity-60" : ""}`}
      >
        <span aria-hidden>▲</span>
        {hasVoted ? "Upvoted" : "Upvote"} · {formatVotes(voteCount)}
      </button>
      {error ? (
        <p className="mb-2 text-center text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
