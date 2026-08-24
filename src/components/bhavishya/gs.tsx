import Link from "next/link";
import { Crumbs } from "@/components/bhavishya/crumbs";
import type { Tables } from "@/types/database";
import type { GsChapter } from "@/lib/queries";

/**
 * The GS lens — the second way aspirants navigate. Subject textures do not
 * belong here: a GS paper spans several subjects, so borrowing any one
 * subject's pattern would be a lie about what you're looking at.
 */
export function BhavishyaGsIndex({ tags }: { tags: Tables<"gs_tags">[] }) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Crumbs trail={[{ label: "GS papers" }]} />
      <h1 className="bh-h2 mt-4">Browse by GS paper</h1>
      <p className="bh-lede mt-3 max-w-lg">
        The way aspirants actually think — jump straight to the chapters behind
        a General Studies paper.
      </p>

      {tags.length === 0 ? (
        <div className="bh-empty mt-9">
          <p className="bh-h3">No GS papers mapped yet</p>
          <Link href="/browse" className="bh-btn bh-btn-quiet mt-1">
            Browse by class
          </Link>
        </div>
      ) : (
        <div className="bh-grid mt-9">
          {tags.map((t) => (
            <Link key={t.id} href={`/gs/${t.code}`} className="bh-tile">
              <h2 className="bh-tile-name">{t.label}</h2>
              {t.note && <p className="bh-tile-blurb">{t.note}</p>}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

export function BhavishyaGsTag({
  tag,
  chapters,
}: {
  tag: Tables<"gs_tags">;
  chapters: GsChapter[];
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Crumbs
        trail={[{ label: "GS papers", href: "/gs" }, { label: tag.label }]}
      />
      <h1 className="bh-h2 mt-4">{tag.label}</h1>
      {tag.note && <p className="bh-lede mt-3 max-w-lg">{tag.note}</p>}

      {chapters.length === 0 ? (
        <div className="bh-empty mt-9">
          <p className="bh-h3">No chapters mapped to {tag.label} yet</p>
          <p className="bh-note max-w-sm">
            Chapters get their GS tags as they are published.
          </p>
          <Link href="/gs" className="bh-btn bh-btn-quiet mt-1">
            Other GS papers
          </Link>
        </div>
      ) : (
        <div className="bh-chapters mt-8">
          {chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/chapter/${ch.chapter_code}`}
              className="bh-chapter"
            >
              <span className="bh-chapter-t">{ch.title}</span>
              <span className="bh-tag">
                Class {ch.book.class.number} · {ch.book.subject.name}
              </span>
              <span className="bh-chapter-c">{ch.chapter_code}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
