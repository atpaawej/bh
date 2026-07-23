// ── Cron Routes ──

import { Router } from "express";
import { db } from "../db";
import { cronAuthMiddleware } from "../middleware/cronAuth";
import { asyncHandler } from "../middleware/asyncHandler";
import { getWeekRange } from "@bh/shared";

const router = Router();

// All cron routes require the X-Cron-Secret header
router.use(cronAuthMiddleware);

/**
 * POST /api/cron/publish-week
 *
 * Publishes all draft products scheduled for the current BH week (Friday→Thursday).
 * Updates their status to "submitted" and sets launchedAt to now.
 *
 * Returns the count of products published.
 */
router.post(
  "/publish-week",
  asyncHandler(async (_req, res) => {
    const { start, end } = getWeekRange();

    const result = await db.product.updateMany({
      where: {
        status: "draft",
        scheduledFor: {
          gte: start,
          lte: end,
        },
      },
      data: {
        status: "submitted",
        launchedAt: new Date(),
      },
    });

    res.json({
      published: result.count,
      week: { start: start.toISOString(), end: end.toISOString() },
    });
  }),
);

export default router;
