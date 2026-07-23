// ── API Response Contracts ──

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ── Category ──

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
}

// ── User ──

export interface UserResponse {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  twitterHandle: string | null;
  website: string | null;
  createdAt: string;
}

// ── Auth ──

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface AuthSessionResponse {
  accessToken: string;
  user: AuthUserResponse;
}

export interface OAuthUrlResponse {
  url: string;
}

export interface MagicLinkResponse {
  message: string;
}

// ── Product ──

export interface CreateProductInput {
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
}

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  demoUrl: string | null;
  category: CategoryResponse;
  logoUrl: string;
  heroImageUrl: string;
  galleryUrls: string[];
  videoUrl: string | null;
  maker: UserResponse;
  voteCount: number;
  commentCount: number;
  hasVoted: boolean;
  status: "draft" | "submitted" | "featured";
  launchedAt: string | null;
  scheduledFor: string | null;
  createdAt: string;
}

// ── Profile ──

export interface ProfileResponse {
  user: UserResponse;
  products: ProductResponse[];
}

// ── Vote ──

export interface VoteResponse {
  id: string;
  productId: string;
  userId: string;
  createdAt: string;
}

// ── Comment ──

export interface CommentResponse {
  id: string;
  body: string;
  user: UserResponse;
  productId: string;
  parentId: string | null;
  replies?: CommentResponse[];
  createdAt: string;
}
