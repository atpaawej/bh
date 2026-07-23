"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-container flex-col items-center justify-center px-6 py-20 text-center">
      <p className="mono-label mb-4">500</p>
      <h1 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-body-muted">
        An unexpected error occurred. Please try again or head back home.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-pill bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center text-sm text-ink underline-offset-4 hover:underline"
        >
          Go home →
        </Link>
      </div>
    </div>
  );
}
