"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { CommentResponse } from "@bh/shared";
import {
  ApiClientError,
  createComment,
  deleteComment,
  fetchComments,
} from "../lib/api";
import { useAuth } from "../lib/auth/AuthContext";

// ── Helpers ──

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function makerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

const MAX_COMMENT_LENGTH = 1000;

// ── Avatar ──

function CommentAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  if (avatarUrl && !failed) {
    return (
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-soft-stone">
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft-stone text-[12px] font-medium text-muted">
      {makerInitials(name)}
    </div>
  );
}

// ── Comment Input ──

function CommentInput({
  productSlug,
  parentId,
  onSubmitted,
  onCancel,
  placeholder = "Write a comment…",
  autoFocus = false,
}: {
  productSlug: string;
  parentId?: string | null;
  onSubmitted: (comment: CommentResponse) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaId = useId();

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAuthenticated) return;

      const trimmed = body.trim();
      if (!trimmed || trimmed.length > MAX_COMMENT_LENGTH) return;

      if (pending) return;
      setPending(true);
      setError(null);

      try {
        const comment = await createComment(productSlug, {
          body: trimmed,
          parentId: parentId ?? null,
        });
        setBody("");
        onSubmitted(comment);
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
      } finally {
        setPending(false);
      }
    },
    [body, isAuthenticated, parentId, pending, productSlug, onSubmitted],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={textareaId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
          disabled={pending}
          className="w-full resize-none rounded-sm border border-hairline bg-canvas p-3 text-sm text-ink outline-none transition focus:border-muted focus:ring-1 focus:ring-muted disabled:opacity-60"
        />
        <span
          className={`absolute bottom-2 right-3 text-[11px] ${
            body.length > MAX_COMMENT_LENGTH
              ? "text-error"
              : "text-muted"
          }`}
        >
          {body.length}/{MAX_COMMENT_LENGTH}
        </span>
      </div>

      {error ? (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending || !body.trim() || body.length > MAX_COMMENT_LENGTH}
          className="rounded-pill bg-primary px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Posting…" : "Submit"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-pill px-3 py-1.5 text-xs text-muted transition hover:text-ink"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

// ── Single Comment ──

function CommentItem({
  comment,
  productSlug,
  currentUserId,
  onDeleted,
}: {
  comment: CommentResponse;
  productSlug: string;
  currentUserId: string | null;
  onDeleted: (id: string) => void;
  onReplySubmitted?: () => void;
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isOwn = currentUserId === comment.user.id;
  const isReply = comment.parentId !== null;

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteComment(productSlug, comment.id);
      onDeleted(comment.id);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setDeleteError(err.message);
      } else {
        setDeleteError("Something went wrong");
      }
      setDeleting(false);
      setConfirmDelete(false);
    }
  }, [comment.id, deleting, onDeleted, productSlug]);

  const handleReplySubmitted = useCallback(() => {
    setShowReplyInput(false);
    onReplySubmitted?.();
  }, [onReplySubmitted]);

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <CommentAvatar
          avatarUrl={comment.user.avatarUrl}
          name={comment.user.name}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-medium text-ink">
              {comment.user.name}
            </span>
            <span className="text-[11px] text-muted">
              {formatTimestamp(comment.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-body-muted">
            {comment.body}
          </p>

          <div className="mt-1.5 flex items-center gap-3">
            {!isReply ? (
              <button
                type="button"
                onClick={() => setShowReplyInput((v) => !v)}
                className="text-[11px] font-medium text-muted transition hover:text-ink"
              >
                Reply
              </button>
            ) : null}
            {isOwn ? (
              confirmDelete ? (
                <span className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-muted">Delete?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="font-medium text-error transition hover:text-error/80 disabled:opacity-50"
                  >
                    {deleting ? "…" : "Yes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="font-medium text-muted transition hover:text-ink"
                  >
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-[11px] font-medium text-muted transition hover:text-error"
                >
                  Delete
                </button>
              )
            ) : null}
          </div>

          {deleteError ? (
            <p className="mt-1 text-xs text-error" role="alert">
              {deleteError}
            </p>
          ) : null}
        </div>
      </div>

      {showReplyInput ? (
        <div className="ml-12">
          <CommentInput
            productSlug={productSlug}
            parentId={comment.id}
            onSubmitted={handleReplySubmitted}
            onCancel={() => setShowReplyInput(false)}
            placeholder="Write a reply…"
            autoFocus
          />
        </div>
      ) : null}
    </div>
  );
}

// ── Comment List ──

function CommentList({
  comments,
  productSlug,
  currentUserId,
  onDeleted,
  onReplySubmitted,
}: {
  comments: CommentResponse[];
  productSlug: string;
  currentUserId: string | null;
  onDeleted: (id: string) => void;
  onReplySubmitted?: () => void;
}) {
  if (comments.length === 0) return null;

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            productSlug={productSlug}
            currentUserId={currentUserId}
            onDeleted={onDeleted}
            onReplySubmitted={onReplySubmitted}
          />
          {comment.replies && comment.replies.length > 0 ? (
            <div className="ml-9 mt-3 space-y-4 border-l border-hairline pl-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  productSlug={productSlug}
                  currentUserId={currentUserId}
                  onDeleted={onDeleted}
                  onReplySubmitted={onReplySubmitted}
                />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ── Loading Skeleton ──

function CommentSectionSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-5 w-32 rounded bg-hairline/50" />
      <div className="h-20 w-full rounded-sm bg-soft-stone" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="h-9 w-9 rounded-full bg-hairline/60" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="flex gap-2">
              <div className="h-3 w-24 rounded bg-hairline/50" />
              <div className="h-3 w-12 rounded bg-hairline/40" />
            </div>
            <div className="h-4 w-3/4 rounded bg-hairline/40" />
            <div className="h-4 w-1/2 rounded bg-hairline/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Export ──

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
