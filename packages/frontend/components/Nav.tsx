"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth/AuthContext";
import { LaunchCta, LaunchNavLink } from "./LaunchCta";
import { UserMenu } from "./UserMenu";

export function Nav() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-hairline bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-container grid-cols-[1fr_auto] items-center px-6 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="font-display text-xl tracking-tight text-ink">
          <span className="font-medium">Bharat</span>Hunt
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-medium text-ink">
            Discover
          </Link>
          <Link href="/launch" className="text-sm font-medium text-ink">
            Launch
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink"
          >
            Leaderboard
            <span className="rounded-full bg-deep-green/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-deep-green">
              Live
            </span>
          </Link>
          <span className="text-sm text-muted">Categories</span>
          <LaunchNavLink />
        </div>

        <div className="flex items-center justify-end gap-3">
          {isLoading ? (
            <span
              className="h-9 w-9 animate-pulse rounded-full bg-soft-stone"
              aria-hidden
            />
          ) : isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted transition hover:text-ink"
              >
                Dashboard
              </Link>
              <LaunchCta
                labelLoggedIn="Launch"
                labelLoggedOut="Launch"
                size="sm"
              />
              <UserMenu />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden text-sm text-muted transition hover:text-ink sm:inline"
              >
                Sign in
              </Link>
              <Link
                href={`/auth/login?redirect=${encodeURIComponent("/launch")}`}
                className="inline-flex items-center rounded-pill bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
