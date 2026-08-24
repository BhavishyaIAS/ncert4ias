/**
 * Subject visual identity — the token sets that give each subject its own
 * character *without* giving it its own colour.
 *
 * The whole palette stays red / black / white across all seven subjects. What
 * changes is pattern, line quality and the motif label. That constraint is what
 * keeps this one product instead of seven, and it is deliberate: the moment
 * Geography goes blue and Ecology goes green, the coherence is gone.
 *
 * ── Adding an eighth subject ────────────────────────────────────────────────
 * 1. Add the entry to SUBJECTS in ./subjects.ts with `enabled: true`.
 * 2. Add one entry below, picking any existing `pattern`.
 * That's it. A subject that wants a pattern of its own also adds one case to
 * PATTERNS in components/bhavishya/subject-texture.tsx — but reusing an
 * existing pattern needs no new code at all.
 *
 * Anything missing from this map falls back to DEFAULT_SUBJECT_THEME, so an
 * un-themed subject renders correctly rather than breaking.
 */

/** The pattern vocabularies available. Each is drawn in ink + a single red mark. */
export type PatternKey =
  | "inscription"
  | "blueprint"
  | "contour"
  | "ledger"
  | "orbital"
  | "jaali"
  | "venation"
  | "plain";

export interface SubjectTheme {
  /** Drawn behind the subject header, and on subject tiles. */
  pattern: PatternKey;
  /** Shown in mono caps beside the subject name. Names the visual vocabulary. */
  motif: string;
  /**
   * Why this subject is drawn the way it is. Documentation for whoever adds
   * the next subject — deliberately NOT rendered: a student wants chapters,
   * not the design system explaining itself.
   */
  rationale: string;
}

export const DEFAULT_SUBJECT_THEME: SubjectTheme = {
  pattern: "plain",
  motif: "Plain",
  rationale: "No pattern assigned yet.",
};

export const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  history: {
    pattern: "inscription",
    motif: "Inscription",
    rationale: "Chiselled rules, like a rock edict. A chronological spine runs the margin.",
  },
  polity: {
    pattern: "blueprint",
    motif: "Blueprint",
    rationale: "The Constitution drawn as a structure — construction lines and dimension marks.",
  },
  geography: {
    pattern: "contour",
    motif: "Contour",
    rationale: "Topographic strata. The page reads as a landscape cross-section.",
  },
  economy: {
    pattern: "ledger",
    motif: "Ledger",
    rationale: "Ruled columns and graph paper. Tabular figures, one hairline plot.",
  },
  science: {
    pattern: "orbital",
    motif: "Orbital",
    rationale: "Concentric shells and instrument-panel precision.",
  },
  "art-culture": {
    pattern: "jaali",
    motif: "Jaali",
    rationale: "A pierced lattice that frames the page and never crowds the text.",
  },
  "ecology-environment": {
    pattern: "venation",
    motif: "Venation",
    rationale: "Leaf and watershed branching — the one place organic curves are allowed.",
  },
};

export function getSubjectTheme(slug: string): SubjectTheme {
  return SUBJECT_THEMES[slug] ?? DEFAULT_SUBJECT_THEME;
}
