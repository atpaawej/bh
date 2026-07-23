"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { CATEGORIES, type CategorySlug } from "@bh/shared";
import type { ProductResponse } from "@bh/shared";
import { ProtectedRoute } from "../../../../components/auth/ProtectedRoute";
import { useAuth } from "../../../../lib/auth/AuthContext";
import {
  ApiClientError,
  deleteProduct,
  fetchCategories,
  fetchProductForEdit,
  fetchUploadUrl,
  updateProduct,
} from "../../../../lib/api";
import type { CategoryResponse } from "@bh/shared";

/** Picks the category slug matching the product's category id by reverse lookup. */
function resolveSlug(
  product: ProductResponse,
  cats: CategoryResponse[],
): CategorySlug {
  const match = cats.find((c) => c.id === product.category.id);
  return (match?.slug ?? cats[0]?.slug ?? "developer-tools") as CategorySlug;
}

export default function EditProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<
    string,
    string[]
  > | null>(null);

  // ── Form fields ──
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [categorySlug, setCategorySlug] =
    useState<CategorySlug>("developer-tools");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");

  // ── Delete confirmation ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Image uploads ──
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [cats, prod] = await Promise.all([
          fetchCategories(),
          fetchProductForEdit(slug),
        ]);
        setCategories(cats);
        setProduct(prod);

        // Pre-fill form
        setName(prod.name);
        setTagline(prod.tagline);
        setDescription(prod.description);
        setWebsiteUrl(prod.websiteUrl);
        setDemoUrl(prod.demoUrl ?? "");
        setCategorySlug(resolveSlug(prod, cats));
        setLogoUrl(prod.logoUrl);
        setHeroImageUrl(prod.heroImageUrl);
        setGalleryUrls(prod.galleryUrls);
        setVideoUrl(prod.videoUrl ?? "");

        if (user) {
          setIsOwner(prod.maker.id === user.id);
        }
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 404) {
          router.replace("/");
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load product",
          );
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [slug, router, user]);

  const getSignedUrl = useCallback(
    async (folder: "logos" | "heroes" | "gallery") => {
      return fetchUploadUrl(folder);
    },
    [],
  );

  const uploadToCloudinary = useCallback(
    async (file: File, folder: "logos" | "heroes" | "gallery") => {
      const signed = await getSignedUrl(folder);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signed.apiKey);
      formData.append("timestamp", String(signed.timestamp));
      formData.append("signature", signed.signature);
      formData.append("public_id", signed.publicId);

      const res = await fetch(signed.url, { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: { message?: string } }).error?.message ??
            "Upload failed",
        );
      }

      const data = (await res.json()) as {
        secure_url: string;
        public_id: string;
      };
      return data.secure_url;
    },
    [getSignedUrl],
  );

  const handleFileUpload = useCallback(
    async (
      e: React.ChangeEvent<HTMLInputElement>,
      folder: "logos" | "heroes" | "gallery",
      setter: (url: string) => void,
      setUploading: (v: boolean) => void,
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      setError(null);
      try {
        const url = await uploadToCloudinary(file, folder);
        setter(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [uploadToCloudinary],
  );

  const handleGalleryUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      setUploadingGallery(true);
      setError(null);
      try {
        const remaining = 5 - galleryUrls.length;
        const toUpload = Array.from(files).slice(0, remaining);
        const urls = await Promise.all(
          toUpload.map((file) => uploadToCloudinary(file, "gallery")),
        );
        setGalleryUrls((prev) => [...prev, ...urls].slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingGallery(false);
      }
    },
    [galleryUrls.length, uploadToCloudinary],
  );

  const removeGalleryImage = useCallback((index: number) => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors(null);
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await updateProduct(slug, {
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        demoUrl: demoUrl.trim() || undefined,
        logoUrl,
        heroImageUrl,
        galleryUrls,
        videoUrl: videoUrl.trim() || undefined,
      });

      router.push(`/products/${slug}`);
    } catch (err: unknown) {
      const apiErr = err as {
        message?: string;
        details?: Record<string, string[]>;
      };
      setError(apiErr.message ?? "Failed to update product");
      if (apiErr.details) {
        setFieldErrors(apiErr.details);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteProduct(slug);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-[680px] px-6 py-12">
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="text-sm text-muted">Loading product…</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!product || !isOwner) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-[680px] px-6 py-12 text-center">
          <h1 className="mb-4 font-display text-3xl text-ink">Access denied</h1>
          <p className="text-body-muted">
            You can only edit your own products.
          </p>
        </div>
      </ProtectedRoute>
    );
  }

  const inputClasses =
    "w-full rounded-border bg-canvas px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-hairline transition focus:ring-2 focus:ring-primary/30 placeholder:text-muted";
  const labelClasses = "text-sm font-medium text-ink";
  const errorClasses = "mt-1 text-xs text-error";

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-[680px] px-6 py-12">
        <p className="mono-label mb-2 text-center text-xs text-muted">
          EDIT PRODUCT
        </p>
        <h1 className="mb-2 text-center font-display text-4xl tracking-tight text-ink md:text-4xl">
          Edit {product.name}
        </h1>
        <p className="mx-auto mb-10 max-w-md text-center text-body-muted">
          Update your product listing.
        </p>

        {error ? (
          <div className="mb-6 rounded-sm border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSave} className="space-y-6">
          {/* ── Name ── */}
          <div>
            <label htmlFor="name" className={labelClasses}>
              Product name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
              maxLength={100}
              required
            />
            {fieldErrors?.name?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Tagline ── */}
          <div>
            <label htmlFor="tagline" className={labelClasses}>
              Tagline
            </label>
            <input
              id="tagline"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className={inputClasses}
              maxLength={150}
              required
            />
            {fieldErrors?.tagline?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Description ── */}
          <div>
            <label htmlFor="description" className={labelClasses}>
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClasses} min-h-[160px] resize-y`}
              maxLength={5000}
              required
            />
            {fieldErrors?.description?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Website URL ── */}
          <div>
            <label htmlFor="websiteUrl" className={labelClasses}>
              Website URL
            </label>
            <input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className={inputClasses}
              required
            />
            {fieldErrors?.websiteUrl?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Demo URL ── */}
          <div>
            <label htmlFor="demoUrl" className={labelClasses}>
              Demo URL
            </label>
            <input
              id="demoUrl"
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              className={inputClasses}
            />
            {fieldErrors?.demoUrl?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Category ── */}
          <div>
            <label htmlFor="category" className={labelClasses}>
              Category
            </label>
            <select
              id="category"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value as CategorySlug)}
              className={inputClasses}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── Logo Upload ── */}
          <div>
            <label className={labelClasses}>Logo</label>
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl || "/placeholder-logo.svg"}
                alt="Logo"
                className="h-14 w-14 rounded-sm border border-card-border object-cover"
              />
              <label className="cursor-pointer text-xs text-muted underline-offset-2 hover:text-ink hover:underline">
                {uploadingLogo ? "Uploading…" : "Change"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) =>
                    handleFileUpload(e, "logos", setLogoUrl, setUploadingLogo)
                  }
                  disabled={uploadingLogo}
                />
              </label>
            </div>
            {fieldErrors?.logoUrl?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Hero Image Upload ── */}
          <div>
            <label className={labelClasses}>Hero image</label>
            <div className="mt-2">
              <div className="relative aspect-video overflow-hidden rounded-md bg-soft-stone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroImageUrl}
                  alt="Hero"
                  className="h-full w-full object-cover"
                />
              </div>
              <label className="mt-2 inline-block cursor-pointer text-xs text-muted underline-offset-2 hover:text-ink hover:underline">
                {uploadingHero ? "Uploading…" : "Change image"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) =>
                    handleFileUpload(
                      e,
                      "heroes",
                      setHeroImageUrl,
                      setUploadingHero,
                    )
                  }
                  disabled={uploadingHero}
                />
              </label>
            </div>
            {fieldErrors?.heroImageUrl?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Gallery Uploads ── */}
          <div>
            <label className={labelClasses}>
              Gallery images <span className="text-muted">(max 5)</span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {galleryUrls.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="group relative aspect-video overflow-hidden rounded-md bg-soft-stone"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Gallery ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/70 text-xs text-white opacity-0 transition hover:bg-error group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {galleryUrls.length < 5 ? (
                <label className="flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-hairline bg-transparent text-sm text-muted transition hover:border-primary/30">
                  {uploadingGallery ? "Uploading…" : "+ Add"}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleGalleryUpload}
                    disabled={uploadingGallery}
                  />
                </label>
              ) : null}
            </div>
            {fieldErrors?.galleryUrls?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Video URL ── */}
          <div>
            <label htmlFor="videoUrl" className={labelClasses}>
              Video URL
            </label>
            <input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className={inputClasses}
            />
            {fieldErrors?.videoUrl?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Submit Button ── */}
          <div className="flex items-center justify-between gap-4 border-t border-hairline pt-6">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center justify-center rounded-pill border border-error/30 px-5 py-2.5 text-sm font-medium text-error transition hover:bg-error/5"
            >
              Delete product
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-pill bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        {/* ── Delete Confirmation Dialog ── */}
        {showDeleteConfirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-md bg-canvas p-8 shadow-lg">
              <h2 className="mb-2 font-display text-xl text-ink">
                Delete product
              </h2>
              <p className="mb-6 text-sm text-body-muted">
                Are you sure you want to delete <strong>{product.name}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="inline-flex items-center justify-center rounded-pill border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-soft-stone"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center rounded-pill bg-error px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
