"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary.
 *
 * This is the one screen that cannot pick its theme by awaiting a cookie: it is
 * a client component and the framework renders it with only `error` and `reset`.
 * Reading <html data-theme> during render would mismatch on hydration. So both
 * variants are rendered and one is hidden by a theme-scoped CSS rule — the
 * hidden copy is `display: none`, so it is out of the tab order and out of the
 * accessibility tree, and there are no duplicate controls.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      {/* ── classic, unchanged ── */}
      <main className="bh-when-classic flex flex-1 items-center justify-center px-6 py-24">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Something went wrong
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            An unexpected error occurred. You can try again, or head back home.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={reset}>Try again</Button>
          </div>
        </div>
      </main>

      {/* ── bhavishya ── */}
      <main className="bh-when-new mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-24">
        <p className="bh-eyebrow">Something broke</p>
        <h1 className="bh-h2 mt-4">This page didn’t load</h1>
        <p className="bh-lede mt-3 max-w-md">
          The problem is on our side, not yours. Trying again usually works — if
          it doesn’t, the rest of the site is still fine.
        </p>
        {error.digest && (
          <p className="bh-mono bh-muted mt-4">Reference {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className="bh-btn bh-btn-primary">
            Try again
          </button>
          <Link href="/browse" className="bh-btn bh-btn-quiet">
            Browse chapters
          </Link>
        </div>
      </main>
    </>
  );
}
