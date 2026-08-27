// Load authored revision gists (the Revise rung) from scripts/gist-data/*.json
// into the `gists` table. Structured-JSON authoring → trusted HTML via
// scripts/gist-render.mjs. Idempotent: upserts one gist per chapter_id.
//
// File name = chapter_code, e.g. scripts/gist-data/H-12-1.json. Shape:
//   { "source": "…optional…", "sections": [ { "heading": "...",
//     "intro": "...", "points": [ "…", { "text":"…", "sub":["…"] } ],
//     "table": { "columns":[…], "rows":[[…]] }, "mermaid": "graph TD; …" } ] }
//
// Usage (from repo root, with .env.local present):
//   node --env-file=.env.local scripts/load-gists.mjs                 # all files, published
//   node --env-file=.env.local scripts/load-gists.mjs --draft         # load as drafts
//   node --env-file=.env.local scripts/load-gists.mjs --only H-12-1   # a single chapter
//   node --env-file=.env.local scripts/load-gists.mjs --progress      # coverage report only

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { renderGist } from "./gist-render.mjs";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRAFT = has("--draft");
const ONLY = val("--only");
const PROGRESS_ONLY = has("--progress");

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "gist-data");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function validate(code, gist) {
  const errs = [];
  if (!gist || typeof gist !== "object") return [`${code}: not a JSON object`];
  if (!Array.isArray(gist.sections) || gist.sections.length === 0)
    errs.push(`${code}: missing sections[]`);
  else
    gist.sections.forEach((s, i) => {
      if (!s.heading) errs.push(`${code}.sections[${i}]: missing heading`);
      if (s.table && (!Array.isArray(s.table.columns) || !Array.isArray(s.table.rows)))
        errs.push(`${code}.sections[${i}]: malformed table`);
    });
  return errs;
}

async function progressReport() {
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, chapter_code, book:books(class:classes(number), subject:subjects(slug))");
  const { data: gists } = await supabase.from("gists").select("chapter_id, status");
  const done = new Map((gists ?? []).map((g) => [g.chapter_id, g.status]));
  const rows = (chapters ?? [])
    .filter((c) => c.book)
    .map((c) => ({
      code: c.chapter_code,
      cls: c.book.class.number,
      sub: c.book.subject.slug,
      status: done.get(c.id) ?? null,
    }))
    .sort((a, b) => a.cls - b.cls || a.sub.localeCompare(b.sub) || a.code.localeCompare(b.code));
  const have = rows.filter((r) => r.status);
  console.log(`Coverage: ${have.length}/${rows.length} chapters have a gist.\n`);
  const missing = rows.filter((r) => !r.status);
  if (missing.length) {
    console.log(`Chapters still without a gist (${missing.length}):`);
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

  let ok = 0;
  let skipped = 0;
  const allErrs = [];

  for (const file of files) {
    const code = file.replace(/\.json$/, "");
    const chapterId = idByCode.get(code);
    if (!chapterId) {
      allErrs.push(`${code}: no chapter with this code in DB`);
      continue;
    }
    let gist;
    try {
      gist = JSON.parse(readFileSync(join(DATA_DIR, file), "utf8"));
    } catch (e) {
      allErrs.push(`${code}: bad JSON — ${e.message}`);
      continue;
    }
    const errs = validate(code, gist);
    if (errs.length) {
      allErrs.push(...errs);
      skipped++;
      continue;
    }

    const html = renderGist(gist);
    const { error } = await supabase.from("gists").upsert(
      {
        chapter_id: chapterId,
        content_html: html,
        status: DRAFT ? "draft" : "published",
        author_id: authorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "chapter_id" },
    );
    if (error) {
      allErrs.push(`${code}: upsert failed — ${error.message}`);
      continue;
    }
    ok++;
    console.log(`✓ ${code} — gist ${DRAFT ? "draft" : "published"} (${html.length} chars)`);
  }

  console.log(`\nDone: ${ok} gist(s) loaded, ${skipped} skipped.`);
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
