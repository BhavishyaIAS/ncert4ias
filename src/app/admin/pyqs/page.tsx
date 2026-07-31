import type { Metadata } from "next";
import Link from "next/link";
import { PyqUpload } from "./_components/PyqUpload";

export const metadata: Metadata = { title: "PYQ upload" };

export default function PyqsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Bulk PYQ upload
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload an Excel of previous-year questions. Each row links to chapters
          by <code>chapter_code</code>; the log shows what linked and what
          didn&apos;t.
        </p>
      </div>
      <PyqUpload />
    </div>
  );
}
