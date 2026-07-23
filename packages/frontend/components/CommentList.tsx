"use client";

import { useCallback, useState } from "react";
import type { CommentResponse } from "@bh/shared";
import { ApiClientError, deleteComment } from "../lib/api";
import { makerInitials } from "../lib/videoEmbed";
import { CommentInput } from "./CommentInput";

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

// ── Single Comment ──

function CommentItem({
  comment,
  productSlug,
  currentUserId,
  onDeleted,
  onReplySubmitted,
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

export function CommentList({
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
