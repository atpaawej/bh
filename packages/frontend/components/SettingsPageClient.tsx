"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth/AuthContext";
import { fetchOwnProfile, fetchUploadUrl, updateProfile } from "../lib/api";
import type { UserResponse } from "@bh/shared";
import { ProtectedRoute } from "./auth/ProtectedRoute";

export function SettingsPageClient() {
  const { user, isLoading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const hasFetched = useRef(false);

  // Fetch full profile once auth is ready (the auth context only has name/avatar)
  useEffect(() => {
    if (!user || hasFetched.current) return;
    hasFetched.current = true;

    setLoadingProfile(true);
    void fetchOwnProfile()
      .then((profile: UserResponse) => {
        setName(profile.name);
        setBio(profile.bio ?? "");
        setTwitterHandle(profile.twitterHandle ?? "");
        setWebsite(profile.website ?? "");
        setAvatarUrl(profile.avatarUrl);
      })
      .catch(() => {
        // Fall back to auth context values
        setName(user.name);
        setAvatarUrl(user.avatarUrl);
      })
      .finally(() => {
        setLoadingProfile(false);
      });
  }, [user]);

  const getSignedUrl = useCallback(async () => {
    return fetchUploadUrl("logos");
  }, []);

  const uploadToCloudinary = useCallback(
    async (file: File) => {
      const signed = await getSignedUrl();

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

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadingAvatar(true);
      setError(null);
      try {
        const url = await uploadToCloudinary(file);
        setAvatarUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingAvatar(false);
      }
    },
    [uploadToCloudinary],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (saving) return;
    setSaving(true);

    try {
      await updateProfile({
        name: name.trim() || undefined,
        bio: bio.trim() || null,
        twitterHandle: twitterHandle.trim() || null,
        website: website.trim() || null,
        avatarUrl: avatarUrl,
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClasses =
    "w-full rounded-border bg-canvas px-4 py-2.5 text-sm text-ink outline-none ring-1 ring-hairline transition focus:ring-2 focus:ring-primary/30 placeholder:text-muted";

  const labelClasses = "text-sm font-medium text-ink";

  if (authLoading || loadingProfile) {
    return (
      <div className="mx-auto max-w-[640px] px-6 py-12">
        <div className="mb-8 h-10 w-48 animate-pulse rounded bg-hairline/60" />
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="mb-2 h-4 w-24 rounded bg-hairline/40" />
              <div className="h-10 w-full rounded-border bg-hairline/40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-[640px] px-6 py-12">
        <p className="mono-label mb-2 text-xs text-muted">SETTINGS</p>
        <h1 className="mb-8 font-display text-3xl tracking-tight text-ink md:text-4xl">
          Edit profile
        </h1>

        {error ? (
          <div className="mb-6 rounded-sm border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 rounded-sm border border-deep-green/30 bg-deep-green/5 px-4 py-3 text-sm text-deep-green">
            Profile updated successfully.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className={labelClasses}>
              Name <span className="text-coral">*</span>
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
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className={labelClasses}>
              Bio <span className="text-muted">(optional)</span>
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short description about yourself"
              className={`${inputClasses} min-h-[100px] resize-y`}
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs text-muted">
              {bio.length}/500
            </p>
          </div>

          {/* Avatar */}
          <div>
            <label className={labelClasses}>
              Avatar <span className="text-muted">(optional)</span>
            </label>
            {avatarUrl ? (
              <div className="mt-2 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="h-16 w-16 rounded-sm border border-card-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="text-xs text-muted underline-offset-2 hover:text-error hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="mt-2 flex cursor-pointer items-center justify-center rounded-border border-2 border-dashed border-hairline px-4 py-4 transition hover:border-primary/30">
                <span className="text-sm text-muted">
                  {uploadingAvatar ? "Uploading…" : "Click to upload avatar"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            )}
          </div>

          {/* Twitter */}
          <div>
            <label htmlFor="twitter" className={labelClasses}>
              Twitter handle <span className="text-muted">(optional)</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                @
              </span>
              <input
                id="twitter"
                type="text"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
                placeholder="username"
                className={`${inputClasses} pl-7`}
                maxLength={100}
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className={labelClasses}>
              Website <span className="text-muted">(optional)</span>
            </label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className={inputClasses}
              maxLength={500}
            />
          </div>

          {/* Submit */}
          <div className="border-t border-hairline pt-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-pill bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
