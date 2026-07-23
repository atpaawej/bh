"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * Catches render errors in its subtree and shows a fallback UI instead of
 * crashing the whole page. Optionally accepts a custom fallback.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="mx-auto flex min-h-[30vh] max-w-container flex-col items-center justify-center px-6 py-16 text-center">
          <p className="mono-label mb-4">Error</p>
          <h2 className="mb-2 font-display text-2xl tracking-tight text-ink">
            Something went wrong
          </h2>
          <p className="mb-6 max-w-md text-sm text-body-muted">
            A section of this page encountered an unexpected error.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center rounded-pill bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
