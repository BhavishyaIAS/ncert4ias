import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChaptersForSubject, subjectLensLabel } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { ThemedPage } from "@/components/themed-page";
import { BhavishyaSubjectChapters } from "@/components/bhavishya/subjects";

export const metadata: Metadata = { title: "Subject chapters" };

async function ClassicSubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { subject, chapters } = await getChaptersForSubject(slug);
  if (!subject) notFound();
  const label = subjectLensLabel(subject);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <nav className="text-sm text-muted-foreground">
        <Link href="/subjects" className="underline-offset-4 hover:underline">
          Subjects
        </Link>{" "}
        / {label}
      </nav>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{label}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {chapters.length} chapter{chapters.length === 1 ? "" : "s"} across all
        classes.
      </p>

      {chapters.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No published chapters for {label} yet.
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
                    Class {ch.book.class.number}
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

async function BhavishyaSubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { subject, chapters } = await getChaptersForSubject(slug);
  if (!subject) notFound();
  return <BhavishyaSubjectChapters subject={subject} chapters={chapters} />;
}

export default function SubjectPage(props: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <ThemedPage
      classic={<ClassicSubjectPage {...props} />}
      bhavishya={<BhavishyaSubjectPage {...props} />}
    />
  );
}
