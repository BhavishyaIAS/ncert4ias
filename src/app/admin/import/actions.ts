"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ncertPdfUrl } from "@/lib/ncert";
import { ENABLED_SUBJECTS } from "@/lib/config/subjects";
import type { ContentStatus } from "@/types/database";

export type RawChapterRow = {
  class_number?: string | number;
  subject_slug?: string;
  book_title?: string;
  book_order?: string | number;
  ncert_code?: string;
  chapter_number?: string | number;
  chapter_title?: string;
  official_pdf_url?: string;
  chapter_code?: string;
  status?: string;
};

export type ImportLogEntry = {
  row: number;
  status: "created" | "updated" | "error";
  message: string;
};

export type ImportResult = {
  log: ImportLogEntry[];
  summary: { books: number; chapters: number; failed: number };
};

const ENABLED = new Set<string>(ENABLED_SUBJECTS.map((s) => s.slug));

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}
function int(v: unknown): number {
  const n = parseInt(str(v), 10);
  return Number.isFinite(n) ? n : NaN;
}

export async function importChapters(
  rows: RawChapterRow[],
): Promise<ImportResult> {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: classes }, { data: subjects }] = await Promise.all([
    supabase.from("classes").select("id, number"),
    supabase.from("subjects").select("id, slug, code_prefix"),
  ]);
  const classByNum = new Map((classes ?? []).map((c) => [c.number, c.id]));
  const subjectBySlug = new Map((subjects ?? []).map((s) => [s.slug, s]));

  // Pre-pass: within a (class, subject) group, if the sheet has more than one
  // distinct book, disambiguate chapter_codes with a letter (A, B, C…) ordered
  // by book_order then first appearance — matching the seed convention.
  const groups = new Map<string, { titles: string[]; order: Map<string, number> }>();
  for (const raw of rows) {
    const cls = int(raw.class_number);
    const slug = str(raw.subject_slug).toLowerCase();
    const title = str(raw.book_title);
    if (!Number.isFinite(cls) || !slug || !title) continue;
    const k = `${cls}:${slug}`;
    if (!groups.has(k)) groups.set(k, { titles: [], order: new Map() });
    const g = groups.get(k)!;
    if (!g.titles.includes(title)) {
      g.titles.push(title);
      g.order.set(title, int(raw.book_order) || g.titles.length - 1);
    }
  }
  const bookLetter = new Map<string, string>(); // `${cls}:${slug}:${title}` -> letter
  for (const [k, g] of groups) {
    if (g.titles.length <= 1) continue;
    const ordered = [...g.titles].sort(
      (a, b) => (g.order.get(a) ?? 0) - (g.order.get(b) ?? 0),
    );
    ordered.forEach((title, i) =>
      bookLetter.set(`${k}:${title}`, String.fromCharCode(65 + i)),
    );
  }

  const log: ImportLogEntry[] = [];
  const bookCache = new Map<string, string>(); // `${classId}:${subjectId}:${title}` -> bookId
  const bookTitles = new Set<string>();
  let chaptersCount = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const raw = rows[i];
    const cls = int(raw.class_number);
    const slug = str(raw.subject_slug).toLowerCase();
    const bookTitle = str(raw.book_title);
    const chapterNumber = int(raw.chapter_number);
    const chapterTitle = str(raw.chapter_title);
    const ncertCode = str(raw.ncert_code);
    const explicitUrl = str(raw.official_pdf_url);
    const explicitCode = str(raw.chapter_code).toUpperCase();
    const status: ContentStatus =
      str(raw.status).toLowerCase() === "draft" ? "draft" : "published";

    const classId = classByNum.get(cls);
    const subject = subjectBySlug.get(slug);

    if (!classId) {
      failed++;
      log.push({ row: rowNum, status: "error", message: `Unknown class ${raw.class_number}.` });
      continue;
    }
    if (!subject || !ENABLED.has(slug)) {
      failed++;
      log.push({ row: rowNum, status: "error", message: `Unknown/disabled subject "${raw.subject_slug}".` });
      continue;
    }
    if (!bookTitle) {
      failed++;
      log.push({ row: rowNum, status: "error", message: "Missing book_title." });
      continue;
    }
    if (!Number.isFinite(chapterNumber) || chapterNumber < 1) {
      failed++;
      log.push({ row: rowNum, status: "error", message: "Invalid chapter_number." });
      continue;
    }
    if (!chapterTitle) {
      failed++;
      log.push({ row: rowNum, status: "error", message: "Missing chapter_title." });
      continue;
    }

    const officialUrl =
      explicitUrl || (ncertCode ? ncertPdfUrl(ncertCode, chapterNumber) : null);

    // Find or create the book.
    const cacheKey = `${classId}:${subject.id}:${bookTitle}`;
    let bookId = bookCache.get(cacheKey);
    if (!bookId) {
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("class_id", classId)
        .eq("subject_id", subject.id)
        .eq("title", bookTitle)
        .maybeSingle();
      bookId = existing?.id;
      if (!bookId) {
        const { data: inserted, error } = await supabase
          .from("books")
          .insert({
            title: bookTitle,
            class_id: classId,
            subject_id: subject.id,
            order: int(raw.book_order) || 0,
          })
          .select("id")
          .single();
        if (error || !inserted) {
          failed++;
          log.push({ row: rowNum, status: "error", message: `Book create failed: ${error?.message}` });
          continue;
        }
        bookId = inserted.id;
      }
      bookCache.set(cacheKey, bookId);
    }
    bookTitles.add(cacheKey);

    // Chapter code: explicit, else derived (with book letter for multi-book groups).
    const letter = bookLetter.get(`${cls}:${slug}:${bookTitle}`) ?? "";
    const chapterCode =
      explicitCode || `${subject.code_prefix}-${cls}${letter}-${chapterNumber}`;

    const { error: upErr } = await supabase.from("chapters").upsert(
      {
        book_id: bookId,
        chapter_code: chapterCode,
        chapter_number: chapterNumber,
        title: chapterTitle,
        official_pdf_url: officialUrl,
        order: chapterNumber,
        status,
      },
      { onConflict: "chapter_code" },
    );
    if (upErr) {
      failed++;
      log.push({
        row: rowNum,
        status: "error",
        message:
          upErr.code === "23505"
            ? `chapter_code "${chapterCode}" conflicts.`
            : upErr.message,
      });
      continue;
    }

    chaptersCount++;
    log.push({
      row: rowNum,
      status: "created",
      message: `${chapterCode} → ${officialUrl ? "PDF linked" : "no PDF"} (${status}).`,
    });
  }

  revalidatePath("/admin/taxonomy");
  revalidatePath("/browse", "layout");

  return {
    log,
    summary: { books: bookTitles.size, chapters: chaptersCount, failed },
  };
}
