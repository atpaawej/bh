import type {
  ProductResponse,
  UserResponse,
  CategoryResponse,
} from "@bh/shared";

type MakerRecord = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  twitterHandle: string | null;
  website: string | null;
  createdAt: Date;
};

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

type ProductRecord = {
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
  maker: MakerRecord;
  category: CategoryRecord;
  voteCount: number;
  commentCount: number;
  hasVoted?: boolean;
};

export function toUserResponse(maker: MakerRecord): UserResponse {
  return {
    id: maker.id,
    name: maker.name,
    username: maker.username,
    avatarUrl: maker.avatarUrl,
    bio: maker.bio,
    twitterHandle: maker.twitterHandle,
    website: maker.website,
    createdAt: maker.createdAt.toISOString(),
  };
}

export function toCategoryResponse(category: CategoryRecord): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
  };
}

export function toProductResponse(
  product: ProductRecord,
  hasVotedOverride?: boolean,
): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    tagline: product.tagline,
    description: product.description,
    websiteUrl: product.websiteUrl,
    demoUrl: product.demoUrl,
    category: toCategoryResponse(product.category),
    logoUrl: product.logoUrl,
    heroImageUrl: product.heroImageUrl,
    galleryUrls: product.galleryUrls,
    videoUrl: product.videoUrl,
    maker: toUserResponse(product.maker),
    voteCount: product.voteCount,
    commentCount: product.commentCount,
    hasVoted: hasVotedOverride ?? product.hasVoted ?? false,
    launchedAt: product.launchedAt?.toISOString() || "",
    scheduledFor: product.scheduledFor?.toISOString() || null,
    createdAt: product.createdAt.toISOString(),
  };
}
