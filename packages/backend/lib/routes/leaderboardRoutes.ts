// ── Leaderboard Routes ──

import { Router } from "express";
import { z } from "zod";
import { optionalAuthMiddleware } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { productService } from "../services/productService";

const router = Router();

const leaderboardQuerySchema = z.object({
  cursor: z.string().optional(),
  category: z.string().optional(),
  week: z
    .string()
    .regex(/^\d{4}-W\d{2}$/, "Expected YYYY-Wnn format (e.g. 2026-W30)")
    .optional(),
});

/**
 * GET /api/leaderboard
 * Returns the current week's products ranked by vote count (desc).
 * ?week=2026-W30 filters to a specific ISO week.
 * Public endpoint; auth optional for hasVoted resolution.
 */
router.get(
  "/",
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    const { cursor, category, week } = leaderboardQuerySchema.parse(req.query);
    const products = await productService.list({
      cursor,
      category,
      week,
      userId: req.user?.id,
    });
    res.json(products);
  }),
);

export default router;
