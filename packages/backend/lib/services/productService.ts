import { db } from "../db";
import { slugify } from "../shared/utils";
import { resolveWeekRange } from "@bh/shared";
import { AppError } from "../middleware/errorHandler";
import { toProductResponse } from "./productMapper";
import type { ProductResponse, PaginatedResponse } from "@bh/shared";

const PAGE_SIZE = 20;

interface ListParams {
  cursor?: string;
  category?: string;
  week?: string;
  userId?: string;
}

const productInclude = {
  maker: true,
  category: true,
  _count: { select: { votes: true, comments: true } },
} as const;

type ProductWithCounts = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  demoUrl: string | null;
  logoUrl: string;
  heroImageUrl: string;
  galleryUrls: string[];
  videoUrl: string | null;
  launchedAt: Date | null;
  scheduledFor: Date | null;
  createdAt: Date;
  updatedAt: Date;
  makerId: string;
  categoryId: string;
  status: string;
  maker: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    avatarUrl: string | null;
    bio: string | null;
    twitterHandle: string | null;
    website: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    description: string;
  };
  _count: { votes: number; comments: number };
};

function withCounts(product: ProductWithCounts) {
  const { _count, ...rest } = product;
  return {
    ...rest,
    galleryUrls: rest.galleryUrls,
    voteCount: _count.votes,
    commentCount: _count.comments,
  };
}

/** Fields that are safe to update via PATCH */
const UPDATABLE_FIELDS = [
  "name",
  "tagline",
  "description",
  "websiteUrl",
  "demoUrl",
  "categoryId",
  "logoUrl",
  "heroImageUrl",
  "galleryUrls",
  "videoUrl",
  "scheduledFor",
] as const;

export const productService = {
  /**
   * List products for a weekly window, ranked by vote count (desc).
   * Defaults to the current Friday→Thursday window when `week` is omitted.
   */
  async list(params: ListParams): Promise<PaginatedResponse<ProductResponse>> {
    let weekRange;
    try {
      weekRange = resolveWeekRange(params.week);
    } catch {
      throw AppError.validation(
        "Invalid week format. Expected YYYY-Wnn (e.g. 2026-W30)",
      );
    }

    const where: {
      status: { in: Array<"submitted" | "featured"> };
      launchedAt: { gte: Date; lte: Date };
      category?: { slug: string };
    } = {
      status: { in: ["submitted", "featured"] },
      launchedAt: {
        gte: weekRange.start,
        lte: weekRange.end,
      },
    };

    if (params.category) {
      where.category = { slug: params.category };
    }

    const products = await db.product.findMany({
      where,
      include: productInclude,
      orderBy: [{ votes: { _count: "desc" } }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    });

    const hasMore = products.length > PAGE_SIZE;
    const page = products.slice(0, PAGE_SIZE);

    // Resolve hasVoted for the authenticated user
    let voteSet: Set<string> | undefined;
    if (params.userId) {
      const userVotes = await db.vote.findMany({
        where: {
          userId: params.userId,
          productId: { in: page.map((p: ProductWithCounts) => p.id) },
        },
        select: { productId: true },
      });
      voteSet = new Set(userVotes.map((v) => v.productId));
    }

    return {
      data: page.map((p: ProductWithCounts) =>
        toProductResponse(withCounts(p), voteSet?.has(p.id)),
      ),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      hasMore,
    };
  },

  async getBySlug(slug: string, userId?: string): Promise<ProductResponse> {
    const product = await db.product.findUnique({
      where: { slug },
      include: productInclude,
    });

    // Drafts and other non-public statuses stay hidden (list already scopes this way)
    if (
      !product ||
      (product.status !== "submitted" && product.status !== "featured")
    ) {
      throw AppError.notFound("Product");
    }

    let hasVoted = false;
    if (userId) {
      const vote = await db.vote.findUnique({
        where: { userId_productId: { userId, productId: product.id } },
      });
      hasVoted = !!vote;
    }

    return toProductResponse({
      ...withCounts(product as ProductWithCounts),
      hasVoted,
    });
  },

  /**
   * Returns a product by slug for the edit page — allows draft/owned products.
   * Only the owner can fetch their own draft; others get 404.
   */
  async getOwnBySlug(slug: string, userId: string): Promise<ProductResponse> {
    const product = await db.product.findUnique({
      where: { slug },
      include: productInclude,
    });

    if (!product) throw AppError.notFound("Product");
    if (product.makerId !== userId) throw AppError.notFound("Product");

    return toProductResponse(withCounts(product as ProductWithCounts));
  },

  async create(
    userId: string,
    data: {
      name: string;
      tagline: string;
      description: string;
      websiteUrl: string;
      demoUrl?: string;
      categoryId: string;
      logoUrl: string;
      heroImageUrl: string;
      galleryUrls?: string[];
      videoUrl?: string;
      scheduledFor?: string;
    },
  ): Promise<ProductResponse> {
    const slug = slugify(data.name);

    const existing = await db.product.findUnique({ where: { slug } });
    if (existing)
      throw AppError.conflict("A product with this name already exists");

    const category = await db.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) throw AppError.notFound("Category");

    const isScheduled = !!data.scheduledFor;
    const launchedAt = isScheduled ? null : new Date();

    const product = await db.product.create({
      data: {
        name: data.name,
        slug,
        tagline: data.tagline,
        description: data.description,
        websiteUrl: data.websiteUrl,
        demoUrl: data.demoUrl || null,
        categoryId: data.categoryId,
        logoUrl: data.logoUrl,
        heroImageUrl: data.heroImageUrl,
        galleryUrls: data.galleryUrls || [],
        videoUrl: data.videoUrl || null,
        status: isScheduled ? "draft" : "submitted",
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        launchedAt,
        makerId: userId,
      },
      include: productInclude,
    });

    return toProductResponse(withCounts(product as ProductWithCounts));
  },

  async update(userId: string, slug: string, data: Record<string, unknown>) {
    const product = await db.product.findUnique({ where: { slug } });
    if (!product) throw AppError.notFound("Product");
    if (product.makerId !== userId)
      throw AppError.forbidden("You can only edit your own products");

    // Only allow updatable fields
    const updateData: Record<string, unknown> = {};
    for (const field of UPDATABLE_FIELDS) {
      if (field in data) {
        updateData[field] = data[field];
      }
    }

    // Regenerate slug if name changed
    if (updateData.name && typeof updateData.name === "string") {
      const newSlug = slugify(updateData.name);
      if (newSlug !== slug) {
        const existing = await db.product.findUnique({
          where: { slug: newSlug },
        });
        if (existing && existing.id !== product.id) {
          throw AppError.conflict("A product with this name already exists");
        }
      }
      updateData.slug = newSlug;
    }

    // Handle scheduledFor changes: if setting a new schedule while draft, keep draft
    // if clearing schedule and currently draft, publish immediately
    if ("scheduledFor" in data) {
      if (data.scheduledFor) {
        // Setting/rescheduling — stay draft until publish
        updateData.launchedAt = null;
      } else if (
        data.scheduledFor === null &&
        product.status === "draft" &&
        !product.launchedAt
      ) {
        // Clearing schedule on a draft — publish now
        updateData.launchedAt = new Date();
        updateData.status = "submitted";
      }
    }

    const updated = await db.product.update({
      where: { slug },
      data: updateData,
      include: productInclude,
    });

    return toProductResponse(withCounts(updated as ProductWithCounts));
  },

  async remove(userId: string, slug: string) {
    const product = await db.product.findUnique({ where: { slug } });
    if (!product) throw AppError.notFound("Product");
    if (product.makerId !== userId)
      throw AppError.forbidden("You can only delete your own products");

    await db.product.delete({ where: { slug } });
  },

  async vote(userId: string, slug: string): Promise<ProductResponse> {
    const product = await db.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product) throw AppError.notFound("Product");

    const existingVote = await db.vote.findUnique({
      where: { userId_productId: { userId, productId: product.id } },
    });
    if (existingVote) throw AppError.conflict("Already voted");

    await db.vote.create({ data: { userId, productId: product.id } });

    return toProductResponse(
      { ...withCounts(product as ProductWithCounts), hasVoted: true },
      true,
    );
  },

  async unvote(userId: string, slug: string): Promise<ProductResponse> {
    const product = await db.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product) throw AppError.notFound("Product");

    await db.vote.deleteMany({
      where: { userId, productId: product.id },
    });

    return toProductResponse(
      { ...withCounts(product as ProductWithCounts), hasVoted: false },
      false,
    );
  },
};
