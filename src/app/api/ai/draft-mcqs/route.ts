import "server-only";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * "Draft with AI" for Prelims. Generates UPSC-style MCQs grounded in the
 * chapter and inserts them as DRAFTS for admin review. Students never see them
 * until the admin edits and publishes each one. Server-only; admin-gated.
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
  const count = Math.min(Math.max(parseInt(String(body.count ?? 5), 10) || 5, 1), 10);
  if (!chapterId) {
    return NextResponse.json({ error: "Missing chapterId." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select(
      "chapter_number, title, book:books(title, class:classes(number), subject:subjects(name))",
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

  const system = [
    "You write UPSC Prelims-style multiple-choice questions from NCERT chapters.",
    "Each question: a clear stem, exactly 4 options, exactly one correct answer, and a concise solution explaining why the answer is right (and, where useful, why others are wrong).",
    "Write original phrasing. Be factually careful — if unsure of a fact, do not invent an MCQ around it.",
    "Mix difficulties. Favour concept-testing over rote recall, in UPSC style.",
  ].join("\n");

  const prompt = `Write ${count} UPSC Prelims MCQs for NCERT ${subject ?? ""} (Class ${cls ?? "?"}), Chapter ${chapter.chapter_number}: ${chapter.title}.`;

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: prompt }],
      // Structured output — guarantees parseable MCQ JSON.
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
        stem: string;
        options: string[];
        correct_index: number;
        solution: string;
        difficulty: "easy" | "medium" | "hard";
      }>;
    };

    const rows = (parsed.questions ?? [])
      .filter(
        (q) =>
          q.stem &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.correct_index >= 0 &&
          q.correct_index <= 3,
      )
      .map((q) => ({
        chapter_id: chapterId,
        author_id: profile.id,
        stem: q.stem,
        options: q.options,
        correct_index: q.correct_index,
        solution: q.solution ?? null,
        difficulty: q.difficulty ?? "medium",
        status: "draft" as const,
      }));

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "The model returned no usable questions." },
        { status: 422 },
      );
    }

    const { error } = await supabase.from("mcqs").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI drafting failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
