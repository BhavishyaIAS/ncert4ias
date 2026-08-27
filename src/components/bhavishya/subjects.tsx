import Link from "next/link";
import { Crumbs } from "@/components/bhavishya/crumbs";
import { getSubjectTheme } from "@/lib/config/subject-themes";
import { SubjectTexture } from "@/components/bhavishya/subject-texture";
import { subjectLensLabel } from "@/lib/queries";
import type { SubjectRow, SubjectWithCount, SubjectLensChapter } from "@/lib/queries";

/**
 * The subject-wise lens — the same published chapters (and their Prelims MCQs)
 * that the class-wise browse reaches, re-shelved by subject so an aspirant can
 * drill one subject straight down across every class.
 */
export function BhavishyaSubjectsIndex({
  subjects,
}: {
  subjects: SubjectWithCount[];
}) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Crumbs trail={[{ label: "Subject-wise" }]} />
      <h1 className="bh-h2 mt-4">Browse by subject</h1>
      <p className="bh-lede mt-3 max-w-lg">
        Pick a subject and work its chapters — and their Prelims MCQs — straight
        down, across every class at once.
      </p>

      {subjects.length === 0 ? (
        <div className="bh-empty mt-9">
          <p className="bh-h3">No subjects published yet</p>
          <Link href="/browse" className="bh-btn bh-btn-quiet mt-1">
            Browse by class
          </Link>
        </div>
      ) : (
        <div className="bh-grid mt-9">
          {subjects.map((s) => {
            const theme = getSubjectTheme(s.slug);
            return (
              <Link
                key={s.id}
                href={`/subjects/${s.slug}`}
                className="bh-subject-tile"
              >
                <div className="bh-subject-tile-tex">
                  <SubjectTexture slug={s.slug} />
                </div>
                <div className="bh-subject-tile-body">
                  <span className="bh-motif">{theme.motif}</span>
                  <h2 className="bh-tile-name">{subjectLensLabel(s)}</h2>
                  <p className="bh-tile-blurb">
                    {s.chapterCount} chapter{s.chapterCount === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

export function BhavishyaSubjectChapters({
  subject,
  chapters,
}: {
  subject: SubjectRow;
  chapters: SubjectLensChapter[];
}) {
  const theme = getSubjectTheme(subject.slug);
  const label = subjectLensLabel(subject);

  return (
    <main className="flex-1" data-subject={subject.slug}>
      <div className="mx-auto w-full max-w-4xl px-6 pt-10">
        <Crumbs
          trail={[
            { label: "Subject-wise", href: "/subjects" },
            { label },
          ]}
        />
      </div>

      <div className="mx-auto mt-5 w-full max-w-4xl px-6">
        <div className="bh-subject-band px-7 py-8">
          <SubjectTexture slug={subject.slug} />
          <span className="bh-motif">{theme.motif}</span>
          <h1 className="bh-h2 mt-2">{label}</h1>
          <p className="bh-tile-blurb mt-1">
            {chapters.length} chapter{chapters.length === 1 ? "" : "s"} · all
            classes
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        {chapters.length === 0 ? (
          <div className="bh-empty">
            <p className="bh-h3">No chapters published for {label} yet</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Link href="/subjects" className="bh-btn bh-btn-quiet">
                Other subjects
              </Link>
              <Link href="/browse" className="bh-btn bh-btn-quiet">
                Browse by class
              </Link>
            </div>
          </div>
        ) : (
          <div className="bh-chapters">
            {chapters.map((ch) => (
              <Link
                key={ch.id}
                href={`/chapter/${ch.chapter_code}`}
                className="bh-chapter"
              >
                <span className="bh-chapter-t">{ch.title}</span>
                <span className="bh-tag">Class {ch.book.class.number}</span>
                <span className="bh-chapter-c">{ch.chapter_code}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
