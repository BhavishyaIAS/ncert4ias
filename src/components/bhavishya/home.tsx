import Link from "next/link";
import { LADDER_RUNGS } from "@/lib/config/taxonomy";
import { ENABLED_SUBJECTS } from "@/lib/config/subjects";

/**
 * Homepage, bhavishya theme. Deliberately quiet: the one loud moment in this
 * product is the trajectory spine on the chapter page, and spending that
 * boldness twice would spend it badly. Here the type carries it.
 */
export function BhavishyaHome() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-20 pb-16 sm:pt-28">
        <p className="bh-eyebrow">Classes 6–12 · UPSC Civil Services</p>
        <hr className="bh-rule mt-5 w-16" />
        <h1 className="bh-hero mt-7 max-w-3xl">
          The NCERTs, turned into a prep engine.
        </h1>
        <p className="bh-lede mt-6 max-w-xl">
          Every chapter becomes one unit that walks you up a five-rung ladder —
          from reading the source, to the actual UPSC questions that came out of
          it.
        </p>
        <div className="mt-9">
          <Link href="/browse" className="bh-btn bh-btn-primary">
            Browse chapters
          </Link>
        </div>
      </section>

      {/* The five rungs. 01–05 is real information: the order is the product. */}
      <section className="mx-auto w-full max-w-5xl px-6 py-14">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="bh-h2">The five-rung ladder</h2>
          <span className="bh-mono bh-muted hidden sm:block">
            in fixed order
          </span>
        </div>
        <ol className="bh-rungs">
          {LADDER_RUNGS.map((rung, i) => (
            <li key={rung.key} className="bh-rung">
              <span className="bh-rung-n">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="bh-rung-label">{rung.label}</h3>
              <p className="bh-rung-tag">{rung.tagline}</p>
              <p className="bh-rung-who">{rung.forWho}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Subjects */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-6 pb-24">
        <h2 className="bh-h2 mb-6">Subjects in this release</h2>
        <div className="bh-grid">
          {ENABLED_SUBJECTS.map((subject) => (
            <div key={subject.slug} className="bh-tile">
              <h3 className="bh-tile-name">{subject.name}</h3>
              <p className="bh-tile-blurb">{subject.blurb}</p>
            </div>
          ))}
        </div>
        <p className="bh-note mt-5 max-w-xl">
          Adding a subject is a configuration change, not a rewrite — the
          platform is built that way and stays that way.
        </p>
      </section>
    </main>
  );
}
