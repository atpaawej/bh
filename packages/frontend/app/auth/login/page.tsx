"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../lib/auth/AuthContext";
import { safeRedirectPath } from "../../../lib/auth/redirect";
import { ApiClientError } from "../../../lib/api";

function LoginForm() {
  const {
    loginWithGoogle,
    loginWithGitHub,
    sendMagicLink,
    isAuthenticated,
    isLoading,
  } = useAuth();
  const searchParams = useSearchParams();
  const redirect = safeRedirectPath(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(
    null,
  );

  // Persist return URL for OAuth/magic-link round-trip
  useEffect(() => {
    if (redirect && redirect !== "/") {
      sessionStorage.setItem("bh_auth_redirect", redirect);
    }
  }, [redirect]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.replace(redirect);
    }
  }, [isAuthenticated, isLoading, redirect]);

  async function handleOAuth(provider: "google" | "github") {
    setError(null);
    setOauthLoading(provider);
    try {
      if (provider === "google") await loginWithGoogle();
      else await loginWithGitHub();
    } catch (err) {
      setOauthLoading(null);
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to start OAuth login",
      );
    }
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    try {
      await sendMagicLink(email.trim());
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Unable to send magic link",
      );
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-hairline bg-canvas p-8 shadow-sm md:p-10">
        <p className="mono-label mb-4">Welcome back</p>
        <h1 className="font-display text-3xl tracking-tight text-ink">
          Sign in to BharatHunt
        </h1>
        <p className="mt-2 text-sm text-body-muted">
          Vote, comment, and launch products with the community.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-sm border border-error/30 bg-error/5 px-4 py-3 text-sm text-error"
          >
            {error}
          </div>
        )}

        {status === "sent" && (
          <div className="mt-6 rounded-sm border border-deep-green/20 bg-deep-green/5 px-4 py-3 text-sm text-deep-green">
            Magic link sent to <strong>{email}</strong>. Check your inbox and
            click the link to sign in.
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => void handleOAuth("google")}
            disabled={oauthLoading !== null || status === "sending"}
            className="flex w-full items-center justify-center gap-3 rounded-sm border border-hairline bg-canvas px-4 py-3 text-sm font-medium text-ink transition hover:bg-soft-stone disabled:opacity-60"
          >
            <GoogleIcon />
            {oauthLoading === "google"
              ? "Redirecting…"
              : "Continue with Google"}
          </button>

          <button
            type="button"
            onClick={() => void handleOAuth("github")}
            disabled={oauthLoading !== null || status === "sending"}
            className="flex w-full items-center justify-center gap-3 rounded-sm border border-hairline bg-canvas px-4 py-3 text-sm font-medium text-ink transition hover:bg-soft-stone disabled:opacity-60"
          >
            <GitHubIcon />
            {oauthLoading === "github"
              ? "Redirecting…"
              : "Continue with GitHub"}
          </button>
        </div>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-hairline" />
          <span className="text-xs uppercase tracking-wider text-muted">
            or
          </span>
          <div className="h-px flex-1 bg-hairline" />
        </div>

        <form onSubmit={(e) => void handleMagicLink(e)} className="text-left">
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-ink"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "sending" || status === "sent"}
            className="w-full rounded-sm border border-hairline bg-canvas px-4 py-3 text-sm text-ink outline-none ring-deep-green/30 placeholder:text-muted focus:ring-2"
          />
          <button
            type="submit"
            disabled={
              status === "sending" || status === "sent" || !email.trim()
            }
            className="mt-4 w-full rounded-pill bg-primary px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
        </form>

        <p className="mt-8 text-xs leading-relaxed text-muted">
          By continuing you agree to our{" "}
          <Link href="/" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9 0C4.03 0 0 4.13 0 9.22c0 4.07 2.58 7.52 6.16 8.74.45.08.61-.2.61-.44v-1.54c-2.5.56-3.03-1.23-3.03-1.23-.41-1.07-1-1.35-1-1.35-.82-.57.06-.56.06-.56.9.07 1.38.95 1.38.95.8 1.41 2.11 1 2.62.77.08-.6.31-1 .57-1.23-2-.23-4.1-1.03-4.1-4.56 0-1.01.35-1.83.93-2.48-.09-.23-.4-1.17.09-2.44 0 0 .76-.25 2.5.95a8.4 8.4 0 014.54 0c1.73-1.2 2.5-.95 2.5-.95.49 1.27.18 2.21.09 2.44.58.65.93 1.47.93 2.48 0 3.54-2.11 4.33-4.12 4.56.32.29.61.85.61 1.71v2.54c0 .24.16.53.62.44A9.23 9.23 0 0018 9.22C18 4.13 13.97 0 9 0z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
