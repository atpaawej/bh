import sanitizeHtml from "sanitize-html";
import { db } from "../db";
import { AppError } from "../middleware/errorHandler";
import { toUserResponse } from "./productMapper";
import type { CommentResponse } from "@bh/shared";

type CommentRecord = {
  id: string;
  body: string;
  createdAt: Date;
  userId: string;
  productId: string;
  parentId: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    avatarUrl: string | null;
    bio: string | null;
    twitterHandle: string | null;
    website: string | null;
    createdAt: Date;
  };
};

function toCommentResponse(comment: CommentRecord): CommentResponse {
  return {
    id: comment.id,
    body: comment.body,
    user: toUserResponse(comment.user),
    productId: comment.productId,
    parentId: comment.parentId,
    createdAt: comment.createdAt.toISOString(),
  };
}

const commentInclude = {
  user: true,
} as const;

/** Reusable product-id lookup to DRY slug → id resolution. */
async function resolveProductIdOrThrow(slug: string): Promise<string> {
  const product = await db.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!product) throw AppError.notFound("Product");
  return product.id;
}

export const commentService = {
  /**
   * List all top-level comments for a product (parentId IS NULL),
   * each eagerly loaded with their direct replies, oldest first.
   */
  async listByProduct(slug: string): Promise<CommentResponse[]> {
    const productId = await resolveProductIdOrThrow(slug);

    const topLevel = await db.comment.findMany({
      where: { productId, parentId: null },
      include: {
        ...commentInclude,
        replies: {
          include: commentInclude,
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return topLevel.map((comment) => ({
      ...toCommentResponse(comment),
      replies: comment.replies.map(toCommentResponse),
    }));
  },

  /**
   * Create a new comment or reply on a product.
   * Body is sanitized to plain text (no HTML tags).
   * Max nesting is one level — parentId must reference a top-level comment.
   */
  async create(
    userId: string,
    slug: string,
    data: { body: string; parentId?: string | null },
  ): Promise<CommentResponse> {
    const productId = await resolveProductIdOrThrow(slug);

    const body = sanitizeHtml(data.body, {
      allowedTags: [],
      allowedAttributes: {},
    });

    // If replying, verify the parent comment exists and is a top-level comment
    if (data.parentId) {
      const parent = await db.comment.findUnique({
        where: { id: data.parentId },
        select: { id: true, parentId: true, productId: true },
      });
      if (!parent) {
        throw AppError.notFound("Parent comment");
      }
      if (parent.parentId !== null) {
        throw AppError.validation("Replies can only be one level deep");
      }
      if (parent.productId !== productId) {
        throw AppError.validation("Parent comment does not belong to this product");
      }
    }

    const comment = await db.comment.create({
      data: {
        body,
        userId,
        productId,
        parentId: data.parentId ?? null,
      },
      include: commentInclude,
    });

    return toCommentResponse(comment);
  },

  /**
   * Delete a comment by ID. Only the comment author can delete.
   * Verifies the comment belongs to the specified product (slug scoping).
   * Also deletes any replies to prevent orphaned data.
   */
  async remove(userId: string, slug: string, commentId: string): Promise<void> {
    const productId = await resolveProductIdOrThrow(slug);

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, productId: true },
    });

    if (!comment) throw AppError.notFound("Comment");
    if (comment.productId !== productId) {
      throw AppError.notFound("Comment");
    }
    if (comment.userId !== userId) {
      throw AppError.forbidden("You can only delete your own comments");
    }

    // Delete replies first, then the comment itself
    await db.comment.deleteMany({
      where: { OR: [{ id: commentId }, { parentId: commentId }] },
    });
  },
};
