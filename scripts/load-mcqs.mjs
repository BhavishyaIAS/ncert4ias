// Load hand-authored Prelims MCQs into the `mcqs` table. No AI/API key needed:
// the questions are authored directly as JSON, one file per chapter, and this
// script validates and upserts them. Idempotent per chapter — the file is the
// source of truth, so re-running replaces that chapter's MCQs cleanly.
//
// Data layout: scripts/mcq-data/<CHAPTER_CODE>.json  (e.g. H-6-1.json)
//   [ { "stem": "...", "options": ["A","B","C","D"], "correct_index": 0,
//       "solution": "...", "difficulty": "easy|medium|hard" }, ... ]
//
// Usage (from repo root, with .env.local present):
//   node --env-file=.env.local scripts/load-mcqs.mjs                 # all files, published
//   node --env-file=.env.local scripts/load-mcqs.mjs --draft         # load as drafts
//   node --env-file=.env.local scripts/load-mcqs.mjs --only H-6-1    # a single chapter
//   node --env-file=.env.local scripts/load-mcqs.mjs --progress      # coverage report only

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "mcq-data");

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

const STATUS = has("--draft") ? "draft" : "published";
const ONLY = val("--only");
const PROGRESS_ONLY = has("--progress");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function validate(code, mcqs) {
  const errs = [];
  if (!Array.isArray(mcqs)) return [`${code}: file is not a JSON array`];
  mcqs.forEach((q, i) => {
    const at = `${code}[${i}]`;
    if (!q.stem || typeof q.stem !== "string") errs.push(`${at}: missing stem`);
    if (!Array.isArray(q.options) || q.options.length !== 4)
      errs.push(`${at}: options must be exactly 4`);
    else if (q.options.some((o) => typeof o !== "string" || !o.trim()))
      errs.push(`${at}: an option is empty`);
    if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index > 3)
      errs.push(`${at}: correct_index must be 0..3`);
    if (q.difficulty && !["easy", "medium", "hard"].includes(q.difficulty))
      errs.push(`${at}: bad difficulty "${q.difficulty}"`);
    if (!q.solution || typeof q.solution !== "string")
      errs.push(`${at}: missing solution`);
  });
  // Duplicate-stem guard within a chapter.
  const seen = new Set();
  mcqs.forEach((q, i) => {
    const key = (q.stem ?? "").trim().toLowerCase();
    if (key && seen.has(key)) errs.push(`${code}[${i}]: duplicate stem`);
    seen.add(key);
  });
  return errs;
}

async function progressReport() {
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, chapter_code, book:books(class:classes(number), subject:subjects(slug))");
  const { data: counts } = await supabase.from("mcqs").select("chapter_id");
  const tally = new Map();
  for (const m of counts ?? []) tally.set(m.chapter_id, (tally.get(m.chapter_id) ?? 0) + 1);
  const rows = (chapters ?? [])
    .filter((c) => c.book)
    .map((c) => ({
      code: c.chapter_code,
      cls: c.book.class.number,
      sub: c.book.subject.slug,
      n: tally.get(c.id) ?? 0,
    }))
    .sort((a, b) => a.cls - b.cls || a.sub.localeCompare(b.sub) || a.code.localeCompare(b.code));
  const done = rows.filter((r) => r.n > 0).length;
  let total = 0;
  for (const r of rows) total += r.n;
  console.log(`Coverage: ${done}/${rows.length} chapters have MCQs; ${total} MCQs total.\n`);
  const missing = rows.filter((r) => r.n === 0);
  if (missing.length) {
    console.log(`Chapters still without MCQs (${missing.length}):`);
    for (const r of missing) console.log(`  ${r.code}  (C${r.cls} ${r.sub})`);
  }
}

async function main() {
  if (PROGRESS_ONLY) return progressReport();

  const { data: admin } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  const authorId = admin?.id ?? null;

  const { data: chapters } = await supabase.from("chapters").select("id, chapter_code");
  const idByCode = new Map((chapters ?? []).map((c) => [c.chapter_code, c.id]));

  if (!existsSync(DATA_DIR)) {
    console.error(`No data dir: ${DATA_DIR}`);
    process.exit(1);
  }
  let files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  if (ONLY) files = files.filter((f) => f === `${ONLY}.json`);
  files.sort();

  let okCh = 0;
  let okQ = 0;
  let skipped = 0;
  const allErrs = [];

  for (const file of files) {
    const code = file.replace(/\.json$/, "");
    const chapterId = idByCode.get(code);
    if (!chapterId) {
      allErrs.push(`${code}: no chapter with this code in DB`);
      continue;
    }
    let mcqs;
    try {
      mcqs = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
    } catch (e) {
      allErrs.push(`${code}: bad JSON — ${e.message}`);
      continue;
    }
    const errs = validate(code, mcqs);
    if (errs.length) {
      allErrs.push(...errs);
      skipped++;
      continue;
    }

    // Replace this chapter's MCQs with the file's contents (idempotent).
    await supabase.from("mcqs").delete().eq("chapter_id", chapterId);
    const rows = mcqs.map((q, i) => ({
      chapter_id: chapterId,
      author_id: authorId,
      stem: q.stem.trim(),
      options: q.options.map((o) => o.trim()),
      correct_index: q.correct_index,
      solution: (q.solution ?? "").trim() || null,
      difficulty: q.difficulty ?? "medium",
      status: STATUS,
      order: i,
    }));
    const { error } = await supabase.from("mcqs").insert(rows);
    if (error) {
      allErrs.push(`${code}: insert failed — ${error.message}`);
      continue;
    }
    okCh++;
    okQ += rows.length;
    console.log(`✓ ${code} — ${rows.length} MCQs [${STATUS}]`);
  }

  console.log(`\nDone: ${okQ} MCQs across ${okCh} chapters (${skipped} skipped for errors).`);
  if (allErrs.length) {
    console.error(`\n${allErrs.length} problem(s):`);
    for (const e of allErrs) console.error(`  - ${e}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
