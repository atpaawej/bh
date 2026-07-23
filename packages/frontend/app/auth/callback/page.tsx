"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../lib/auth/AuthContext";
import { safeRedirectPath } from "../../../lib/auth/redirect";
import { ApiClientError } from "../../../lib/api";

/**
 * OAuth / magic-link landing page.
 * Reads `code`, `token_hash`, or hash-fragment `access_token` and completes login via the backend.
 */
function CallbackHandler() {
  const { completeFromCallback } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const code = searchParams.get("code");
        const tokenHash =
          searchParams.get("token_hash") ?? searchParams.get("tokenHash");
        const type = searchParams.get("type");

        // Implicit-flow / some magic-link redirects put tokens in the hash
        const hash =
          typeof window !== "undefined"
            ? window.location.hash.replace(/^#/, "")
            : "";
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");

        if (!code && !tokenHash && !accessToken) {
          throw new Error("No auth credentials found in callback URL");
        }

        const redirect = safeRedirectPath(
          sessionStorage.getItem("bh_auth_redirect"),
        );
        sessionStorage.removeItem("bh_auth_redirect");

        await completeFromCallback({ code, accessToken, tokenHash, type });

        if (!cancelled) {
          // Clean hash tokens from the URL bar before navigating
          if (hash) {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search,
            );
          }
          router.replace(redirect);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiClientError
              ? err.message
              : "Sign-in failed. Please try again.",
          );
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [completeFromCallback, router, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
        <a
          href="/auth/login"
          className="text-sm font-medium text-action-blue underline-offset-2 hover:underline"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-muted">Completing sign in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-muted">Completing sign in…</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
