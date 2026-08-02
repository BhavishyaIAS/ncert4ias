// Seed the NCERT catalogue (books + chapters with official PDF links) into
// Supabase. Idempotent: books matched by (class, subject, title); chapters
// upserted by chapter_code. Chapters are published so the Read rung is live.
//
// Usage (from repo root, with .env.local present):
//   node --env-file=.env.local scripts/seed-ncert.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the env.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NCERT_PDF_BASE = "https://ncert.nic.in/textbook/pdf";
const pdfUrl = (code, n) =>
  `${NCERT_PDF_BASE}/${code.toLowerCase()}${String(n).padStart(2, "0")}.pdf`;

const catalogue = JSON.parse(
  readFileSync(join(__dirname, "ncert-catalogue.json"), "utf8"),
);

async function main() {
  // Lookups.
  const { data: classes } = await supabase.from("classes").select("id, number");
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, slug, code_prefix");
  const classByNum = new Map(classes.map((c) => [c.number, c.id]));
  const subjectBySlug = new Map(subjects.map((s) => [s.slug, s]));

  // Book letters for (class, subject) groups with more than one book.
  const groupCounts = new Map();
  for (const b of catalogue.books) {
    const k = `${b.class}:${b.subject}`;
    groupCounts.set(k, (groupCounts.get(k) ?? 0) + 1);
  }
  const groupSeen = new Map();

  let books = 0;
  let chapters = 0;

  for (const book of catalogue.books) {
    const classId = classByNum.get(book.class);
    const subject = subjectBySlug.get(book.subject);
    if (!classId || !subject) {
      console.warn(`Skip: no class/subject for ${book.class}/${book.subject}`);
      continue;
    }

    const k = `${book.class}:${book.subject}`;
    const idx = groupSeen.get(k) ?? 0;
    groupSeen.set(k, idx + 1);
    const multi = groupCounts.get(k) > 1;
    const letter = multi ? String.fromCharCode(65 + idx) : "";
    const classSeg = `${book.class}${letter}`;

    // Find or create the book.
    const { data: existing } = await supabase
      .from("books")
      .select("id")
      .eq("class_id", classId)
      .eq("subject_id", subject.id)
      .eq("title", book.title)
      .maybeSingle();

    let bookId = existing?.id;
    if (!bookId) {
      const { data: inserted, error } = await supabase
        .from("books")
        .insert({
          title: book.title,
          class_id: classId,
          subject_id: subject.id,
          order: idx,
        })
        .select("id")
        .single();
      if (error) {
        console.error(`Book insert failed (${book.title}):`, error.message);
        continue;
      }
      bookId = inserted.id;
    }
    books++;

    // Upsert chapters. A chapter is either a string (title; PDF derived from the
    // book code + its position) or an object { title, pdf } giving an explicit
    // PDF file basename — used when a book's chapters map to non-contiguous PDF
    // files (e.g. Class 6's integrated book split by subject).
    const rows = book.chapters.map((ch, i) => {
      const n = i + 1;
      const title = typeof ch === "string" ? ch : ch.title;
      const officialUrl =
        typeof ch === "object" && ch.pdf
          ? `${NCERT_PDF_BASE}/${ch.pdf.toLowerCase()}.pdf`
          : book.code
            ? pdfUrl(book.code, n)
            : null;
      return {
        book_id: bookId,
        chapter_code: `${subject.code_prefix}-${classSeg}-${n}`,
        chapter_number: n,
        title,
        official_pdf_url: officialUrl,
        order: n,
        status: "published",
      };
    });

    const { error: upErr } = await supabase
      .from("chapters")
      .upsert(rows, { onConflict: "chapter_code" });
    if (upErr) {
      console.error(`Chapters upsert failed (${book.title}):`, upErr.message);
      continue;
    }

    // Remove any chapters beyond the current count (e.g. from an earlier,
    // over-counted run) so the catalogue stays the source of truth.
    await supabase
      .from("chapters")
      .delete()
      .eq("book_id", bookId)
      .gt("chapter_number", rows.length);

    chapters += rows.length;
    console.log(
      `✓ ${book.title} (Class ${book.class} ${book.subject}) — ${rows.length} chapters [${book.code}]`,
    );
  }

  console.log(`\nDone: ${books} books, ${chapters} chapters.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
