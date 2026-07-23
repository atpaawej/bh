import { describe, it, expect, vi, beforeEach } from "vitest";
import { userService } from "./userService";
import { db } from "../db";
import { AppError } from "../middleware/errorHandler";

vi.mock("../db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
  },
}));

const findManyProducts = vi.mocked(db.product.findMany);
const findUniqueUser = vi.mocked(db.user.findUnique);

const maker = {
  id: "user-1",
  email: "maker@example.com",
  name: "Asha",
  username: "asha",
  avatarUrl: "https://example.com/a.jpg",
  bio: "Builder",
  twitterHandle: "asha",
  website: "https://asha.dev",
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
    slug: string;
    status: string;
    launchedAt: Date | null;
  }> = {},
) {
  const hasLaunchedAt = "launchedAt" in overrides;
  return {
    id: overrides.id ?? "prod-1",
    name: "Krutrim AI",
    slug: overrides.slug ?? "krutrim-ai",
    tagline: "Full-stack AI for India",
    description: "India's first full-stack AI platform.",
    websiteUrl: "https://example.com",
    demoUrl: null,
    logoUrl: "https://example.com/logo.png",
    heroImageUrl: "https://example.com/hero.png",
    galleryUrls: [] as string[],
    videoUrl: null,
    status: overrides.status ?? "submitted",
    launchedAt: hasLaunchedAt
      ? overrides.launchedAt
      : new Date("2026-07-18T12:00:00.000Z"),
    scheduledFor: null,
    createdAt: new Date("2026-07-18T12:00:00.000Z"),
    updatedAt: new Date("2026-07-18T12:00:00.000Z"),
    makerId: maker.id,
    categoryId: category.id,
    maker,
    category,
    _count: { votes: 10, comments: 3 },
  };
}

describe("userService.getMyProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all products for the authenticated user, ordered by updatedAt desc", async () => {
    const products = [
      makeProduct({ id: "prod-2", slug: "newer-product", status: "featured" }),
      makeProduct({ id: "prod-1", slug: "older-product", status: "draft" }),
    ];
    findManyProducts.mockResolvedValue(products as never);

    const result = await userService.getMyProducts("user-1");

    expect(findManyProducts).toHaveBeenCalledWith({
      where: { makerId: "user-1" },
      include: expect.objectContaining({
        maker: true,
        category: true,
        _count: { select: { votes: true, comments: true } },
      }),
      orderBy: { updatedAt: "desc" },
    });
    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("newer-product");
    expect(result[1].slug).toBe("older-product");
  });

  it("includes draft products (no status filter)", async () => {
    const draft = makeProduct({
      id: "prod-draft",
      status: "draft",
      launchedAt: null,
    });
    findManyProducts.mockResolvedValue([draft] as never);

    const result = await userService.getMyProducts("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("draft");
    expect(result[0].launchedAt).toBeNull();
  });

  it("returns an empty array when the user has no products", async () => {
    findManyProducts.mockResolvedValue([] as never);

    const result = await userService.getMyProducts("user-1");

    expect(result).toEqual([]);
  });

  it("maps voteCount and commentCount correctly", async () => {
    const product = makeProduct();
    findManyProducts.mockResolvedValue([product] as never);

    const result = await userService.getMyProducts("user-1");

    expect(result[0]).toMatchObject({
      voteCount: 10,
      commentCount: 3,
    });
  });

  it("sets hasVoted to false for own products", async () => {
    findManyProducts.mockResolvedValue([makeProduct()] as never);

    const result = await userService.getMyProducts("user-1");

    expect(result[0].hasVoted).toBe(false);
  });
});

describe("userService.getOwnProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the user profile for a valid user", async () => {
    findUniqueUser.mockResolvedValue(maker as never);

    const result = await userService.getOwnProfile("user-1");

    expect(result).toMatchObject({
      id: "user-1",
      name: "Asha",
      username: "asha",
    });
  });

  it("throws 404 when user does not exist", async () => {
    findUniqueUser.mockResolvedValue(null);

    await expect(userService.getOwnProfile("missing-id")).rejects.toMatchObject(
      {
        status: 404,
        code: "USER_NOT_FOUND",
      } satisfies Partial<AppError>,
    );
  });
});
