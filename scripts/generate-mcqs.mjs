// Batch-generate Prelims MCQs (with answer + explanation) for every chapter and
// store them in the `mcqs` table as DRAFT by default (human-review model).
// Generates in rounds to keep each call small and to avoid repeats; round N
// is told the earlier stems so it produces distinct questions.
//
// Usage (from repo root, with .env.local containing ANTHROPIC_API_KEY):
//   node --env-file=.env.local scripts/generate-mcqs.mjs                 # 50/ch, draft
//   node --env-file=.env.local scripts/generate-mcqs.mjs --count 50 --publish
//   node --env-file=.env.local scripts/generate-mcqs.mjs --force         # regenerate
//   node --env-file=.env.local scripts/generate-mcqs.mjs --subject history --class 8

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

const TARGET = Number(val("--count") ?? 50);
const PER_CALL = Number(val("--per-call") ?? 25);
const PUBLISH = has("--publish");
const FORCE = has("--force");
const ONLY_SUBJECT = val("--subject");
const ONLY_CLASS = val("--class") ? Number(val("--class")) : undefined;
const CONCURRENCY = Number(val("--concurrency") ?? 3);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";
if (!url || !serviceKey || !anthropicKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ANTHROPIC_API_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anthropic = new Anthropic({ apiKey: anthropicKey });

const SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          stem: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correct_index: { type: "integer", enum: [0, 1, 2, 3] },
          solution: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        },
        required: ["stem", "options", "correct_index", "solution", "difficulty"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

const SYSTEM = [
  "You write UPSC Prelims-style multiple-choice questions from NCERT chapters for aspirants to practise.",
  "COVERAGE: across the full set for a chapter, no exam-relevant fact should be missed — dates & chronology, definitions & terms, classifications/types, cause→effect, personalities, institutions, acts/treaties/committees, first/largest/notable facts, maps/geography specifics, and commonly-confused pairs.",
  "Each question: a clear stem, exactly 4 options, exactly one correct answer, and a concise solution explaining why the answer is right (and, where useful, why the others are wrong).",
  "Vary difficulty (easy/medium/hard) and question types (single-correct factual, statement-based 'how many correct', match-the-pairs framed as options, assertion-style). Write original phrasing; never copy NCERT sentences. Be factually careful — do not invent facts.",
].join("\n");

async function withRetry(fn, tries = 4) {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const status = e?.status ?? e?.response?.status;
      if (i >= tries - 1 || ![429, 500, 502, 503, 529].includes(status)) throw e;
      await new Promise((r) => setTimeout(r, Math.min(2000 * 2 ** i, 30000)));
    }
  }
}

async function generateRound(ch, n, avoidStems) {
  const cls = ch.book.class.number;
  const subject = ch.book.subject.name;
  const avoid =
    avoidStems.length > 0
      ? `\n\nDo NOT repeat or paraphrase these already-written questions:\n- ${avoidStems.slice(0, 60).join("\n- ")}`
      : "";
  const prompt = `Write ${n} distinct UPSC Prelims MCQs for NCERT ${subject} (Class ${cls}), Book "${ch.book.title}", Chapter ${ch.chapter_number}: ${ch.title}.${avoid}`;

  const message = await withRetry(() =>
    anthropic.messages.create({
      model,
      max_tokens: 12000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    }),
  );
  if (message.stop_reason === "refusal") throw new Error("model refused");
  const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const parsed = JSON.parse(text);
  return (parsed.questions ?? []).filter(
    (q) =>
      q.stem &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      q.correct_index >= 0 &&
      q.correct_index <= 3,
  );
}

async function generateForChapter(ch, authorId) {
  const collected = [];
  const stems = [];
  let round = 0;
  while (collected.length < TARGET && round < Math.ceil(TARGET / PER_CALL) + 2) {
    round++;
    const need = Math.min(PER_CALL, TARGET - collected.length);
    const qs = await generateRound(ch, need, stems);
    for (const q of qs) {
      collected.push(q);
      stems.push(q.stem);
    }
    if (qs.length === 0) break;
  }
  const rows = collected.slice(0, TARGET).map((q, i) => ({
    chapter_id: ch.id,
    author_id: authorId,
    stem: q.stem,
    options: q.options,
    correct_index: q.correct_index,
    solution: q.solution ?? null,
    difficulty: q.difficulty ?? "medium",
    status: PUBLISH ? "published" : "draft",
    order: i,
  }));
  if (FORCE) {
    await supabase.from("mcqs").delete().eq("chapter_id", ch.id);
  }
  if (rows.length > 0) {
    const { error } = await supabase.from("mcqs").insert(rows);
    if (error) throw error;
  }
  return rows.length;
}

async function main() {
  const { data: admin } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  const authorId = admin?.id ?? null;

  const { data: chaptersRaw, error } = await supabase
    .from("chapters")
    .select(
      "id, chapter_code, chapter_number, title, book:books(title, class:classes(number), subject:subjects(slug, name))",
    );
  if (error) throw error;

  let chapters = chaptersRaw.filter((c) => c.book);
  if (ONLY_SUBJECT) chapters = chapters.filter((c) => c.book.subject.slug === ONLY_SUBJECT);
  if (ONLY_CLASS) chapters = chapters.filter((c) => c.book.class.number === ONLY_CLASS);

  if (!FORCE) {
    // Skip chapters that already have a healthy set of MCQs.
    const { data: counts } = await supabase.from("mcqs").select("chapter_id");
    const tally = new Map();
    for (const m of counts ?? []) tally.set(m.chapter_id, (tally.get(m.chapter_id) ?? 0) + 1);
    chapters = chapters.filter((c) => (tally.get(c.id) ?? 0) < TARGET);
  }

  chapters.sort(
    (a, b) => a.book.class.number - b.book.class.number || a.chapter_code.localeCompare(b.chapter_code),
  );

  console.log(
    `Generating up to ${TARGET} MCQs each for ${chapters.length} chapter(s) with ${model} — status: ${PUBLISH ? "PUBLISHED" : "draft"}, concurrency ${CONCURRENCY}.\n`,
  );

  let ok = 0;
  let fail = 0;
  let total = 0;
  for (let i = 0; i < chapters.length; i += CONCURRENCY) {
    const batch = chapters.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (ch) => {
        try {
          const n = await generateForChapter(ch, authorId);
          ok++;
          total += n;
          console.log(`✓ [${ok + fail}/${chapters.length}] ${ch.chapter_code} — ${n} MCQs (${ch.title})`);
        } catch (e) {
          fail++;
          console.error(`✗ ${ch.chapter_code} — ${e.message ?? e}`);
        }
      }),
    );
  }
  console.log(`\nDone: ${total} MCQs across ${ok} chapters, ${fail} failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
