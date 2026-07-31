import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getChapterByCode, getGist, getMcqs, getMains } from "@/lib/queries";
import { GistEditor } from "@/components/editor/gist-editor";
import { McqManager } from "./_components/McqManager";
import { MainsManager } from "./_components/MainsManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Chapter workspace" };

export default async function ChapterWorkspace({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const chapter = await getChapterByCode(code);
  if (!chapter) notFound();

  const [gist, mcqs, mains] = await Promise.all([
    getGist(chapter.id),
    getMcqs(chapter.id),
    getMains(chapter.id),
  ]);
  const { book } = chapter;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/taxonomy/books/${book.id}`}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← {book.title}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {chapter.chapter_number}. {chapter.title}
          </h1>
          <Badge variant="secondary" className="font-mono">
            {chapter.chapter_code}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {book.class.label} · {book.subject.name}
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Revise · Gist
          </h2>
          <Button
            render={<Link href={`/chapter/${chapter.chapter_code}`} />}
            variant="ghost"
            size="sm"
          >
            View student page ↗
          </Button>
        </div>
        <GistEditor
          chapterId={chapter.id}
          chapterCode={chapter.chapter_code}
          gist={gist}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Prelims · MCQs
        </h2>
        <McqManager
          chapterId={chapter.id}
          chapterCode={chapter.chapter_code}
          mcqs={mcqs}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Mains · Questions & model answers
        </h2>
        <MainsManager
          chapterId={chapter.id}
          chapterCode={chapter.chapter_code}
          items={mains}
        />
      </section>

      <p className="text-xs text-muted-foreground">
        PYQ bulk upload arrives in the next milestone.
      </p>
    </div>
  );
}
