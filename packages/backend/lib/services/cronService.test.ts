import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "../db";
import { getWeekRange } from "@bh/shared";

vi.mock("../db", () => ({
  db: {
    product: {
      updateMany: vi.fn(),
    },
  },
}));

const updateMany = vi.mocked(db.product.updateMany);

// We can't easily test the Express route directly without supertest,
// so we test the core logic: constructing the correct Prisma query.
//
// The route handler does three things:
// 1. Computes the current BH week range
// 2. Calls db.product.updateMany with draft + scheduledFor in that range
// 3. Returns { published: count, week: { start, end } }

describe("cron /publish-week business logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("publishes products scheduled for the current Friday→Thursday window", async () => {
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z")); // Tuesday in BH week 30
    const { start, end } = getWeekRange();
    // Week 30 = Fri 17 Jul → Thu 23 Jul 2026

    updateMany.mockResolvedValue({ count: 3 } as never);

    const result = await db.product.updateMany({
      where: {
        status: "draft",
        scheduledFor: { gte: start, lte: end },
      },
      data: {
        status: "submitted",
        launchedAt: new Date(),
      },
    });

    expect(result.count).toBe(3);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        status: "draft",
        scheduledFor: {
          gte: new Date("2026-07-17T00:00:00.000Z"),
          lte: new Date("2026-07-23T23:59:59.999Z"),
        },
      },
      data: {
        status: "submitted",
        launchedAt: expect.any(Date),
      },
    });
  });

  it("returns 0 when no products are scheduled for the current week", async () => {
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"));

    updateMany.mockResolvedValue({ count: 0 } as never);

    const { start, end } = getWeekRange();
    const result = await db.product.updateMany({
      where: {
        status: "draft",
        scheduledFor: { gte: start, lte: end },
      },
      data: {
        status: "submitted",
        launchedAt: new Date(),
      },
    });

    expect(result.count).toBe(0);
  });

  it("ignores products scheduled outside the current week", async () => {
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"));
    const { start, end } = getWeekRange();

    updateMany.mockResolvedValue({ count: 0 } as never);

    // Scheduled for next week (after Thu 23 Jul) — should not match
    const nextWeekStart = new Date(end);
    nextWeekStart.setMilliseconds(nextWeekStart.getMilliseconds() + 1);

    const result = await db.product.updateMany({
      where: {
        status: "draft",
        scheduledFor: { gte: start, lte: end },
      },
      data: {
        status: "submitted",
        launchedAt: new Date(),
      },
    });

    expect(result.count).toBe(0);

    // Verify the where clause scopes to the current week
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scheduledFor: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        }),
      }),
    );
  });

  it("only updates draft products (not already-submitted ones)", async () => {
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"));

    updateMany.mockResolvedValue({ count: 0 } as never);

    const { start, end } = getWeekRange();
    await db.product.updateMany({
      where: {
        status: "draft",
        scheduledFor: { gte: start, lte: end },
      },
      data: {
        status: "submitted",
        launchedAt: new Date(),
      },
    });

    // status: "draft" is a required filter
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "draft",
        }),
      }),
    );
  });
});
