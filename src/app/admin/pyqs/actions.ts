"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PYQ_PAPERS, type PyqPaper } from "@/lib/config/taxonomy";

export type RawPyqRow = {
  year?: string | number;
  paper?: string;
  question_text?: string;
  chapter_codes?: string;
  notes?: string;
};

export type UploadLogEntry = {
  row: number;
  status: "linked" | "partial" | "error";
  message: string;
};

export type UploadResult = {
  log: UploadLogEntry[];
  summary: { inserted: number; failed: number; links: number };
};

export async function uploadPyqs(rows: RawPyqRow[]): Promise<UploadResult> {
  const profile = await requireAdmin();
  const supabase = await createClient();

  // Build a chapter_code -> id map (codes are stored uppercase).
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, chapter_code");
  const codeToId = new Map<string, string>();
  for (const c of chapters ?? []) {
    codeToId.set(c.chapter_code.toUpperCase(), c.id);
  }

  const log: UploadLogEntry[] = [];
  let inserted = 0;
  let failed = 0;
  let links = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // account for the header row in the spreadsheet
    const raw = rows[i];

    const year = parseInt(String(raw.year ?? "").trim(), 10);
    const paper = String(raw.paper ?? "").trim();
    const questionText = String(raw.question_text ?? "").trim();
    const notes = String(raw.notes ?? "").trim() || null;

    if (!Number.isFinite(year)) {
      failed++;
      log.push({ row: rowNum, status: "error", message: "Invalid or missing year." });
      continue;
    }
    if (!PYQ_PAPERS.includes(paper as PyqPaper)) {
      failed++;
      log.push({
        row: rowNum,
        status: "error",
        message: `Invalid paper "${paper}". Use one of: ${PYQ_PAPERS.join(", ")}.`,
      });
      continue;
    }
    if (!questionText) {
      failed++;
      log.push({ row: rowNum, status: "error", message: "Missing question_text." });
      continue;
    }

    const codes = String(raw.chapter_codes ?? "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    const known: string[] = [];
    const unknown: string[] = [];
    for (const code of codes) {
      const id = codeToId.get(code);
      if (id) known.push(id);
      else unknown.push(code);
    }

    const { data: pyq, error: insErr } = await supabase
      .from("pyqs")
      .insert({
        year,
        paper: paper as PyqPaper,
        question_text: questionText,
        notes,
        status: "published",
        author_id: profile.id,
      })
      .select("id")
      .single();

    if (insErr || !pyq) {
      failed++;
      log.push({
        row: rowNum,
        status: "error",
        message: insErr?.message ?? "Insert failed.",
      });
      continue;
    }

    if (known.length > 0) {
      const { error: linkErr } = await supabase.from("pyq_chapters").insert(
        [...new Set(known)].map((chapter_id) => ({ pyq_id: pyq.id, chapter_id })),
      );
      if (!linkErr) links += new Set(known).size;
    }

    inserted++;
    if (unknown.length === 0 && known.length > 0) {
      log.push({
        row: rowNum,
        status: "linked",
        message: `Linked to ${known.length} chapter(s).`,
      });
    } else if (known.length > 0) {
      log.push({
        row: rowNum,
        status: "partial",
        message: `Linked ${known.length}; unknown chapter_code(s): ${unknown.join(", ")}.`,
      });
    } else {
      log.push({
        row: rowNum,
        status: "partial",
        message:
          codes.length === 0
            ? "Saved, but no chapter_codes given (not tagged to any chapter)."
            : `Saved, but no known chapter_code (unknown: ${unknown.join(", ")}).`,
      });
    }
  }

  revalidatePath("/admin/pyqs");
  // PYQ counts/tags surface on chapter pages — refresh broadly.
  revalidatePath("/chapter", "layout");

  return { log, summary: { inserted, failed, links } };
}
