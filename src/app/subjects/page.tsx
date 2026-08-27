import type { Metadata } from "next";
import Link from "next/link";
import { getSubjectsForLens, subjectDisplayLabel } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedPage } from "@/components/themed-page";
import { BhavishyaSubjectsIndex } from "@/components/bhavishya/subjects";

export const metadata: Metadata = { title: "Browse by subject" };

async function ClassicSubjectsIndexPage() {
  const subjects = await getSubjectsForLens();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Browse by subject</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a subject and work its chapters — and their Prelims MCQs — across
        every class at once.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {subjects.map((s) => (
          <Link key={s.id} href={`/subjects/${s.slug}`}>
            <Card className="h-full transition-colors hover:border-foreground/30">
              <CardHeader>
                <CardTitle className="text-lg">{subjectDisplayLabel(s)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {s.chapterCount} chapter{s.chapterCount === 1 ? "" : "s"}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

async function BhavishyaSubjectsIndexPage() {
  const subjects = await getSubjectsForLens();
  return <BhavishyaSubjectsIndex subjects={subjects} />;
}

export default function SubjectsIndexPage() {
  return (
    <ThemedPage
      classic={<ClassicSubjectsIndexPage />}
      bhavishya={<BhavishyaSubjectsIndexPage />}
    />
  );
}
