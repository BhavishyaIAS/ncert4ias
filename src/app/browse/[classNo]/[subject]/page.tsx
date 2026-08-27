import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CLASSES } from "@/lib/config/taxonomy";
import {
  getBooksWithChapters,
  getSubjectBySlug,
  subjectDisplayLabel,
} from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { ThemedPage } from "@/components/themed-page";
import { BhavishyaSubject } from "@/components/bhavishya/browse";

export const metadata: Metadata = { title: "Browse chapters" };

function parseClassNo(value: string): number | null {
  const n = Number(value);
  return (CLASSES as readonly number[]).includes(n) ? n : null;
}

async function ClassicSubjectPage({
  params,
}: {
  params: Promise<{ classNo: string; subject: string }>;
}) {
  const { classNo, subject: subjectSlug } = await params;
  const n = parseClassNo(classNo);
  if (n === null) notFound();

  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const books = await getBooksWithChapters(n, subjectSlug);
  const label = subjectDisplayLabel(subject);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <nav className="text-sm text-muted-foreground">
        <Link href="/browse" className="underline-offset-4 hover:underline">
          Browse
        </Link>{" "}
        /{" "}
        <Link
          href={`/browse/${n}`}
          className="underline-offset-4 hover:underline"
        >
          Class {n}
        </Link>{" "}
        / {label}
      </nav>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Class {n} · {label}
      </h1>

      {books.every((b) => b.chapters.length === 0) ? (
        <p className="mt-8 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No published chapters here yet.
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {books.map((book) =>
            book.chapters.length === 0 ? null : (
              <section key={book.id}>
                <h2 className="text-lg font-medium">{book.title}</h2>
                <ul className="mt-3 divide-y rounded-lg border">
                  {book.chapters.map((ch) => (
                    <li key={ch.id}>
                      <Link
                        href={`/chapter/${ch.chapter_code}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
                      >
                        <span className="w-6 text-sm tabular-nums text-muted-foreground">
                          {ch.chapter_number}
                        </span>
                        <span className="font-medium">{ch.title}</span>
                        <span className="ml-auto font-mono text-xs text-muted-foreground">
                          {ch.chapter_code}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-2">
                  <Badge variant="secondary">
                    {book.chapters.length} chapter
                    {book.chapters.length === 1 ? "" : "s"}
                  </Badge>
                </div>
              </section>
            ),
          )}
        </div>
      )}
    </main>
  );
}

async function BhavishyaSubjectPage({
  params,
}: {
  params: Promise<{ classNo: string; subject: string }>;
}) {
  const { classNo, subject: subjectSlug } = await params;
  const n = parseClassNo(classNo);
  if (n === null) notFound();
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();
  const books = await getBooksWithChapters(n, subjectSlug);
  return <BhavishyaSubject classNo={n} subject={subject} books={books} />;
}

export default function SubjectPage(props: {
  params: Promise<{ classNo: string; subject: string }>;
}) {
  return (
    <ThemedPage
      classic={<ClassicSubjectPage {...props} />}
      bhavishya={<BhavishyaSubjectPage {...props} />}
    />
  );
}
