"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ContentStatus } from "@/types/database";

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

  revalidatePath(`/admin/chapters/${input.chapterCode}`);
  revalidatePath(`/chapter/${input.chapterCode}`);
  return {};
}
