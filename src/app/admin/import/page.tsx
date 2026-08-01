import type { Metadata } from "next";
import Link from "next/link";
import { ChapterImport } from "./_components/ChapterImport";

export const metadata: Metadata = { title: "Import chapters" };

export default function ImportPage() {
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
          Bulk import books & chapters
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload an Excel to create books and chapters in bulk. Give each row its
          NCERT <code>ncert_code</code> and the official PDF link is generated
          automatically. Chapters are keyed by <code>chapter_code</code>, so
          re-importing updates in place.
        </p>
      </div>
      <ChapterImport />
    </div>
  );
}
