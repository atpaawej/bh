import { describe, it, expect, vi, beforeEach } from "vitest";
import { productService } from "./productService";
import { db } from "../db";
import { AppError } from "../middleware/errorHandler";

vi.mock("../db", () => ({
  db: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

const findMany = vi.mocked(db.product.findMany);

const maker = {
  id: "user-1",
  email: "maker@example.com",
  name: "Asha",
  avatarUrl: "https://example.com/a.jpg",
  bio: null,
  twitterHandle: null,
  website: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const category = {
  id: "cat-1",
  name: "AI / Machine Learning",
  slug: "ai-ml",
  description: "AI tools",
};

function makeProduct(
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    voteCount: number;
    launchedAt: Date;
  }> = {},
) {
  const id = overrides.id ?? "prod-1";
  return {
    id,
    name: overrides.name ?? "Krutrim AI",
    slug: overrides.slug ?? "krutrim-ai",
    tagline: "Full-stack AI for India",
    description:
      "A long enough description for the product listing page content.",
    websiteUrl: "https://example.com",
    demoUrl: null,
    logoUrl: "https://example.com/logo.png",
    heroImageUrl: "https://example.com/hero.png",
    galleryUrls: [] as string[],
    videoUrl: null,
    status: "submitted" as const,
    launchedAt: overrides.launchedAt ?? new Date("2026-07-18T12:00:00.000Z"),
    scheduledFor: null,
    createdAt: new Date("2026-07-18T12:00:00.000Z"),
    updatedAt: new Date("2026-07-18T12:00:00.000Z"),
    makerId: maker.id,
    categoryId: category.id,
    maker,
    category,
    _count: {
      votes: overrides.voteCount ?? 10,
      comments: 2,
    },
  };
}

describe("productService.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Monday mid BH week Fri 17 Jul – Thu 23 Jul 2026
    vi.setSystemTime(new Date("2026-07-20T12:00:00.000Z"));
  });

  it("scopes to the current Friday→Thursday week and ranks by vote count", async () => {
    findMany.mockResolvedValue([makeProduct({ voteCount: 42 })] as never);

    const result = await productService.list({});

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { in: ["submitted", "featured"] },
          launchedAt: {
            gte: new Date("2026-07-17T00:00:00.000Z"),
            lte: new Date("2026-07-23T23:59:59.999Z"),
          },
        }),
        orderBy: [{ votes: { _count: "desc" } }, { id: "desc" }],
        take: 21,
      }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.data[0].voteCount).toBe(42);
    expect(result.data[0].maker.name).toBe("Asha");
    expect(result.data[0].category.slug).toBe("ai-ml");
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("filters by category slug when provided", async () => {
    findMany.mockResolvedValue([] as never);

    await productService.list({ category: "ai-ml" });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: { slug: "ai-ml" },
        }),
      }),
    );
  });

  it("uses an explicit ISO week when week is provided", async () => {
    findMany.mockResolvedValue([] as never);

    await productService.list({ week: "2026-W30" });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          launchedAt: {
            gte: new Date("2026-07-17T00:00:00.000Z"),
            lte: new Date("2026-07-23T23:59:59.999Z"),
          },
        }),
      }),
    );
  });

  it("rejects invalid week strings", async () => {
    await expect(
      productService.list({ week: "not-a-week" }),
    ).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    } satisfies Partial<AppError>);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns nextCursor when more than a page of products exist", async () => {
    const products = Array.from({ length: 21 }, (_, i) =>
      makeProduct({ id: `prod-${i}`, slug: `prod-${i}`, voteCount: 100 - i }),
    );
    findMany.mockResolvedValue(products as never);

    const result = await productService.list({});

    expect(result.data).toHaveLength(20);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe("prod-19");
  });

  it("passes cursor for pagination", async () => {
    findMany.mockResolvedValue([] as never);

    await productService.list({ cursor: "prod-19" });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "prod-19" },
        skip: 1,
      }),
    );
  });

  it("maps empty results to an empty page", async () => {
    findMany.mockResolvedValue([] as never);

    const result = await productService.list({ category: "education" });

    expect(result).toEqual({ data: [], nextCursor: null, hasMore: false });
  });
});
