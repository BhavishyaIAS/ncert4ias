"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ContentStatus, Difficulty } from "@/types/database";

export type ActionState = { error?: string };

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function revalidateChapter(code: string) {
  revalidatePath(`/admin/chapters/${code}`);
  revalidatePath(`/chapter/${code}`);
}

function readMcq(formData: FormData) {
  const options = [0, 1, 2, 3].map((i) => str(formData.get(`option_${i}`)));
  const correct_index = parseInt(str(formData.get("correct_index")), 10);
  const difficultyRaw = str(formData.get("difficulty"));
  const difficulty: Difficulty = (["easy", "medium", "hard"] as const).includes(
    difficultyRaw as Difficulty,
  )
    ? (difficultyRaw as Difficulty)
    : "medium";
  return {
    stem: str(formData.get("stem")),
    options,
    correct_index,
    solution: str(formData.get("solution")) || null,
    difficulty,
    source_note: str(formData.get("source_note")) || null,
    status: (str(formData.get("status")) === "published"
      ? "published"
      : "draft") as ContentStatus,
  };
}

function validateMcq(m: ReturnType<typeof readMcq>): string | null {
  if (!m.stem) return "Question stem is required.";
  if (m.options.some((o) => !o)) return "All four options are required.";
  if (!(m.correct_index >= 0 && m.correct_index <= 3))
    return "Pick which option is correct.";
  return null;
}

export async function saveGist(input: {
  chapterId: string;
  chapterCode: string;
  contentJson: unknown;
  contentHtml: string;
  status: ContentStatus;
}): Promise<{ error?: string }> {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("gists").upsert(
    {
      chapter_id: input.chapterId,
      content_json: input.contentJson,
      content_html: input.contentHtml,
      status: input.status,
      author_id: profile.id,
    },
    { onConflict: "chapter_id" },
  );
  if (error) return { error: error.message };

  revalidateChapter(input.chapterCode);
  return {};
}

// ── MCQs (Prelims) ───────────────────────────────────────────────────────────

export async function createMcq(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await requireAdmin();
  const chapterId = str(formData.get("chapter_id"));
  const chapterCode = str(formData.get("chapter_code"));
  const m = readMcq(formData);
  const invalid = validateMcq(m);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mcqs")
    .insert({ chapter_id: chapterId, author_id: profile.id, ...m });
  if (error) return { error: error.message };

  revalidateChapter(chapterCode);
  return {};
}

export async function updateMcq(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const chapterCode = str(formData.get("chapter_code"));
  const m = readMcq(formData);
  const invalid = validateMcq(m);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.from("mcqs").update(m).eq("id", id);
  if (error) return { error: error.message };

  revalidateChapter(chapterCode);
  return {};
}

export async function deleteMcq(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const chapterCode = str(formData.get("chapter_code"));
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("mcqs").delete().eq("id", id);
  revalidateChapter(chapterCode);
}
