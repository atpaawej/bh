import type {
  AuthSessionResponse,
  CategoryResponse,
  CommentResponse,
  CreateProductInput,
  MagicLinkResponse,
  OAuthUrlResponse,
  PaginatedResponse,
  ProductResponse,
  UserResponse,
} from "@bh/shared";
import { getAccessToken, setAccessToken } from "./auth/tokenStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Single-flight refresh so concurrent callers share one cookie rotation. */
let refreshInFlight: Promise<AuthSessionResponse> | null = null;

async function requestOnce<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  const token = getAccessToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError(
      "Unable to reach the server. Check your connection.",
      0,
    );
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const body = (await res.json()) as { message?: string; code?: string };
      if (body.message) message = body.message;
      code = body.code;
    } catch {
      // ignore parse errors
    }
    throw new ApiClientError(message, res.status, code);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  retried = false,
): Promise<T> {
  try {
    return await requestOnce<T>(path, init);
  } catch (err) {
    // Auto-refresh once on expired/missing access token (skip auth endpoints)
    if (
      !retried &&
      err instanceof ApiClientError &&
      err.status === 401 &&
      !path.startsWith("/auth/")
    ) {
      try {
        const session = await refreshSession();
        setAccessToken(session.accessToken);
        return await requestOnce<T>(path, init);
      } catch {
        setAccessToken(null);
        throw err;
      }
    }
    throw err;
  }
}

export interface ProductListParams {
  cursor?: string | null;
  category?: string | null;
  week?: string | null;
}

export function fetchProducts(
  params: ProductListParams = {},
): Promise<PaginatedResponse<ProductResponse>> {
  const search = new URLSearchParams();
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.category) search.set("category", params.category);
  if (params.week) search.set("week", params.week);
  const qs = search.toString();
  return request(`/products${qs ? `?${qs}` : ""}`);
}

/**
 * Fetch the leaderboard for a given week, ranked by vote count descending.
 * Defaults to the current week when no week param is provided.
 */
export function fetchLeaderboard(
  params: { week?: string } = {},
): Promise<PaginatedResponse<ProductResponse>> {
  const search = new URLSearchParams();
  if (params.week) search.set("week", params.week);
  const qs = search.toString();
  return request(`/leaderboard${qs ? `?${qs}` : ""}`);
}

export function fetchCategories(): Promise<CategoryResponse[]> {
  return request("/categories");
}

export function fetchProductBySlug(slug: string): Promise<ProductResponse> {
  return request(`/products/${encodeURIComponent(slug)}`);
}

// ── Voting ──

export function voteForProduct(slug: string): Promise<ProductResponse> {
  return request(`/products/${encodeURIComponent(slug)}/vote`, {
    method: "POST",
  });
}

export function unvoteForProduct(slug: string): Promise<ProductResponse> {
  return request(`/products/${encodeURIComponent(slug)}/vote`, {
    method: "DELETE",
  });
}

/** Fetches a product for editing — returns drafts for the owner. */
export function fetchProductForEdit(slug: string): Promise<ProductResponse> {
  return request(`/products/${encodeURIComponent(slug)}/edit`);
}

// ── Profiles ──

export interface ProfileResponse {
  user: UserResponse;
  products: ProductResponse[];
}

/**
 * Fetch a public user profile by username.
 * Returns user info + list of their launched products.
 */
/**
 * Fetch the authenticated user's own profile (includes bio, socials).
 */
export function fetchOwnProfile(): Promise<UserResponse> {
  return request("/users/me");
}

export function fetchProfile(username: string): Promise<ProfileResponse> {
  return request(`/users/${encodeURIComponent(username)}`);
}

/**
 * Update own profile. Auth required.
 * Only included fields will be updated.
 */
export function updateProfile(
  data: {
    name?: string;
    bio?: string | null;
    avatarUrl?: string | null;
    twitterHandle?: string | null;
    website?: string | null;
  },
): Promise<UserResponse> {
  return request("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Product CRUD ──

export function createProduct(
  input: CreateProductInput,
): Promise<ProductResponse> {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProduct(
  slug: string,
  input: Partial<CreateProductInput>,
): Promise<ProductResponse> {
  return request(`/products/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteProduct(slug: string): Promise<void> {
  return request(`/products/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}

export interface SignedUploadUrl {
  url: string;
  publicId: string;
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
}

/**
 * Fetches a signed Cloudinary upload URL for a given folder type.
 * The frontend then uses this to upload files directly to Cloudinary.
 */
export function fetchUploadUrl(
  folder: "logos" | "heroes" | "gallery",
): Promise<SignedUploadUrl> {
  return request(`/products/upload-url?folder=${encodeURIComponent(folder)}`);
}

// ── Auth ──

export function startOAuth(
  provider: "google" | "github",
): Promise<OAuthUrlResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ provider }),
  });
}

export function requestMagicLink(email: string): Promise<MagicLinkResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function completeAuthWithCode(
  code: string,
): Promise<AuthSessionResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function completeAuthWithAccessToken(
  accessToken: string,
): Promise<AuthSessionResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ accessToken }),
  });
}

export function completeAuthWithTokenHash(
  tokenHash: string,
  type: "email" | "magiclink" = "email",
): Promise<AuthSessionResponse> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ tokenHash, type }),
  });
}

export function refreshSession(): Promise<AuthSessionResponse> {
  if (!refreshInFlight) {
    refreshInFlight = requestOnce<AuthSessionResponse>("/auth/refresh", {
      method: "POST",
    }).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function logoutRequest(): Promise<void> {
  try {
    await requestOnce<void>("/auth/logout", { method: "POST" });
  } finally {
    // Always drop client JWT even if the network call fails
    setAccessToken(null);
  }
}

// ── Comments ──

/**
 * Fetch all comments (with nested replies) for a product. Public endpoint.
 * Returns top-level comments sorted oldest-first, each with its replies.
 */
export function fetchComments(slug: string): Promise<CommentResponse[]> {
  return request(`/products/${encodeURIComponent(slug)}/comments`);
}

/**
 * Create a new comment or reply on a product. Auth required.
 * @param slug - The product slug
 * @param data - The comment body (plain text) and optional parentId for replies
 */
export function createComment(
  slug: string,
  data: { body: string; parentId?: string | null },
): Promise<CommentResponse> {
  return request(`/products/${encodeURIComponent(slug)}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a comment (and its replies) by ID. Auth + ownership required.
 * @param slug - The product slug
 * @param commentId - UUID of the comment to delete
 */
export function deleteComment(slug: string, commentId: string): Promise<void> {
  return request(
    `/products/${encodeURIComponent(slug)}/comments/${commentId}`,
    { method: "DELETE" },
  );
}
