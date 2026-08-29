/**
 * Static taxonomy constants that rarely change: classes, the four-rung ladder,
 * GS lens tags, exam papers, and MCQ difficulty. Kept here so both the student
 * UI and admin tooling share one definition.
 */

/** NCERT classes covered by the platform. */
export const CLASSES = [6, 7, 8, 9, 10, 11, 12] as const;
export type ClassNumber = (typeof CLASSES)[number];

/**
 * The four-rung ladder, in the FIXED order the chapter page must render them.
 * `key` is used for tab slugs; order here is authoritative.
 */
export const LADDER_RUNGS = [
  {
    key: "read",
    label: "Read",
    tagline: "The full NCERT chapter (official PDF)",
    forWho: "First-time readers",
  },
  {
    key: "revise",
    label: "Revise",
    tagline: "A clutter-free gist you can revise under exam pressure",
    forWho: "Those who've already read it",
  },
  {
    key: "prelims",
    label: "Prelims",
    tagline: "UPSC-style MCQs with answer key + solutions",
    forWho: "Objective practice",
  },
  {
    key: "mains",
    label: "Mains",
    tagline: "Mains questions with NCERT-grounded model answers",
    forWho: "Answer-writing practice",
  },
] as const;

export type LadderRungKey = (typeof LADDER_RUNGS)[number]["key"];

/**
 * GS (General Studies) lens — the second way aspirants browse. Chapters map to
 * one or more of these via `chapter_gs_tags`.
 */
export const GS_TAGS = [
  { code: "GS-I", label: "GS-I", note: "History, Geography, Society, Art & Culture" },
  { code: "GS-II", label: "GS-II", note: "Polity, Governance, IR, Social Justice" },
  { code: "GS-III", label: "GS-III", note: "Economy, Environment, Sci-Tech, Security" },
  { code: "GS-IV", label: "GS-IV", note: "Ethics, Integrity & Aptitude" },
] as const;

/** GS papers a Mains question can be authored against. */
export const MAINS_GS_PAPERS = ["GS-I", "GS-II", "GS-III", "GS-IV", "Essay"] as const;
export type MainsGsPaper = (typeof MAINS_GS_PAPERS)[number];

/** MCQ difficulty levels. */
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Draft/publish lifecycle shared by all authored content. */
export const CONTENT_STATUS = ["draft", "published"] as const;
export type ContentStatus = (typeof CONTENT_STATUS)[number];

/** User roles. RLS grants students read-only access to published content. */
export const ROLES = ["student", "admin"] as const;
export type Role = (typeof ROLES)[number];
