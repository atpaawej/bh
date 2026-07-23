"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, type CategorySlug } from "@bh/shared";
import type { CreateProductInput } from "@bh/shared";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { useAuth } from "../../lib/auth/AuthContext";
import { createProduct, fetchCategories, fetchUploadUrl } from "../../lib/api";
import type { CategoryResponse } from "@bh/shared";

function toCategoryMap(cats: CategoryResponse[]) {
  const map = new Map<string, string>();
  for (const c of cats) {
    map.set(c.slug, c.id);
    map.set(c.id, c.id);
  }
  return map;
}

function getNextFriday(): string {
  const now = new Date();
  const friday = new Date(now);
  friday.setUTCDate(
    friday.getUTCDate() + ((5 + 7 - friday.getUTCDay()) % 7 || 7),
  );
  friday.setUTCHours(0, 0, 0, 0);
  return friday.toISOString();
}

type SubmitMode = "draft" | "publish" | "schedule";

export default function LaunchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(
    new Map(),
  );
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

  // ── Image uploads ──
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
        setCategoryMap(toCategoryMap(cats));
        if (cats.length > 0) {
          setCategorySlug(cats[0].slug as CategorySlug);
        }
      })
      .catch(() => {
        setError("Failed to load categories");
      });
  }, []);

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

  async function handleSubmit(mode: SubmitMode) {
    setError(null);
    setFieldErrors(null);

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const categoryId = categoryMap.get(categorySlug);
      if (!categoryId) {
        setError("Invalid category selected");
        return;
      }

      const input: CreateProductInput = {
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        categoryId,
        logoUrl,
        heroImageUrl,
      };

      if (demoUrl.trim()) input.demoUrl = demoUrl.trim();
      if (galleryUrls.length > 0) input.galleryUrls = galleryUrls;
      if (videoUrl.trim()) input.videoUrl = videoUrl.trim();

      if (mode === "schedule") {
        input.scheduledFor = getNextFriday();
      }
      // mode === 'draft': no launchedAt, stays draft
      // mode === 'publish': no scheduledFor, launches immediately

      const product = await createProduct(input);
      router.push(`/products/${product.slug}`);
    } catch (err: unknown) {
      const apiErr = err as {
        message?: string;
        details?: Record<string, string[]>;
      };
      setError(apiErr.message ?? "Failed to create product");
      if (apiErr.details) {
        setFieldErrors(apiErr.details);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClasses =
    "w-full rounded-border bg-canvas px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-hairline transition focus:ring-2 focus:ring-primary/30 placeholder:text-muted";

  const labelClasses = "text-sm font-medium text-ink";

  const errorClasses = "mt-1 text-xs text-error";

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-[680px] px-6 py-12">
        <p className="mono-label mb-2 text-center text-xs text-muted">LAUNCH</p>
        <h1 className="mb-2 text-center font-display text-4xl tracking-tight text-ink md:text-5xl">
          Ship your product
        </h1>
        <p className="mx-auto mb-10 max-w-md text-center text-body-muted">
          Share what you&apos;ve built with the Indian maker community.
        </p>

        {error ? (
          <div className="mb-6 rounded-sm border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            handleSubmit("publish");
          }}
          className="space-y-6"
        >
          {/* ── Name ── */}
          <div>
            <label htmlFor="name" className={labelClasses}>
              Product name <span className="text-coral">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Krutrim AI"
              className={inputClasses}
              maxLength={100}
              required
            />
            {fieldErrors?.name?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
            <p className="mt-1 text-right text-xs text-muted">
              {name.length}/100 (min 3)
            </p>
          </div>

          {/* ── Tagline ── */}
          <div>
            <label htmlFor="tagline" className={labelClasses}>
              Tagline <span className="text-coral">*</span>
            </label>
            <input
              id="tagline"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A short, punchy description of your product"
              className={inputClasses}
              maxLength={150}
              required
            />
            {fieldErrors?.tagline?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
            <p className="mt-1 text-right text-xs text-muted">
              {tagline.length}/150 (min 10)
            </p>
          </div>

          {/* ── Description ── */}
          <div>
            <label htmlFor="description" className={labelClasses}>
              Description <span className="text-coral">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your product — what problem it solves, who it's for, and what makes it special... (min 50 characters)"
              className={`${inputClasses} min-h-[160px] resize-y`}
              maxLength={5000}
              required
            />
            {fieldErrors?.description?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
            <p className="mt-1 text-right text-xs text-muted">
              {description.length}/5000 (min 50)
            </p>
          </div>

          {/* ── Website URL ── */}
          <div>
            <label htmlFor="websiteUrl" className={labelClasses}>
              Website URL <span className="text-coral">*</span>
            </label>
            <input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className={inputClasses}
              required
            />
            {fieldErrors?.websiteUrl?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
            <p className="mt-1 text-xs text-muted">
              Must be a valid URL (e.g. https://example.com)
            </p>
          </div>

          {/* ── Demo URL ── */}
          <div>
            <label htmlFor="demoUrl" className={labelClasses}>
              Demo URL <span className="text-muted">(optional)</span>
            </label>
            <input
              id="demoUrl"
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://demo.example.com"
              className={inputClasses}
            />
            {fieldErrors?.demoUrl?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
            <p className="mt-1 text-xs text-muted">
              Optional — must be a valid URL if provided
            </p>
          </div>

          {/* ── Category ── */}
          <div>
            <label htmlFor="category" className={labelClasses}>
              Category <span className="text-coral">*</span>
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
            {fieldErrors?.categoryId?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Logo Upload ── */}
          <div>
            <label className={labelClasses}>
              Logo <span className="text-coral">*</span>
            </label>
            {logoUrl ? (
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-14 w-14 rounded-sm border border-card-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="text-xs text-muted underline-offset-2 hover:text-error hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="mt-2 flex cursor-pointer items-center justify-center rounded-border border-2 border-dashed border-hairline px-4 py-6 transition hover:border-primary/30">
                <span className="text-sm text-muted">
                  {uploadingLogo ? "Uploading…" : "Click to upload logo"}
                </span>
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
            )}
            {fieldErrors?.logoUrl?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Hero Image Upload ── */}
          <div>
            <label className={labelClasses}>
              Hero image <span className="text-coral">*</span>
            </label>
            {heroImageUrl ? (
              <div className="mt-2">
                <div className="relative aspect-video overflow-hidden rounded-md bg-soft-stone">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImageUrl}
                    alt="Hero preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setHeroImageUrl("")}
                  className="mt-2 text-xs text-muted underline-offset-2 hover:text-error hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="mt-2 flex cursor-pointer items-center justify-center rounded-border border-2 border-dashed border-hairline px-4 py-6 transition hover:border-primary/30">
                <span className="text-sm text-muted">
                  {uploadingHero
                    ? "Uploading…"
                    : "Click to upload hero image (16:9 recommended)"}
                </span>
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
            )}
            {fieldErrors?.heroImageUrl?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Gallery Uploads ── */}
          <div>
            <label className={labelClasses}>
              Gallery images{" "}
              <span className="text-muted">(optional, max 5)</span>
            </label>
            {galleryUrls.length > 0 ? (
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
                      aria-label={`Remove gallery image ${i + 1}`}
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
            ) : (
              <label className="mt-2 flex cursor-pointer items-center justify-center rounded-border border-2 border-dashed border-hairline px-4 py-6 transition hover:border-primary/30">
                <span className="text-sm text-muted">
                  {uploadingGallery
                    ? "Uploading…"
                    : "Click to upload gallery images"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleGalleryUpload}
                  disabled={uploadingGallery}
                  multiple
                />
              </label>
            )}
            {fieldErrors?.galleryUrls?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
          </div>

          {/* ── Video URL ── */}
          <div>
            <label htmlFor="videoUrl" className={labelClasses}>
              Video URL <span className="text-muted">(optional)</span>
            </label>
            <input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputClasses}
            />
            {fieldErrors?.videoUrl?.map((msg) => (
              <p key={msg} className={errorClasses}>
                {msg}
              </p>
            ))}
            <p className="mt-1 text-xs text-muted">
              Optional — must be a valid URL if provided
            </p>
          </div>

          {/* ── Submit Actions ── */}
          <div className="flex flex-col gap-3 border-t border-hairline pt-6 sm:flex-row">
            <button
              type="button"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-pill border border-hairline px-6 py-3 text-sm font-medium text-ink transition hover:bg-soft-stone disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save as draft"}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center rounded-pill bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "Publishing…" : "Publish now"}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit("schedule")}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-pill border border-hairline px-6 py-3 text-sm font-medium text-ink transition hover:bg-soft-stone disabled:opacity-50"
            >
              {isSubmitting ? "Scheduling…" : "Schedule for next Friday"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
