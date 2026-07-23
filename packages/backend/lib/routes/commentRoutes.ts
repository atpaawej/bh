// ── Comment Routes ──

import { Router } from "express";
import { createCommentSchema } from "../validators/commentSchema";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../middleware/asyncHandler";
import { commentLimiter } from "../middleware/rateLimiter";
import { commentService } from "../services/commentService";

const router = Router({ mergeParams: true });

/**
 * GET /api/products/:slug/comments
 * Lists all top-level comments with nested replies for a product. Public.
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const comments = await commentService.listByProduct(req.params.slug);
    res.json(comments);
  }),
);

/**
 * POST /api/products/:slug/comments
 * Creates a new comment or reply on a product. Auth required.
 * Returns 204 on success; the frontend refetches the comment tree.
 */
router.post(
  "/",
  authMiddleware,
  commentLimiter,
  validate(createCommentSchema),
  asyncHandler(async (req, res) => {
    await commentService.create(req.user!.id, req.params.slug, req.body);
    res.status(204).send();
  }),
);

/**
 * DELETE /api/products/:slug/comments/:id
 * Deletes a comment (and its replies) by ID. Auth + ownership required.
 */
router.delete(
  "/:id",
  authMiddleware,
  commentLimiter,
  asyncHandler(async (req, res) => {
    await commentService.remove(req.user!.id, req.params.slug, req.params.id);
    res.status(204).send();
  }),
);

export default router;
