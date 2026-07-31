"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export type ActionState = { error?: string };

const ok = (): ActionState => ({});
const fail = (error: string): ActionState => ({ error });

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function intOr(v: FormDataEntryValue | null, fallback = 0): number {
  const n = parseInt(str(v), 10);
  return Number.isFinite(n) ? n : fallback;
}

// ── Books ──────────────────────────────────────────────────────────────────

export async function createBook(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const title = str(formData.get("title"));
  const class_id = str(formData.get("class_id"));
  const subject_id = str(formData.get("subject_id"));
  const order = intOr(formData.get("order"));

  if (!title || !class_id || !subject_id) {
    return fail("Title, class and subject are all required.");
  }

  const s = await createClient();
  const { data, error } = await s
    .from("books")
    .insert({ title, class_id, subject_id, order })
    .select("id")
    .single();
  if (error) return fail(error.message);

  revalidatePath("/admin/taxonomy");
  redirect(`/admin/taxonomy/books/${data.id}`);
}

export async function updateBook(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const title = str(formData.get("title"));
  const order = intOr(formData.get("order"));
  if (!id || !title) return fail("Missing book id or title.");

  const s = await createClient();
  const { error } = await s.from("books").update({ title, order }).eq("id", id);
  if (error) return fail(error.message);

  revalidatePath("/admin/taxonomy");
  revalidatePath(`/admin/taxonomy/books/${id}`);
  return ok();
}

export async function deleteBook(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  if (!id) return;
  const s = await createClient();
  await s.from("books").delete().eq("id", id);
  revalidatePath("/admin/taxonomy");
  redirect("/admin/taxonomy");
}

// ── Chapters ─────────────────────────────────────────────────────────────────

export async function createChapter(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const book_id = str(formData.get("book_id"));
  const chapter_code = str(formData.get("chapter_code")).toUpperCase();
  const chapter_number = intOr(formData.get("chapter_number"));
  const title = str(formData.get("title"));
  const official_pdf_url = str(formData.get("official_pdf_url")) || null;
  const order = intOr(formData.get("order"), chapter_number);

  if (!book_id || !chapter_code || !title) {
    return fail("Chapter code and title are required.");
  }

  const s = await createClient();
  const { error } = await s.from("chapters").insert({
    book_id,
    chapter_code,
    chapter_number,
    title,
    official_pdf_url,
    order,
  });
  if (error) {
    return fail(
      error.code === "23505"
        ? `Chapter code "${chapter_code}" is already in use.`
        : error.message,
    );
  }

  revalidatePath(`/admin/taxonomy/books/${book_id}`);
  return ok();
}

export async function updateChapter(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const book_id = str(formData.get("book_id"));
  const chapter_code = str(formData.get("chapter_code")).toUpperCase();
  const chapter_number = intOr(formData.get("chapter_number"));
  const title = str(formData.get("title"));
  const official_pdf_url = str(formData.get("official_pdf_url")) || null;
  const status = str(formData.get("status")) === "published" ? "published" : "draft";
  const order = intOr(formData.get("order"), chapter_number);

  if (!id || !chapter_code || !title) {
    return fail("Chapter code and title are required.");
  }

  const s = await createClient();
  const { error } = await s
    .from("chapters")
    .update({
      chapter_code,
      chapter_number,
      title,
      official_pdf_url,
      status,
      order,
    })
    .eq("id", id);
  if (error) {
    return fail(
      error.code === "23505"
        ? `Chapter code "${chapter_code}" is already in use.`
        : error.message,
    );
  }

  revalidatePath(`/admin/taxonomy/books/${book_id}`);
  return ok();
}

export async function deleteChapter(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("id"));
  const book_id = str(formData.get("book_id"));
  if (!id) return;
  const s = await createClient();
  await s.from("chapters").delete().eq("id", id);
  revalidatePath(`/admin/taxonomy/books/${book_id}`);
}
