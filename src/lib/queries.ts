import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

/**
 * Read-side data access. All queries go through the request-scoped Supabase
 * client, so Row-Level Security applies automatically: anonymous/student
 * callers see only published chapters, admins see drafts too.
 */

export type ClassRow = Tables<"classes">;
export type SubjectRow = Tables<"subjects">;
export type BookRow = Tables<"books">;
export type ChapterRow = Tables<"chapters">;

export type ChapterWithContext = ChapterRow & {
  book: BookRow & { class: ClassRow; subject: SubjectRow };
};

export type BookWithChapters = BookRow & { chapters: ChapterRow[] };

export async function getClasses(): Promise<ClassRow[]> {
  const s = await createClient();
  const { data } = await s.from("classes").select("*").order("number");
  return data ?? [];
}

async function classIdByNumber(classNumber: number): Promise<string | null> {
  const s = await createClient();
  const { data } = await s
    .from("classes")
    .select("id")
    .eq("number", classNumber)
    .maybeSingle();
  return data?.id ?? null;
}

/** Subjects that actually have books for the given class (deduped, ordered). */
export async function getSubjectsForClass(
  classNumber: number,
): Promise<SubjectRow[]> {
  const classId = await classIdByNumber(classNumber);
  if (!classId) return [];

  const s = await createClient();
  const { data } = await s
    .from("books")
    .select("subject:subjects(*)")
    .eq("class_id", classId);

  const map = new Map<string, SubjectRow>();
  for (const row of data ?? []) {
    const subject = row.subject as unknown as SubjectRow | null;
    if (subject) map.set(subject.id, subject);
  }
  return [...map.values()].sort((a, b) => a.order - b.order);
}

export async function getSubjectBySlug(
  slug: string,
): Promise<SubjectRow | null> {
  const s = await createClient();
  const { data } = await s
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

/** Books (with their chapters) for a class + subject. */
export async function getBooksWithChapters(
  classNumber: number,
  subjectSlug: string,
): Promise<BookWithChapters[]> {
  const classId = await classIdByNumber(classNumber);
  const subject = await getSubjectBySlug(subjectSlug);
  if (!classId || !subject) return [];

  const s = await createClient();
  const { data } = await s
    .from("books")
    .select("*, chapters(*)")
    .eq("class_id", classId)
    .eq("subject_id", subject.id)
    .order("order")
    .order("order", { referencedTable: "chapters" });

  return (data ?? []) as unknown as BookWithChapters[];
}

// ---------------------------------------------------------------------------
// Admin reads (the admin session sees drafts too, via RLS).
// ---------------------------------------------------------------------------

export type AdminBook = BookRow & {
  class: ClassRow;
  subject: SubjectRow;
  chapters: { id: string }[];
};

export async function getAdminBooks(): Promise<AdminBook[]> {
  const s = await createClient();
  const { data } = await s
    .from("books")
    .select("*, class:classes(*), subject:subjects(*), chapters(id)");

  const books = (data ?? []) as unknown as AdminBook[];
  return books.sort(
    (a, b) =>
      a.class.number - b.class.number ||
      a.subject.order - b.subject.order ||
      a.order - b.order,
  );
}

export type AdminBookDetail = BookRow & {
  class: ClassRow;
  subject: SubjectRow;
  chapters: ChapterRow[];
};

export async function getAdminBook(
  bookId: string,
): Promise<AdminBookDetail | null> {
  const s = await createClient();
  const { data } = await s
    .from("books")
    .select("*, class:classes(*), subject:subjects(*), chapters(*)")
    .eq("id", bookId)
    .order("order", { referencedTable: "chapters" })
    .maybeSingle();
  return (data as unknown as AdminBookDetail | null) ?? null;
}

export async function getClassesAndSubjects(): Promise<{
  classes: ClassRow[];
  subjects: SubjectRow[];
}> {
  const s = await createClient();
  const [classes, subjects] = await Promise.all([
    s.from("classes").select("*").order("number"),
    s.from("subjects").select("*").eq("enabled", true).order("order"),
  ]);
  return { classes: classes.data ?? [], subjects: subjects.data ?? [] };
}

/**
 * The gist for a chapter, RLS-scoped: students get it only when published,
 * admins get it in any state. Returns null when none exists (or hidden).
 */
export async function getGist(chapterId: string) {
  const s = await createClient();
  const { data } = await s
    .from("gists")
    .select("*")
    .eq("chapter_id", chapterId)
    .maybeSingle();
  return data;
}

/**
 * MCQs for a chapter, RLS-scoped (students: published only; admins: all),
 * ordered for stable display.
 */
export async function getMcqs(chapterId: string) {
  const s = await createClient();
  const { data } = await s
    .from("mcqs")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("order")
    .order("created_at");
  return data ?? [];
}

/** Mains questions for a chapter, RLS-scoped (students: published only). */
export async function getMains(chapterId: string) {
  const s = await createClient();
  const { data } = await s
    .from("mains_questions")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("order")
    .order("created_at");
  return data ?? [];
}

// ---------------------------------------------------------------------------
// GS lens
// ---------------------------------------------------------------------------

export async function getGsTags() {
  const s = await createClient();
  const { data } = await s.from("gs_tags").select("*").order("order");
  return data ?? [];
}

export async function getChapterGsTagIds(chapterId: string): Promise<string[]> {
  const s = await createClient();
  const { data } = await s
    .from("chapter_gs_tags")
    .select("gs_tag_id")
    .eq("chapter_id", chapterId);
  return (data ?? []).map((r) => r.gs_tag_id);
}

export type GsChapter = ChapterRow & {
  book: BookRow & { class: ClassRow; subject: SubjectRow };
};

/** Published chapters mapped to a GS tag (by code), with context. */
export async function getChaptersForGsTag(code: string): Promise<{
  tag: Tables<"gs_tags"> | null;
  chapters: GsChapter[];
}> {
  const s = await createClient();
  const { data: tag } = await s
    .from("gs_tags")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (!tag) return { tag: null, chapters: [] };

  const { data } = await s
    .from("chapters")
    .select(
      "*, book:books(*, class:classes(*), subject:subjects(*)), chapter_gs_tags!inner(gs_tag_id)",
    )
    .eq("chapter_gs_tags.gs_tag_id", tag.id);

  const chapters = (data ?? []) as unknown as GsChapter[];
  chapters.sort(
    (a, b) =>
      a.book.class.number - b.book.class.number ||
      a.book.subject.order - b.book.subject.order ||
      a.order - b.order,
  );
  return { tag, chapters };
}

// ---------------------------------------------------------------------------
// Subject lens — the same published chapters (and their Prelims MCQs), browsed
// by subject across every class instead of class-first. RLS-scoped, so students
// only ever see published chapters here too.
// ---------------------------------------------------------------------------

/**
 * Aspirant-facing order for the subject-wise lens. Anything not listed falls to
 * the end (then by the subject's own `order`).
 */
const SUBJECT_LENS_ORDER: string[] = [
  "history",
  "art-culture",
  "geography",
  "polity",
  "economy",
  "science",
  "ecology-environment",
];

/**
 * Student-facing subject label, used everywhere subjects are shown (class-wise
 * and subject-wise alike). The DB stores "Science"; students read it as
 * "General Science". All other subjects show their plain name — no NCERT
 * alias suffix (e.g. Polity is never "Political Science / Civics").
 */
export function subjectDisplayLabel(subject: Pick<SubjectRow, "slug" | "name">) {
  return subject.slug === "science" ? "General Science" : subject.name;
}

export type SubjectWithCount = SubjectRow & { chapterCount: number };

/** Enabled subjects that have at least one published chapter, in lens order. */
export async function getSubjectsForLens(): Promise<SubjectWithCount[]> {
  const s = await createClient();
  const [{ data: subjects }, { data: chapterRows }] = await Promise.all([
    s.from("subjects").select("*").eq("enabled", true),
    s.from("chapters").select("book:books(subject_id)"),
  ]);

  const counts = new Map<string, number>();
  for (const row of chapterRows ?? []) {
    const book = row.book as unknown as { subject_id: string } | null;
    if (book?.subject_id) {
      counts.set(book.subject_id, (counts.get(book.subject_id) ?? 0) + 1);
    }
  }

  const orderIndex = (slug: string) => {
    const i = SUBJECT_LENS_ORDER.indexOf(slug);
    return i === -1 ? SUBJECT_LENS_ORDER.length : i;
  };

  return (subjects ?? [])
    .map((sub) => ({ ...sub, chapterCount: counts.get(sub.id) ?? 0 }))
    .filter((sub) => sub.chapterCount > 0)
    .sort(
      (a, b) => orderIndex(a.slug) - orderIndex(b.slug) || a.order - b.order,
    );
}

export type SubjectLensChapter = ChapterRow & {
  book: BookRow & { class: ClassRow };
};

/** Published chapters for one subject, across all classes, with class context. */
export async function getChaptersForSubject(slug: string): Promise<{
  subject: SubjectRow | null;
  chapters: SubjectLensChapter[];
}> {
  const s = await createClient();
  const { data: subject } = await s
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!subject) return { subject: null, chapters: [] };

  // Two-step (book ids first, then chapters) to keep the embedded filter simple
  // and RLS-friendly.
  const { data: books } = await s
    .from("books")
    .select("id")
    .eq("subject_id", subject.id);
  const bookIds = (books ?? []).map((b) => b.id);
  if (bookIds.length === 0) return { subject, chapters: [] };

  const { data } = await s
    .from("chapters")
    .select("*, book:books(*, class:classes(*))")
    .in("book_id", bookIds);

  const chapters = (data ?? []) as unknown as SubjectLensChapter[];
  chapters.sort(
    (a, b) =>
      a.book.class.number - b.book.class.number ||
      a.book.order - b.book.order ||
      a.order - b.order,
  );
  return { subject, chapters };
}

// ---------------------------------------------------------------------------
// Global search (RLS-scoped: students match only published content)
// ---------------------------------------------------------------------------

export async function search(q: string) {
  const term = q.trim();
  if (!term) {
    return { chapters: [], gists: [], mcqs: [], pyqs: [] };
  }
  const like = `%${term}%`;
  const s = await createClient();

  const [chapters, gists, mcqs, pyqs] = await Promise.all([
    s
      .from("chapters")
      .select("chapter_code, title, book:books(title, subject:subjects(name))")
      .or(`title.ilike.${like},chapter_code.ilike.${like}`)
      .limit(20),
    s
      .from("gists")
      .select("chapter:chapters(chapter_code, title)")
      .ilike("content_html", like)
      .limit(20),
    s
      .from("mcqs")
      .select("stem, chapter:chapters(chapter_code, title)")
      .ilike("stem", like)
      .limit(20),
    s
      .from("pyqs")
      .select(
        "year, paper, question_text, pyq_chapters(chapter:chapters(chapter_code, title))",
      )
      .ilike("question_text", like)
      .limit(20),
  ]);

  return {
    chapters: (chapters.data ?? []) as unknown as SearchChapter[],
    gists: (gists.data ?? []) as unknown as SearchGist[],
    mcqs: (mcqs.data ?? []) as unknown as SearchMcq[],
    pyqs: (pyqs.data ?? []) as unknown as SearchPyq[],
  };
}

type ChapterRef = { chapter_code: string; title: string } | null;
export type SearchChapter = {
  chapter_code: string;
  title: string;
  book: { title: string; subject: { name: string } | null } | null;
};
export type SearchGist = { chapter: ChapterRef };
export type SearchMcq = { stem: string; chapter: ChapterRef };
export type SearchPyq = {
  year: number;
  paper: string;
  question_text: string;
  pyq_chapters: { chapter: ChapterRef }[];
};

/** Published PYQs tagged to a chapter, newest first (RLS-scoped). */
export async function getPyqsForChapter(chapterId: string) {
  const s = await createClient();
  const { data } = await s
    .from("pyqs")
    .select("*, pyq_chapters!inner(chapter_id)")
    .eq("pyq_chapters.chapter_id", chapterId)
    .order("year", { ascending: false });
  return (data ?? []) as unknown as Tables<"pyqs">[];
}

/** A single chapter by its permanent chapter_code, with class/subject context. */
export async function getChapterByCode(
  code: string,
): Promise<ChapterWithContext | null> {
  const s = await createClient();
  const { data } = await s
    .from("chapters")
    .select("*, book:books(*, class:classes(*), subject:subjects(*))")
    .eq("chapter_code", code)
    .maybeSingle();
  return (data as unknown as ChapterWithContext | null) ?? null;
}
