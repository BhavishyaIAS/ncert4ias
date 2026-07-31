"use client";

import { useActionState, useState } from "react";
import {
  createMains,
  updateMains,
  type ActionState,
} from "@/app/admin/chapters/[code]/actions";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAINS_GS_PAPERS } from "@/lib/config/taxonomy";
import type { Tables } from "@/types/database";

type Mains = Tables<"mains_questions">;

const fieldClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function MainsForm({
  mode,
  chapterId,
  chapterCode,
  item,
  onDone,
}: {
  mode: "create" | "edit";
  chapterId: string;
  chapterCode: string;
  item?: Mains;
  onDone?: () => void;
}) {
  const action = mode === "create" ? createMains : updateMains;
  const [answerHtml, setAnswerHtml] = useState(item?.model_answer_html ?? "");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (prev, fd) => {
      const result = await action(prev, fd);
      if (!result.error && onDone) onDone();
      return result;
    },
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="chapter_id" value={chapterId} />
      <input type="hidden" name="chapter_code" value={chapterCode} />
      <input type="hidden" name="model_answer_html" value={answerHtml} />
      {mode === "edit" && <input type="hidden" name="id" value={item!.id} />}

      <div className="space-y-2">
        <Label htmlFor={`q-${item?.id ?? "new"}`}>Question</Label>
        <textarea
          id={`q-${item?.id ?? "new"}`}
          name="question"
          required
          rows={2}
          defaultValue={item?.question ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor={`dir-${item?.id ?? "new"}`}>Directive</Label>
          <Input
            id={`dir-${item?.id ?? "new"}`}
            name="directive_word"
            placeholder="Analyse…"
            defaultValue={item?.directive_word ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`wl-${item?.id ?? "new"}`}>Word limit</Label>
          <Input
            id={`wl-${item?.id ?? "new"}`}
            name="word_limit"
            type="number"
            defaultValue={item?.word_limit ?? 150}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`gs-${item?.id ?? "new"}`}>GS paper</Label>
          <select
            id={`gs-${item?.id ?? "new"}`}
            name="gs_paper"
            defaultValue={item?.gs_paper ?? ""}
            className={fieldClass}
          >
            <option value="">—</option>
            {MAINS_GS_PAPERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`st-${item?.id ?? "new"}`}>Status</Label>
          <select
            id={`st-${item?.id ?? "new"}`}
            name="status"
            defaultValue={item?.status ?? "draft"}
            className={fieldClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Model answer</Label>
        <RichTextEditor initialHtml={item?.model_answer_html} onChange={setAnswerHtml} />
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
