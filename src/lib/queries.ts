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
