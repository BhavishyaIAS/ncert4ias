// Batch-generate Prelims-focused revision gists for every chapter and store
// them in the `gists` table. AI-assisted, human-reviewed model: gists are
// written as DRAFT by default so nothing unreviewed reaches students — pass
// --publish to publish immediately. Resumable: skips chapters that already
// have a gist unless --force is given.
//
// Usage (from repo root, with .env.local containing ANTHROPIC_API_KEY):
//   node --env-file=.env.local scripts/generate-gists.mjs            # drafts
//   node --env-file=.env.local scripts/generate-gists.mjs --publish  # publish
//   node --env-file=.env.local scripts/generate-gists.mjs --force    # regenerate
//   node --env-file=.env.local scripts/generate-gists.mjs --subject history --class 8

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

const PUBLISH = has("--publish");
const FORCE = has("--force");
const ONLY_SUBJECT = val("--subject");
const ONLY_CLASS = val("--class") ? Number(val("--class")) : undefined;
const CONCURRENCY = Number(val("--concurrency") ?? 4);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
if (!url || !serviceKey || !anthropicKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ANTHROPIC_API_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anthropic = new Anthropic({ apiKey: anthropicKey });

const SYSTEM = [
  "You write revision gists for UPSC Civil Services aspirants from NCERT chapters.",
  "GOAL: an aspirant should be able to revise the ENTIRE chapter from this gist alone — complete coverage, clutter-free, reproducible under exam pressure — with special weight on what UPSC PRELIMS tests.",
  "",
  "PRELIMS COMPLETENESS — do not miss exam-relevant facts: key dates & chronology, definitions & technical terms, classifications/types, cause→effect chains, important personalities, institutions, treaties/acts/committees, first/largest/notable facts, and commonly-confused pairs. Prefer precise, factual, high-density notes over prose.",
  "",
  "STRICT RULES:",
  "- Write in your OWN original phrasing. Never copy NCERT sentences verbatim.",
  "- Output ONLY an HTML fragment. Allowed tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>. No <html>/<head>/<body>, no markdown, no code fences.",
  "- Where a timeline, sequence, or hierarchy aids revision, add ONE Mermaid diagram as: <pre data-type=\"mermaid\">graph TD; ...</pre> (valid Mermaid syntax only).",
  "- Prefix any fact you are not fully confident about with '⚠️ VERIFY: ' so the human reviewer can check it before publishing.",
  "- End with a short <h3>Prelims Pointers</h3> list of the most likely-to-be-asked facts.",
].join("\n");

async function withRetry(fn, tries = 4) {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const status = e?.status ?? e?.response?.status;
      if (i >= tries - 1 || ![429, 500, 502, 503, 529].includes(status)) throw e;
      const wait = Math.min(2000 * 2 ** i, 30000);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function generate(ch) {
  const cls = ch.book.class.number;
  const subject = ch.book.subject.name;
  const prompt = `Write a Prelims-focused revision gist for this NCERT chapter:
- Subject: ${subject}
- Class: ${cls}
- Book: ${ch.book.title}
- Chapter ${ch.chapter_number}: ${ch.title}
- Chapter code: ${ch.chapter_code}

Cover the whole chapter's themes, concepts, dates, terms and takeaways an aspirant must retain, optimised for UPSC Prelims recall.`;

  const message = await withRetry(() =>
    anthropic.messages.create({
      model,
      max_tokens: 6000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    }),
  );
  if (message.stop_reason === "refusal") throw new Error("model refused");
  return message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

async function main() {
  // Chapters with context.
  let query = supabase
    .from("chapters")
    .select(
      "id, chapter_code, chapter_number, title, book:books(title, class:classes(number), subject:subjects(slug, name))",
    );
  const { data: chaptersRaw, error } = await query;
  if (error) throw error;

  let chapters = chaptersRaw.filter((c) => c.book);
  if (ONLY_SUBJECT) chapters = chapters.filter((c) => c.book.subject.slug === ONLY_SUBJECT);
  if (ONLY_CLASS) chapters = chapters.filter((c) => c.book.class.number === ONLY_CLASS);

  // Skip chapters that already have a gist unless --force.
  if (!FORCE) {
    const { data: existing } = await supabase.from("gists").select("chapter_id");
    const done = new Set((existing ?? []).map((g) => g.chapter_id));
    chapters = chapters.filter((c) => !done.has(c.id));
  }

  chapters.sort(
    (a, b) =>
      a.book.class.number - b.book.class.number ||
      a.chapter_code.localeCompare(b.chapter_code),
  );

  console.log(
    `Generating ${chapters.length} gist(s) with ${model} — status: ${PUBLISH ? "PUBLISHED" : "draft"}, concurrency ${CONCURRENCY}.\n`,
  );

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < chapters.length; i += CONCURRENCY) {
    const batch = chapters.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (ch) => {
        try {
          const html = await generate(ch);
          const { error: upErr } = await supabase.from("gists").upsert(
            {
              chapter_id: ch.id,
              content_html: html,
              status: PUBLISH ? "published" : "draft",
            },
            { onConflict: "chapter_id" },
          );
          if (upErr) throw upErr;
          ok++;
          console.log(`✓ [${ok + fail}/${chapters.length}] ${ch.chapter_code} — ${ch.title}`);
        } catch (e) {
          fail++;
          console.error(`✗ ${ch.chapter_code} — ${e.message ?? e}`);
        }
      }),
    );
  }

  console.log(`\nDone: ${ok} gists written, ${fail} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
