"use client";

import Link from "next/link";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  console.error(error);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-20 text-center font-body antialiased">
        <p className="mono-label mb-4">500</p>
        <h1 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
          Something went wrong
        </h1>
        <p className="mt-4 max-w-md text-body-muted">
          A critical error occurred. Please try again or head back home.
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
      </body>
    </html>
  );
}
