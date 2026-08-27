import Link from "next/link";

/**
 * Shared footer. The product ships the classic UI only, so there is no longer
 * an appearance switch here — the "New view" (bhavishya redesign) has been
 * retired.
 */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <p className="text-sm text-muted-foreground">
          NCERT4IAS —{" "}
          <Link href="/browse" className="underline-offset-4 hover:underline">
            browse chapters
          </Link>
        </p>
      </div>
    </footer>
  );
}
