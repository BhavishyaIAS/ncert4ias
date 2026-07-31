import "server-only";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { GsPaper } from "@/types/database";

const GS_PAPERS: readonly GsPaper[] = [
  "GS-I",
  "GS-II",
  "GS-III",
  "GS-IV",
  "Essay",
];

/**
 * "Draft with AI" for Mains. Generates Mains questions + NCERT-grounded model
 * answers, inserted as DRAFTS for admin review. Server-only; admin-gated.
 */
export async function POST(req: Request) {
  const profile = await requireAdmin();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const chapterId = body.chapterId as string | undefined;
  const count = Math.min(Math.max(parseInt(String(body.count ?? 2), 10) || 2, 1), 5);
  if (!chapterId) {
    return NextResponse.json({ error: "Missing chapterId." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select(
      "chapter_number, title, book:books(class:classes(number), subject:subjects(name))",
    )
    .eq("id", chapterId)
    .maybeSingle();
  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
  }
  // @ts-expect-error embedded relations aren't inferred from the hand-written types
  const cls = chapter.book?.class?.number;
  // @ts-expect-error see above
  const subject = chapter.book?.subject?.name;

  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

  const schema = {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            directive_word: { type: "string" },
            word_limit: { type: "integer" },
            gs_paper: {
              type: "string",
              enum: ["GS-I", "GS-II", "GS-III", "GS-IV", "Essay"],
            },
            model_answer_html: { type: "string" },
          },
          required: [
            "question",
            "directive_word",
            "word_limit",
            "gs_paper",
            "model_answer_html",
          ],
          additionalProperties: false,
        },
      },
    },
    required: ["questions"],
    additionalProperties: false,
  };

  const system = [
    "You write UPSC Mains questions and NCERT-grounded model answers.",
    "Each item: a question with an explicit directive word (Analyse/Discuss/Examine/etc.), a realistic word limit, the relevant GS paper, and a model answer.",
    "model_answer_html must be an HTML fragment using only <h3>, <h4>, <p>, <ul>, <ol>, <li>, <strong>, <em>. No markdown, no code fences, no <html>/<body>.",
    "Ground the answer in the chapter's content. Original phrasing. Structure it (intro, body, conclusion) as an examiner expects.",
  ].join("\n");

  const prompt = `Write ${count} UPSC Mains question(s) with model answers for NCERT ${subject ?? ""} (Class ${cls ?? "?"}), Chapter ${chapter.chapter_number}: ${chapter.title}.`;

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 12000,
      system,
      messages: [{ role: "user", content: prompt }],
      output_config: { format: { type: "json_schema", schema } },
    } as Anthropic.MessageCreateParamsNonStreaming);

    if (message.stop_reason === "refusal") {
      return NextResponse.json({ error: "The model declined." }, { status: 422 });
    }

    const text = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const parsed = JSON.parse(text) as {
      questions: Array<{
        question: string;
        directive_word: string;
        word_limit: number;
        gs_paper: string;
        model_answer_html: string;
      }>;
    };

    const rows = (parsed.questions ?? [])
      .filter((q) => q.question && q.model_answer_html)
      .map((q) => ({
        chapter_id: chapterId,
        author_id: profile.id,
        question: q.question,
        directive_word: q.directive_word ?? null,
        word_limit: Number.isFinite(q.word_limit) ? q.word_limit : null,
        gs_paper: GS_PAPERS.includes(q.gs_paper as GsPaper)
          ? (q.gs_paper as GsPaper)
          : null,
        model_answer_html: q.model_answer_html,
        status: "draft" as const,
      }));

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "The model returned no usable questions." },
        { status: 422 },
      );
    }

    const { error } = await supabase.from("mains_questions").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI drafting failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
