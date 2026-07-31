import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapterByCode, getGist, getMcqs } from "@/lib/queries";
import { LADDER_RUNGS } from "@/lib/config/taxonomy";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GistView } from "@/components/gist-view";
import { PrelimsPractice } from "@/components/prelims-practice";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const chapter = await getChapterByCode(code);
  return { title: chapter ? chapter.title : "Chapter" };
}

function RungComingSoon({ rung }: { rung: string }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center">
      <p className="text-sm text-muted-foreground">
        The <span className="font-medium text-foreground">{rung}</span> rung is
        coming soon for this chapter.
      </p>
    </div>
  );
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const chapter = await getChapterByCode(code);
  if (!chapter) notFound();

  const [gist, mcqs] = await Promise.all([
    getGist(chapter.id),
    getMcqs(chapter.id),
  ]);
  const { book } = chapter;
  const n = book.class.number;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/browse" className="underline-offset-4 hover:underline">
          Browse
        </Link>{" "}
        /{" "}
        <Link href={`/browse/${n}`} className="underline-offset-4 hover:underline">
          Class {n}
        </Link>{" "}
        /{" "}
        <Link
          href={`/browse/${n}/${book.subject.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {book.subject.name}
        </Link>
      </nav>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {chapter.chapter_number}. {chapter.title}
        </h1>
        <Badge variant="secondary" className="font-mono">
          {chapter.chapter_code}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{book.title}</p>

      {/* The five-rung ladder — fixed order */}
      <Tabs defaultValue="read" className="mt-8">
        <TabsList className="h-auto w-full flex-wrap justify-start">
          {LADDER_RUNGS.map((rung) => (
            <TabsTrigger key={rung.key} value={rung.key}>
              {rung.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Rung 1 — Read */}
        <TabsContent value="read" className="mt-6">
          {chapter.official_pdf_url ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  The official NCERT chapter PDF.
                </p>
                <Button
                  render={
                    <a
                      href={chapter.official_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  variant="outline"
                  size="sm"
                >
                  Open in new tab ↗
                </Button>
              </div>
              <iframe
                src={chapter.official_pdf_url}
                title={`${chapter.title} — NCERT PDF`}
                className="h-[80vh] w-full rounded-lg border"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">
                The official PDF hasn’t been linked for this chapter yet.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Rungs 2–5 — arrive in later milestones */}
        <TabsContent value="revise" className="mt-6">
          {gist?.content_html ? (
            <GistView html={gist.content_html} />
          ) : (
            <RungComingSoon rung="Revise" />
          )}
        </TabsContent>
        <TabsContent value="prelims" className="mt-6">
          {mcqs.length > 0 ? (
            <PrelimsPractice mcqs={mcqs} />
          ) : (
            <RungComingSoon rung="Prelims" />
          )}
        </TabsContent>
        <TabsContent value="mains" className="mt-6">
          <RungComingSoon rung="Mains" />
        </TabsContent>
        <TabsContent value="pyqs" className="mt-6">
          <RungComingSoon rung="PYQs" />
        </TabsContent>
      </Tabs>
    </main>
  );
}
