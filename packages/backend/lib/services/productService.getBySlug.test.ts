import { describe, it, expect, vi, beforeEach } from "vitest";
import { productService } from "./productService";
import { db } from "../db";
import { AppError } from "../middleware/errorHandler";

vi.mock("../db", () => ({
  db: {
    product: {
      findUnique: vi.fn(),
    },
    vote: {
      findUnique: vi.fn(),
    },
  },
}));

const findUniqueProduct = vi.mocked(db.product.findUnique);
const findUniqueVote = vi.mocked(db.vote.findUnique);

const maker = {
  id: "user-1",
  email: "maker@example.com",
  name: "Asha",
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

function makeProduct(overrides: Partial<{ id: string; slug: string }> = {}) {
  return {
    id: overrides.id ?? "prod-1",
    name: "Krutrim AI",
    slug: overrides.slug ?? "krutrim-ai",
    tagline: "Full-stack AI for India",
    description:
      "India's first full-stack AI platform with Indic language support.",
    websiteUrl: "https://example.com",
    demoUrl: "https://demo.example.com",
    logoUrl: "https://example.com/logo.png",
    heroImageUrl: "https://example.com/hero.png",
    galleryUrls: ["https://example.com/g1.png", "https://example.com/g2.png"],
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    status: "submitted" as const,
    launchedAt: new Date("2026-07-18T12:00:00.000Z"),
    scheduledFor: null,
    createdAt: new Date("2026-07-18T12:00:00.000Z"),
    updatedAt: new Date("2026-07-18T12:00:00.000Z"),
    makerId: maker.id,
    categoryId: category.id,
    maker,
    category,
    _count: {
      votes: 42,
      comments: 3,
    },
  };
}

describe("productService.getBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a full product response for an existing slug", async () => {
    findUniqueProduct.mockResolvedValue(makeProduct() as never);

    const result = await productService.getBySlug("krutrim-ai");

    expect(findUniqueProduct).toHaveBeenCalledWith({
      where: { slug: "krutrim-ai" },
      include: expect.objectContaining({
        maker: true,
        category: true,
        _count: { select: { votes: true, comments: true } },
      }),
    });
    expect(result).toMatchObject({
      id: "prod-1",
      name: "Krutrim AI",
      slug: "krutrim-ai",
      tagline: "Full-stack AI for India",
      description:
        "India's first full-stack AI platform with Indic language support.",
      websiteUrl: "https://example.com",
      demoUrl: "https://demo.example.com",
      logoUrl: "https://example.com/logo.png",
      heroImageUrl: "https://example.com/hero.png",
      galleryUrls: ["https://example.com/g1.png", "https://example.com/g2.png"],
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      voteCount: 42,
      commentCount: 3,
      hasVoted: false,
      maker: { id: "user-1", name: "Asha" },
      category: { slug: "ai-ml", name: "AI / Machine Learning" },
    });
    expect(findUniqueVote).not.toHaveBeenCalled();
  });

  it("throws not found when the slug does not exist", async () => {
    findUniqueProduct.mockResolvedValue(null);

    await expect(
      productService.getBySlug("missing-product"),
    ).rejects.toMatchObject({
      status: 404,
      code: "PRODUCT_NOT_FOUND",
      message: "Product not found",
    } satisfies Partial<AppError>);
  });

  it("throws not found for draft products so they stay private", async () => {
    findUniqueProduct.mockResolvedValue({
      ...makeProduct(),
      status: "draft",
    } as never);

    await expect(productService.getBySlug("krutrim-ai")).rejects.toMatchObject({
      status: 404,
      code: "PRODUCT_NOT_FOUND",
    } satisfies Partial<AppError>);
    expect(findUniqueVote).not.toHaveBeenCalled();
  });

  it("sets hasVoted true when the authenticated user has voted", async () => {
    findUniqueProduct.mockResolvedValue(makeProduct() as never);
    findUniqueVote.mockResolvedValue({
      id: "vote-1",
      userId: "voter-9",
      productId: "prod-1",
      createdAt: new Date(),
    } as never);

    const result = await productService.getBySlug("krutrim-ai", "voter-9");

    expect(findUniqueVote).toHaveBeenCalledWith({
      where: { userId_productId: { userId: "voter-9", productId: "prod-1" } },
    });
    expect(result.hasVoted).toBe(true);
  });

  it("sets hasVoted false when the authenticated user has not voted", async () => {
    findUniqueProduct.mockResolvedValue(makeProduct() as never);
    findUniqueVote.mockResolvedValue(null);

    const result = await productService.getBySlug("krutrim-ai", "voter-9");

    expect(result.hasVoted).toBe(false);
  });
});
