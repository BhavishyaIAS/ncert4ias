"use client";

import { useActionState, useState } from "react";
import { createChapter, updateChapter, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ChapterRow } from "@/lib/queries";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function ChapterForm({
  mode,
  bookId,
  codePrefix,
  classNumber,
  chapter,
}: {
  mode: "create" | "edit";
  bookId: string;
  codePrefix: string;
  classNumber: number;
  chapter?: ChapterRow;
}) {
  const action = mode === "create" ? createChapter : updateChapter;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );

  // For new chapters, suggest a chapter_code as the admin types the number.
  const [number, setNumber] = useState(
    chapter ? String(chapter.chapter_number) : "",
  );
  const [code, setCode] = useState(chapter?.chapter_code ?? "");
  const [codeTouched, setCodeTouched] = useState(mode === "edit");

  const suggested =
    mode === "create" && number
      ? `${codePrefix}-${classNumber}-${number}`
      : code;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="book_id" value={bookId} />
      {mode === "edit" && <input type="hidden" name="id" value={chapter!.id} />}

      <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
        <div className="space-y-2">
          <Label htmlFor={`num-${chapter?.id ?? "new"}`}>Ch. number</Label>
          <Input
            id={`num-${chapter?.id ?? "new"}`}
            name="chapter_number"
            type="number"
            required
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`title-${chapter?.id ?? "new"}`}>Title</Label>
          <Input
            id={`title-${chapter?.id ?? "new"}`}
            name="title"
            required
            defaultValue={chapter?.title ?? ""}
            placeholder="e.g. When People Rebel"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`code-${chapter?.id ?? "new"}`}>
            Chapter code{" "}
            <span className="font-normal text-muted-foreground">
              (permanent, unique)
            </span>
          </Label>
          <Input
            id={`code-${chapter?.id ?? "new"}`}
            name="chapter_code"
            required
            value={codeTouched ? code : suggested}
            onChange={(e) => {
              setCodeTouched(true);
              setCode(e.target.value.toUpperCase());
            }}
            className="font-mono uppercase"
            placeholder={`${codePrefix}-${classNumber}-1`}
          />
        </div>
        {mode === "edit" && (
          <div className="space-y-2">
            <Label htmlFor={`status-${chapter!.id}`}>Status</Label>
            <select
              id={`status-${chapter!.id}`}
              name="status"
              defaultValue={chapter!.status}
              className={selectClass}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`pdf-${chapter?.id ?? "new"}`}>
          Official NCERT PDF URL{" "}
          <span className="font-normal text-muted-foreground">
            (the Read tab)
          </span>
        </Label>
        <Input
          id={`pdf-${chapter?.id ?? "new"}`}
          name="official_pdf_url"
          type="url"
          defaultValue={chapter?.official_pdf_url ?? ""}
          placeholder="https://ncert.nic.in/textbook/pdf/…"
        />
      </div>

      <input
        type="hidden"
        name="order"
        value={number || String(chapter?.order ?? 0)}
      />

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Add chapter"
            : "Save chapter"}
      </Button>
    </form>
  );
}
