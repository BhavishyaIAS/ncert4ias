import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChaptersForGsTag } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "GS chapters" };

export default async function GsTagPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const { tag, chapters } = await getChaptersForGsTag(code.toUpperCase());
  if (!tag) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <nav className="text-sm text-muted-foreground">
        <Link href="/gs" className="underline-offset-4 hover:underline">
          GS subjects
        </Link>{" "}
        / {tag.label}
      </nav>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{tag.label}</h1>
      {tag.note && (
        <p className="mt-1 text-sm text-muted-foreground">{tag.note}</p>
      )}

      {chapters.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No published chapters mapped to {tag.label} yet.
        </p>
      ) : (
        <ul className="mt-8 divide-y rounded-lg border">
          {chapters.map((ch) => (
            <li key={ch.id}>
              <Link
                href={`/chapter/${ch.chapter_code}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
              >
                <span className="font-medium">{ch.title}</span>
                <span className="ml-auto flex items-center gap-2">
                  <Badge variant="secondary">
                    Class {ch.book.class.number} · {ch.book.subject.name}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {ch.chapter_code}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
