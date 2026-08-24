"use client";

import { useState } from "react";
import Link from "next/link";
import { LADDER_RUNGS, type LadderRungKey } from "@/lib/config/taxonomy";
import { getSubjectTheme } from "@/lib/config/subject-themes";
import { GistView } from "@/components/gist-view";
import { SubjectTexture } from "@/components/bhavishya/subject-texture";
import { Crumbs } from "@/components/bhavishya/crumbs";
import { TrajectorySpine } from "./spine";
import { Prelims } from "./prelims";
import { MainsRung } from "./mains";
import { useChapterProgress } from "./use-progress";
import type { Tables } from "@/types/database";

type Mcq = Tables<"mcqs">;
type Mains = Tables<"mains_questions">;
type Pyq = Tables<"pyqs">;

export function BhavishyaChapter({
  chapterCode,
  chapterNumber,
  title,
  bookTitle,
  classNo,
  subjectSlug,
  subjectName,
  pdfUrl,
  gistHtml,
  mcqs,
  mains,
  pyqs,
}: {
  chapterCode: string;
  chapterNumber: number;
  title: string;
  bookTitle: string;
  classNo: number;
  subjectSlug: string;
  subjectName: string;
  pdfUrl: string | null;
  gistHtml: string | null;
  mcqs: Mcq[];
  mains: Mains[];
  pyqs: Pyq[];
}) {
  const [active, setActive] = useState<LadderRungKey>("read");
  const { done, toggle } = useChapterProgress(chapterCode);
  const theme = getSubjectTheme(subjectSlug);

  const available: Record<LadderRungKey, boolean> = {
    read: Boolean(pdfUrl),
    revise: Boolean(gistHtml),
    prelims: mcqs.length > 0,
    mains: mains.length > 0,
    pyqs: pyqs.length > 0,
  };

  const count = LADDER_RUNGS.filter((r) => done.has(r.key)).length;
  const activeRung = LADDER_RUNGS.find((r) => r.key === active)!;

  return (
    <main className="flex-1" data-subject={subjectSlug}>
      {/* ── Chapter header ─────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-6xl px-6 pt-9">
        <Crumbs
          trail={[
            { label: "Browse", href: "/browse" },
            { label: `Class ${classNo}`, href: `/browse/${classNo}` },
            { label: subjectName, href: `/browse/${classNo}/${subjectSlug}` },
          ]}
        />
      </div>

      <div className="mx-auto mt-5 w-full max-w-6xl px-6">
        <div className="bh-subject-band px-7 py-8">
          <SubjectTexture slug={subjectSlug} />
          <span className="bh-motif">{theme.motif}</span>
          {/* The kicker sits outside the h1 on purpose: inside it, the
              accessible name ran the chapter code straight into the number
              ("H-8-3" + "3.") and read as gibberish. */}
          <p className="bh-chapter-kicker mt-2">
            Class {classNo} · {subjectName} · {chapterCode}
          </p>
          <h1 className="bh-chapter-title">
            {chapterNumber}. {title}
          </h1>
          <p className="bh-note mt-3">{bookTitle}</p>
          {pyqs.length > 0 && (
            <p className="mt-4">
              <span className="bh-tag bh-tag-live">
                {pyqs.length} UPSC question{pyqs.length === 1 ? "" : "s"} came
                from this chapter
              </span>
            </p>
          )}
        </div>
      </div>

      {/* ── The ladder ─────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="bh-ladder">
          <div className="bh-ladder-rail">
            <TrajectorySpine
              done={done}
              active={active}
              available={available}
              onSelect={setActive}
            />
            <p className="bh-progress-note" aria-live="polite">
              {count === 0
                ? "Nothing marked yet"
                : count === LADDER_RUNGS.length
                  ? "Chapter complete"
                  : `${count} of ${LADDER_RUNGS.length} rungs done`}
            </p>
          </div>

          <div className="bh-ladder-panel">
            <div className="bh-panel-head">
              <div>
                <span className="bh-eyebrow">
                  Rung {String(LADDER_RUNGS.findIndex((r) => r.key === active) + 1).padStart(2, "0")}
                </span>
                <h2 className="bh-h3 mt-1">{activeRung.label}</h2>
              </div>
              {available[active] && (
                <button
                  type="button"
                  onClick={() => toggle(active)}
                  aria-pressed={done.has(active)}
                  className={`bh-mark ${done.has(active) ? "is-done" : ""}`}
                >
                  {done.has(active) ? "Marked done" : "Mark done"}
                </button>
              )}
            </div>

            <div className="mt-6">
              {active === "read" && <Read pdfUrl={pdfUrl} title={title} />}
              {active === "revise" &&
                (gistHtml ? (
                  <div className="bh-prose">
                    <GistView html={gistHtml} />
                  </div>
                ) : (
                  <NotReady rung="Revise" chapterCode={chapterCode} />
                ))}
              {active === "prelims" &&
                (mcqs.length > 0 ? (
                  <Prelims mcqs={mcqs} />
                ) : (
                  <NotReady rung="Prelims" chapterCode={chapterCode} />
                ))}
              {active === "mains" &&
                (mains.length > 0 ? (
                  <MainsRung items={mains} />
                ) : (
                  <NotReady rung="Mains" chapterCode={chapterCode} />
                ))}
              {active === "pyqs" &&
                (pyqs.length > 0 ? (
                  <Pyqs pyqs={pyqs} />
                ) : (
                  <NotReady rung="PYQs" chapterCode={chapterCode} />
                ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Read({ pdfUrl, title }: { pdfUrl: string | null; title: string }) {
  if (!pdfUrl) return <NotReady rung="Read" chapterCode="" />;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bh-btn bh-btn-quiet"
        >
          Open the PDF
        </a>
      </div>
      <iframe
        src={pdfUrl}
        title={`${title} — NCERT chapter PDF`}
        className="bh-pdf"
      />
    </div>
  );
}

function Pyqs({ pyqs }: { pyqs: Pyq[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="bh-note">
        Real UPSC questions traced back to this chapter — the reason the NCERTs
        are worth the time.
      </p>
      <ul className="flex flex-col gap-3">
        {pyqs.map((q) => (
          <li key={q.id} className="bh-pyq">
            <div className="flex flex-wrap gap-1.5">
              <span className="bh-tag">{q.year}</span>
              <span className="bh-tag">{q.paper}</span>
            </div>
            <p className="mt-2.5">{q.question_text}</p>
            {q.notes && <p className="bh-note mt-2">{q.notes}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotReady({ rung }: { rung: string; chapterCode: string }) {
  return (
    <div className="bh-empty">
      <p className="bh-h3">{rung} isn’t ready for this chapter</p>
      <p className="bh-note max-w-sm">
        The other rungs may already be. Content is added rung by rung, and this
        one is still being written.
      </p>
      <Link href="/browse" className="bh-btn bh-btn-quiet mt-1">
        Find another chapter
      </Link>
    </div>
  );
}
