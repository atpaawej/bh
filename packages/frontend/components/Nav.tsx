"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "../lib/auth/AuthContext";
import { LaunchCta } from "./LaunchCta";
import { UserMenu } from "./UserMenu";

function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}

      {/* Drawer */}
      <div
        id={menuId}
        role="dialog"
        aria-modal={open}
        aria-label="Navigation menu"
        className={`fixed right-0 top-0 z-50 flex h-full w-64 flex-col bg-canvas shadow-lg transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-end px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-muted hover:text-ink"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
          <MobileLink href="/" onClick={onClose}>
            Discover
          </MobileLink>
          <MobileLink href="/launch" onClick={onClose}>
            Launch
          </MobileLink>
          <MobileLink href="/leaderboard" onClick={onClose}>
            Leaderboard
            <span className="ml-2 rounded-full bg-deep-green/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-deep-green">
              Live
            </span>
          </MobileLink>
          <span className="block px-4 py-3 text-sm text-muted">Categories</span>
        </nav>
      </div>
    </>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-sm px-4 py-3 text-sm font-medium text-ink transition hover:bg-soft-stone"
    >
      {children}
    </Link>
  );
}

export function Nav() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <nav aria-label="Main" className="sticky top-0 z-50 border-b border-hairline bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto grid h-16 max-w-container grid-cols-[1fr_auto] items-center px-6 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="font-display text-xl tracking-tight text-ink">
          <span className="font-medium">Bharat</span>Hunt
        </Link>

        {/* Desktop nav links */}
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
                className="hidden text-sm font-medium text-muted transition hover:text-ink sm:inline"
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

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-sm text-muted hover:text-ink md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.5} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      <MobileMenu open={mobileMenuOpen} onClose={closeMobileMenu} />
    </nav>
  );
}
