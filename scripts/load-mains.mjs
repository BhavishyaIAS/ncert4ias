// Load authored Mains model answers (the Mains rung) from
// scripts/mains-data/*.json into the `mains_questions` table. Structured-JSON
// authoring → trusted HTML via scripts/gist-render.mjs. Idempotent per chapter:
// deletes the chapter's existing rows, then inserts the file's questions.
//
// File name = chapter_code, e.g. scripts/mains-data/H-12-1.json. Shape:
//   { "gs_paper": "GS-I",
//     "questions": [
//       { "q": "…question…", "directive": "List", "word_limit": 150,
//         "answer": [ "paragraph", { "lead":"Plant foods:", "text":"…" },
//                     { "h":"sub-heading" }, { "list":["…","…"] } ] } ] }
//
// Usage (from repo root, with .env.local present):
//   node --env-file=.env.local scripts/load-mains.mjs                 # all files, published
//   node --env-file=.env.local scripts/load-mains.mjs --draft         # load as drafts
//   node --env-file=.env.local scripts/load-mains.mjs --only H-12-1   # a single chapter
//   node --env-file=.env.local scripts/load-mains.mjs --progress      # coverage report only

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { renderAnswer } from "./gist-render.mjs";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRAFT = has("--draft");
const ONLY = val("--only");
const PROGRESS_ONLY = has("--progress");

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "mains-data");
const GS_PAPERS = ["GS-I", "GS-II", "GS-III", "GS-IV", "Essay"];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function validate(code, doc) {
  const errs = [];
  if (!doc || typeof doc !== "object") return [`${code}: not a JSON object`];
  if (doc.gs_paper && !GS_PAPERS.includes(doc.gs_paper))
    errs.push(`${code}: bad gs_paper "${doc.gs_paper}"`);
  if (!Array.isArray(doc.questions) || doc.questions.length === 0)
    return errs.concat(`${code}: missing questions[]`);
  doc.questions.forEach((q, i) => {
    const at = `${code}.questions[${i}]`;
    if (!q.q || typeof q.q !== "string") errs.push(`${at}: missing q`);
    if (!Array.isArray(q.answer) || q.answer.length === 0)
      errs.push(`${at}: missing answer[]`);
    if (q.word_limit && !Number.isInteger(q.word_limit))
      errs.push(`${at}: word_limit must be an integer`);
  });
  return errs;
}

async function progressReport() {
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, chapter_code, book:books(class:classes(number), subject:subjects(slug))");
  const tally = new Map();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("mains_questions")
      .select("chapter_id")
      .range(from, from + PAGE - 1);
    for (const m of data ?? []) tally.set(m.chapter_id, (tally.get(m.chapter_id) ?? 0) + 1);
    if (!data || data.length < PAGE) break;
  }
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
  console.log(`Coverage: ${done}/${rows.length} chapters have Mains answers; ${total} answers total.\n`);
  const missing = rows.filter((r) => r.n === 0);
  if (missing.length) {
    console.log(`Chapters still without Mains answers (${missing.length}):`);
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
    let doc;
    try {
      doc = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
    } catch (e) {
      allErrs.push(`${code}: bad JSON — ${e.message}`);
      continue;
    }
    const errs = validate(code, doc);
    if (errs.length) {
      allErrs.push(...errs);
      skipped++;
      continue;
    }

    const rows = doc.questions.map((q, i) => ({
      chapter_id: chapterId,
      question: q.q,
      model_answer_html: renderAnswer(q.answer),
      directive_word: q.directive ?? null,
      word_limit: q.word_limit ?? null,
      gs_paper: q.gs_paper ?? doc.gs_paper ?? null,
      status: DRAFT ? "draft" : "published",
      author_id: authorId,
      order: i,
    }));

    await supabase.from("mains_questions").delete().eq("chapter_id", chapterId);
    const { error } = await supabase.from("mains_questions").insert(rows);
    if (error) {
      allErrs.push(`${code}: insert failed — ${error.message}`);
      continue;
    }
    okCh++;
    okQ += rows.length;
    console.log(`✓ ${code} — ${rows.length} Mains answer(s) ${DRAFT ? "draft" : "published"}`);
  }

  console.log(`\nDone: ${okQ} answer(s) across ${okCh} chapter(s), ${skipped} skipped.`);
  if (allErrs.length) {
    console.log(`\n${allErrs.length} problem(s):`);
    for (const e of allErrs) console.log(`  - ${e}`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
