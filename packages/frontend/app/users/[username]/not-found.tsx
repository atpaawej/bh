import Link from "next/link";

export default function UserNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-container flex-col items-center justify-center px-6 py-20 text-center">
      <p className="mono-label mb-4">404</p>
      <h1 className="font-display text-4xl tracking-tight text-ink md:text-5xl">
        User not found
      </h1>
      <p className="mt-4 max-w-md text-body-muted">
        This user doesn&apos;t exist. Head back to discover what India is shipping.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-pill bg-primary px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        Browse products
      </Link>
    </div>
  );
}
