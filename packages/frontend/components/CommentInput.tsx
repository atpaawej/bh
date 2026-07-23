"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ApiClientError, createComment } from "../lib/api";
import { useAuth } from "../lib/auth/AuthContext";

const MAX_COMMENT_LENGTH = 1000;

/**
 * Textarea + submit form for posting a new comment or reply.
 * Handles auth gate, character count, pending state, and error display.
 * On success, calls onSubmitted() — the parent should refetch the comment tree.
 */
export function CommentInput({
  productSlug,
  parentId,
  onSubmitted,
  onCancel,
  placeholder = "Write a comment…",
  autoFocus = false,
}: {
  productSlug: string;
  parentId?: string | null;
  onSubmitted: () => void;
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
        await createComment(productSlug, {
          body: trimmed,
          parentId: parentId ?? null,
        });
        setBody("");
        onSubmitted();
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
            body.length > MAX_COMMENT_LENGTH ? "text-error" : "text-muted"
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
