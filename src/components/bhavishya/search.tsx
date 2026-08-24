import Link from "next/link";
import { Crumbs } from "@/components/bhavishya/crumbs";
import type {
  SearchChapter,
  SearchGist,
  SearchMcq,
  SearchPyq,
} from "@/lib/queries";

type Results = {
  chapters: SearchChapter[];
  gists: SearchGist[];
  mcqs: SearchMcq[];
  pyqs: SearchPyq[];
};

/**
 * Search. Deliberately the quietest surface in the redesign: someone here is
 * hunting for one thing, and decoration would be in the way.
 */
export function BhavishyaSearch({
  q,
  results,
}: {
  q: string;
  results: Results | null;
}) {
  const total = results
    ? results.chapters.length +
      results.gists.length +
      results.mcqs.length +
      results.pyqs.length
    : 0;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Crumbs trail={[{ label: "Search" }]} />
      <h1 className="bh-h2 mt-4">Search</h1>

      <form action="/search" className="bh-searchbar mt-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search chapters, gists, MCQs, PYQs…"
          aria-label="Search"
          autoFocus
        />
        <button type="submit" className="bh-btn bh-btn-primary">
          Search
        </button>
      </form>

      {results && total > 0 && (
        <p className="bh-note mt-5">
          {total} result{total === 1 ? "" : "s"} for “{q}”
        </p>
      )}

      {results && total === 0 && (
        <div className="bh-empty mt-8">
          <p className="bh-h3">Nothing matched “{q}”</p>
          <p className="bh-note max-w-sm">
            Only published content is searchable. Try a chapter code like{" "}
            <span className="bh-mono">H-8-3</span>, or a single keyword rather
            than a phrase.
          </p>
          <Link href="/browse" className="bh-btn bh-btn-quiet mt-1">
            Browse by class instead
          </Link>
        </div>
      )}

      {!results && (
        <p className="bh-note mt-5 max-w-md">
          Search across every published chapter, revision gist, MCQ and
          previous-year question.
        </p>
      )}

      {results && results.chapters.length > 0 && (
        <Group title="Chapters">
          {results.chapters.map((c) => (
            <Link
              key={c.chapter_code}
              href={`/chapter/${c.chapter_code}`}
              className="bh-result"
            >
              <span className="bh-result-t">{c.title}</span>
              <span className="bh-chapter-c">{c.chapter_code}</span>
            </Link>
          ))}
        </Group>
      )}

      {results && results.gists.length > 0 && (
        <Group title="Revision gists">
          {results.gists
            .filter((g) => g.chapter)
            .map((g, i) => (
              <Link
                key={i}
                href={`/chapter/${g.chapter!.chapter_code}`}
                className="bh-result"
              >
                <span className="bh-result-t">{g.chapter!.title}</span>
                <span className="bh-chapter-c">
                  {g.chapter!.chapter_code}
                </span>
              </Link>
            ))}
        </Group>
      )}

      {results && results.mcqs.length > 0 && (
        <Group title="Prelims MCQs">
          {results.mcqs
            .filter((m) => m.chapter)
            .map((m, i) => (
              <Link
                key={i}
                href={`/chapter/${m.chapter!.chapter_code}`}
                className="bh-result"
              >
                <span className="bh-result-t">{m.stem}</span>
                <span className="bh-chapter-c">
                  {m.chapter!.chapter_code}
                </span>
              </Link>
            ))}
        </Group>
      )}

      {results && results.pyqs.length > 0 && (
        <Group title="Previous-year questions">
          {results.pyqs.map((p, i) => {
            const first = p.pyq_chapters.find((pc) => pc.chapter)?.chapter;
            const inner = (
              <>
                <span className="bh-result-t">{p.question_text}</span>
                <span className="flex flex-none gap-1.5">
                  <span className="bh-tag">{p.year}</span>
                  <span className="bh-tag">{p.paper}</span>
                </span>
              </>
            );
            return first ? (
              <Link
                key={i}
                href={`/chapter/${first.chapter_code}`}
                className="bh-result"
              >
                {inner}
              </Link>
            ) : (
              <div key={i} className="bh-result">
                {inner}
              </div>
            );
          })}
        </Group>
      )}
    </main>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <h2 className="bh-eyebrow">{title}</h2>
      <div className="mt-3 border-t border-[color:var(--bh-hair)]">
        {children}
      </div>
    </section>
  );
}
