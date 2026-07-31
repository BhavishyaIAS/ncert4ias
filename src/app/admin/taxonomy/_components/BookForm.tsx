"use client";

import { useActionState } from "react";
import { createBook, updateBook, type ActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClassRow, SubjectRow, BookRow } from "@/lib/queries";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function BookForm({
  mode,
  classes,
  subjects,
  book,
}: {
  mode: "create" | "edit";
  classes?: ClassRow[];
  subjects?: SubjectRow[];
  book?: BookRow;
}) {
  const action = mode === "create" ? createBook : updateBook;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && <input type="hidden" name="id" value={book!.id} />}

      <div className="space-y-2">
        <Label htmlFor="title">Book title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={book?.title ?? ""}
          placeholder="e.g. Our Pasts III"
        />
      </div>

      {mode === "create" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="class_id">Class</Label>
            <select id="class_id" name="class_id" required className={selectClass}>
              <option value="">Select class…</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject_id">Subject</Label>
            <select
              id="subject_id"
              name="subject_id"
              required
              className={selectClass}
            >
              <option value="">Select subject…</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="order">Display order</Label>
        <Input
          id="order"
          name="order"
          type="number"
          defaultValue={book?.order ?? 0}
          className="w-28"
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Create book"
            : "Save changes"}
      </Button>
    </form>
  );
}
