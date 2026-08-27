import Link from "next/link";
import { CLASSES } from "@/lib/config/taxonomy";
import { getSubjectTheme } from "@/lib/config/subject-themes";
import { SubjectTexture } from "@/components/bhavishya/subject-texture";
import { Crumbs } from "@/components/bhavishya/crumbs";
import type { SubjectRow, BookWithChapters } from "@/lib/queries";

/* ── /browse — pick a class ────────────────────────────────────────────────
   No subject identity here yet, so no texture. The numeral carries it. */
export function BhavishyaBrowse() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Crumbs trail={[{ label: "Class-wise" }]} />
      <h1 className="bh-h2 mt-4">Browse class-wise</h1>
      <p className="bh-lede mt-3 max-w-md">
        Pick a class, then a subject, then a chapter.
      </p>

      <div className="bh-classes mt-9">
        {CLASSES.map((n) => (
          <Link key={n} href={`/browse/${n}`} className="bh-class">
            <span className="bh-class-n">{n}</span>
            <span className="bh-class-l">Class</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

/* ── /browse/[classNo] — pick a subject ───────────────────────────────────
   Each tile previews its subject's texture, so the character is visible
   before you commit to a click. */
export function BhavishyaClass({
  classNo,
  subjects,
}: {
  classNo: number;
  subjects: SubjectRow[];
}) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Crumbs
        trail={[
          { label: "Class-wise", href: "/browse" },
          { label: `Class ${classNo}` },
        ]}
      />
      <h1 className="bh-h2 mt-4">Class {classNo}</h1>

      {subjects.length === 0 ? (
        <div className="bh-empty mt-9">
          <p className="bh-h3">Nothing published for Class {classNo} yet</p>
          <p className="bh-note max-w-sm">
            Chapters are added class by class. Another class may already have
            what you need.
          </p>
          <Link href="/browse" className="bh-btn bh-btn-quiet mt-1">
            Pick another class
          </Link>
        </div>
      ) : (
        <div className="bh-grid mt-9">
          {subjects.map((s) => {
            const theme = getSubjectTheme(s.slug);
            return (
              <Link
                key={s.id}
                href={`/browse/${classNo}/${s.slug}`}
                className="bh-subject-tile"
              >
                <div className="bh-subject-tile-tex">
                  <SubjectTexture slug={s.slug} />
                </div>
                <div className="bh-subject-tile-body">
                  <span className="bh-motif">{theme.motif}</span>
                  <h2 className="bh-tile-name">{s.name}</h2>
                  {s.ncert_name && (
                    <p className="bh-tile-blurb">{s.ncert_name}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

/* ── /browse/[classNo]/[subject] — the subject landing page ───────────────
   This is where a subject's character is strongest: the texture runs behind
   the header band, and the red rule under it anchors the whole page. */
export function BhavishyaSubject({
  classNo,
  subject,
  books,
}: {
  classNo: number;
  subject: SubjectRow;
  books: BookWithChapters[];
}) {
  const theme = getSubjectTheme(subject.slug);
  const withChapters = books.filter((b) => b.chapters.length > 0);
  const total = withChapters.reduce((n, b) => n + b.chapters.length, 0);

  return (
    <main className="flex-1" data-subject={subject.slug}>
      <div className="mx-auto w-full max-w-4xl px-6 pt-10">
        <Crumbs
          trail={[
            { label: "Class-wise", href: "/browse" },
            { label: `Class ${classNo}`, href: `/browse/${classNo}` },
            { label: subject.name },
          ]}
        />
      </div>

      <div className="mx-auto mt-5 w-full max-w-4xl px-6">
        <div className="bh-subject-band px-7 py-8">
          <SubjectTexture slug={subject.slug} />
          <span className="bh-motif">{theme.motif}</span>
          <h1 className="bh-h2 mt-2">
            Class {classNo} · {subject.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        {total === 0 ? (
          <div className="bh-empty">
            <p className="bh-h3">No chapters published here yet</p>
            <p className="bh-note max-w-sm">
              {subject.name} is live for other classes. Try one of those, or
              search for a topic directly.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Link href={`/browse/${classNo}`} className="bh-btn bh-btn-quiet">
                Other subjects in Class {classNo}
              </Link>
              <Link href="/search" className="bh-btn bh-btn-quiet">
                Search
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {withChapters.map((book) => (
              <section key={book.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="bh-booktitle">{book.title}</h2>
                  <span className="bh-tag">
                    {book.chapters.length} chapter
                    {book.chapters.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="bh-chapters mt-3">
                  {book.chapters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/chapter/${ch.chapter_code}`}
                      className="bh-chapter"
                    >
                      <span className="bh-chapter-n">{ch.chapter_number}</span>
                      <span className="bh-chapter-t">{ch.title}</span>
                      <span className="bh-chapter-c">{ch.chapter_code}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
