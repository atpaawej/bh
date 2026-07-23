import sanitizeHtml from "sanitize-html";
import { db } from "../db";
import { AppError } from "../middleware/errorHandler";
import { toProductResponse, toUserResponse, productInclude } from "./productMapper";
import type { ProfileResponse, ProductResponse, UserResponse } from "@bh/shared";

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
    voteCount: _count.votes,
    commentCount: _count.comments,
  };
}

export const userService = {
  /**
   * Get all products for the authenticated user, including drafts.
   * Ordered by last updated descending.
   */
  async getMyProducts(userId: string): Promise<ProductResponse[]> {
    const products = await db.product.findMany({
      where: { makerId: userId },
      include: productInclude,
      orderBy: { updatedAt: "desc" },
    });

    return products.map((p) =>
      toProductResponse(withCounts(p as ProductWithCounts), false),
    );
  },

  /**
   * Get the authenticated user's own full profile.
   */
  async getOwnProfile(userId: string): Promise<UserResponse> {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User");
    return toUserResponse(user);
  },

  /**
   * Get a public profile by username. Returns the user info and all their
   * public (submitted/featured) launched products, ordered by launch date desc.
   * Throws 404 if the username doesn't exist.
   */
  async getProfile(username: string): Promise<ProfileResponse> {
    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw AppError.notFound("User");
    }

    const products = await db.product.findMany({
      where: {
        makerId: user.id,
        status: { in: ["submitted", "featured"] },
        launchedAt: { not: null },
      },
      include: productInclude,
      orderBy: { launchedAt: "desc" },
    });

    return {
      user: toUserResponse(user),
      products: products.map((p) =>
        toProductResponse(withCounts(p as ProductWithCounts), false),
      ),
    };
  },

  /**
   * Update the authenticated user's own profile.
   * Only allowed fields can be updated.
   */
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      bio?: string | null;
      avatarUrl?: string | null;
      twitterHandle?: string | null;
      website?: string | null;
    },
  ): Promise<void> {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User");

    const updateData: Record<string, unknown> = {};
    const allowedFields = ["name", "bio", "avatarUrl", "twitterHandle", "website"] as const;

    for (const field of allowedFields) {
      if (field in data) {
        updateData[field] = data[field];
      }
    }

    // Sanitize text fields to prevent XSS
    for (const field of ["name", "bio", "twitterHandle"] as const) {
      if (typeof updateData[field] === "string") {
        updateData[field] = sanitizeHtml(updateData[field] as string, {
          allowedTags: [],
          allowedAttributes: {},
        });
      }
    }

    await db.user.update({
      where: { id: userId },
      data: updateData,
    });
  },
};
