"use client";

import { useActionState } from "react";
import {
  createMcq,
  updateMcq,
  type ActionState,
} from "@/app/admin/chapters/[code]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database";

type Mcq = Tables<"mcqs">;

const fieldClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function McqForm({
  mode,
  chapterId,
  chapterCode,
  mcq,
  onDone,
}: {
  mode: "create" | "edit";
  chapterId: string;
  chapterCode: string;
  mcq?: Mcq;
  onDone?: () => void;
}) {
  const action = mode === "create" ? createMcq : updateMcq;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (prev, fd) => {
      const result = await action(prev, fd);
      if (!result.error && onDone) onDone();
      return result;
    },
    {},
  );

  const options = (mcq?.options as string[] | undefined) ?? ["", "", "", ""];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="chapter_id" value={chapterId} />
      <input type="hidden" name="chapter_code" value={chapterCode} />
      {mode === "edit" && <input type="hidden" name="id" value={mcq!.id} />}

      <div className="space-y-2">
        <Label htmlFor={`stem-${mcq?.id ?? "new"}`}>Question</Label>
        <textarea
          id={`stem-${mcq?.id ?? "new"}`}
          name="stem"
          required
          rows={2}
          defaultValue={mcq?.stem ?? ""}
          className={fieldClass}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Options{" "}
          <span className="font-normal text-muted-foreground">
            (select the correct one)
          </span>
        </legend>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct_index"
              value={i}
              required
              defaultChecked={(mcq?.correct_index ?? 0) === i}
              aria-label={`Option ${String.fromCharCode(65 + i)} is correct`}
            />
            <span className="w-4 text-sm text-muted-foreground">
              {String.fromCharCode(65 + i)}
            </span>
            <Input
              name={`option_${i}`}
              required
              defaultValue={options[i] ?? ""}
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
            />
          </div>
        ))}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor={`sol-${mcq?.id ?? "new"}`}>Solution / explanation</Label>
        <textarea
          id={`sol-${mcq?.id ?? "new"}`}
          name="solution"
          rows={2}
          defaultValue={mcq?.solution ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`diff-${mcq?.id ?? "new"}`}>Difficulty</Label>
          <select
            id={`diff-${mcq?.id ?? "new"}`}
            name="difficulty"
            defaultValue={mcq?.difficulty ?? "medium"}
            className={fieldClass}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`src-${mcq?.id ?? "new"}`}>Source note</Label>
          <Input
            id={`src-${mcq?.id ?? "new"}`}
            name="source_note"
            defaultValue={mcq?.source_note ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`st-${mcq?.id ?? "new"}`}>Status</Label>
          <select
            id={`st-${mcq?.id ?? "new"}`}
            name="status"
            defaultValue={mcq?.status ?? "draft"}
            className={fieldClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Add question" : "Save question"}
      </Button>
    </form>
  );
}
