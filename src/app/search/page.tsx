import type { Metadata } from "next";
import Link from "next/link";
import { search } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await search(q) : null;
  const total = results
    ? results.chapters.length +
      results.gists.length +
      results.mcqs.length +
      results.pyqs.length
    : 0;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>

      <form action="/search" className="mt-4 flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search chapters, gists, MCQs, PYQs…"
          autoFocus
        />
        <Button type="submit">Search</Button>
      </form>

      {results && (
        <p className="mt-6 text-sm text-muted-foreground">
          {total} result{total === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      )}

      {results && total === 0 && (
        <p className="mt-8 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nothing found. Only published content is searchable.
        </p>
      )}

      {results && results.chapters.length > 0 && (
        <Section title="Chapters">
          {results.chapters.map((c) => (
            <ResultRow
              key={c.chapter_code}
              href={`/chapter/${c.chapter_code}`}
              title={c.title}
              meta={c.book?.subject?.name ?? c.book?.title ?? ""}
              code={c.chapter_code}
            />
          ))}
        </Section>
      )}

      {results && results.gists.length > 0 && (
        <Section title="Revision gists">
          {results.gists
            .filter((g) => g.chapter)
            .map((g, i) => (
              <ResultRow
                key={i}
                href={`/chapter/${g.chapter!.chapter_code}`}
                title={g.chapter!.title}
                meta="Matched in gist"
                code={g.chapter!.chapter_code}
              />
            ))}
        </Section>
      )}

      {results && results.mcqs.length > 0 && (
        <Section title="Prelims MCQs">
          {results.mcqs
            .filter((m) => m.chapter)
            .map((m, i) => (
              <ResultRow
                key={i}
                href={`/chapter/${m.chapter!.chapter_code}`}
                title={m.stem}
                meta={m.chapter!.title}
                code={m.chapter!.chapter_code}
              />
            ))}
        </Section>
      )}

      {results && results.pyqs.length > 0 && (
        <Section title="PYQs">
          {results.pyqs.map((p, i) => {
            const first = p.pyq_chapters.find((pc) => pc.chapter)?.chapter;
            const inner = (
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm">{p.question_text}</p>
                  <div className="mt-1 flex gap-2">
                    <Badge variant="secondary">{p.year}</Badge>
                    <Badge variant="outline">{p.paper}</Badge>
                  </div>
                </div>
              </div>
            );
            return first ? (
              <Link
                key={i}
                href={`/chapter/${first.chapter_code}`}
                className="block hover:bg-muted/40"
              >
                {inner}
              </Link>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </Section>
      )}
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ul className="divide-y rounded-lg border">{children}</ul>
    </section>
  );
}

function ResultRow({
  href,
  title,
  meta,
  code,
}: {
  href: string;
  title: string;
  meta: string;
  code: string;
}) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
        <span className="flex-1 text-sm font-medium">{title}</span>
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
        <span className="font-mono text-xs text-muted-foreground">{code}</span>
      </Link>
    </li>
  );
}
