import "server-only";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * "Draft with AI" — server-only. Generates a first-draft NCERT gist grounded in
 * the chapter's identity. The Anthropic key never leaves the server; the draft
 * is returned to the admin editor for human review before it can be published.
 */
export async function POST(req: Request) {
  // Admin-only. requireAdmin throws a redirect for non-admins; guard the key too.
  await requireAdmin();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 400 },
    );
  }

  const { chapterId } = await req.json().catch(() => ({}));
  if (!chapterId) {
    return NextResponse.json({ error: "Missing chapterId." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select(
      "chapter_code, chapter_number, title, book:books(title, class:classes(number), subject:subjects(name))",
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
  // @ts-expect-error see above
  const bookTitle = chapter.book?.title;

  const client = new Anthropic();
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

  const system = [
    "You draft revision gists for UPSC Civil Services aspirants from NCERT chapters.",
    "A gist must let an aspirant revise the ENTIRE chapter from it alone: complete coverage, clutter-free, reproducible under exam pressure.",
    "",
    "STRICT RULES:",
    "- Write in your OWN original phrasing. Never copy NCERT sentences verbatim.",
    "- Output ONLY an HTML fragment. Allowed tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>. No <html>/<head>/<body>, no markdown, no code fences.",
    "- Where a timeline, sequence, or hierarchy aids revision, add ONE Mermaid diagram as: <pre data-type=\"mermaid\">graph TD; ...</pre> (valid Mermaid syntax only).",
    "- Prefix any fact you are not fully confident about with '⚠️ VERIFY: ' so the human reviewer can check it.",
    "- Keep it exam-relevant: emphasise what UPSC tends to test.",
  ].join("\n");

  const userPrompt = `Draft a revision gist for this NCERT chapter:
- Subject: ${subject ?? "Unknown"}
- Class: ${cls ?? "?"}
- Book: ${bookTitle ?? "Unknown"}
- Chapter ${chapter.chapter_number}: ${chapter.title}
- Chapter code: ${chapter.chapter_code}

Cover the whole chapter's key themes, concepts, dates, and takeaways an aspirant must retain.`;

  try {
    const message = await client.messages.create({
      model,
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    if (message.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "The model declined this request." },
        { status: 422 },
      );
    }

    const html = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();

    return NextResponse.json({ html });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI drafting failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
