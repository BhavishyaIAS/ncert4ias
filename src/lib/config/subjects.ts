/**
 * Subject registry — the single source of truth for which NCERT subjects the
 * platform knows about, and which are *live* in the current release.
 *
 * ── How to add a subject later (by design, this is a config change) ─────────
 * 1. Add/flip an entry below with `enabled: true`.
 * 2. Run the taxonomy seed so a matching `subjects` row exists in Postgres.
 * That's it — routing, browse menus, and the admin taxonomy manager all read
 * from this list, so no schema change or rewrite is needed to onboard Science,
 * Math, etc.
 *
 * MVP (this release) ships four subjects only: History, Polity, Geography,
 * Economy — across Classes 6–12. Everything else is registered but disabled.
 */

export type SubjectSlug =
  | "history"
  | "polity"
  | "geography"
  | "economy"
  | "science"
  | "sociology"
  | "art-culture";

export interface SubjectConfig {
  /** Stable, URL-safe identifier. Also the seed key for the DB row. */
  slug: SubjectSlug;
  /** Display name shown to students/admin. */
  name: string;
  /** NCERT's own subject label, if it differs (e.g. "Political Science"). */
  ncertName?: string;
  /** Prefix used when minting chapter_codes, e.g. "H" -> H-8-3. */
  codePrefix: string;
  /** Live in the current release? MVP enables exactly the four core subjects. */
  enabled: boolean;
  /** Short blurb for browse tiles. */
  blurb: string;
}

export const SUBJECTS: SubjectConfig[] = [
  {
    slug: "history",
    name: "History",
    codePrefix: "H",
    enabled: true,
    blurb: "Ancient, Medieval & Modern India — the backbone of GS-I.",
  },
  {
    slug: "polity",
    name: "Polity",
    ncertName: "Political Science / Civics",
    codePrefix: "P",
    enabled: true,
    blurb: "Constitution, governance & institutions — core GS-II.",
  },
  {
    slug: "geography",
    name: "Geography",
    codePrefix: "G",
    enabled: true,
    blurb: "Physical, Indian & world geography — spans GS-I and GS-III.",
  },
  {
    slug: "economy",
    name: "Economy",
    ncertName: "Economics",
    codePrefix: "E",
    enabled: true,
    blurb: "Indian economy fundamentals — the base for GS-III.",
  },

  // ── Registered but NOT built yet (disabled). Flip `enabled` to onboard. ──
  {
    slug: "science",
    name: "Science",
    codePrefix: "S",
    enabled: false,
    blurb: "Science & Technology — coming later.",
  },
  {
    slug: "sociology",
    name: "Sociology",
    codePrefix: "SO",
    enabled: false,
    blurb: "Social structures — coming later.",
  },
  {
    slug: "art-culture",
    name: "Art & Culture",
    codePrefix: "AC",
    enabled: false,
    blurb: "Indian heritage & culture — coming later.",
  },
];

/** Subjects live in the current release (MVP: the four core subjects). */
export const ENABLED_SUBJECTS = SUBJECTS.filter((s) => s.enabled);

export function getSubject(slug: string): SubjectConfig | undefined {
  return SUBJECTS.find((s) => s.slug === slug);
}

export function isSubjectEnabled(slug: string): boolean {
  return getSubject(slug)?.enabled ?? false;
}
