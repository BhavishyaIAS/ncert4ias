"use client";

import { useState, useTransition } from "react";
import { setChapterGsTags } from "@/app/admin/chapters/[code]/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

type GsTag = Tables<"gs_tags">;

export function GsTagPicker({
  chapterId,
  chapterCode,
  gsTags,
  selectedIds,
}: {
  chapterId: string;
  chapterCode: string;
  gsTags: GsTag[];
  selectedIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    startTransition(async () => {
      const result = await setChapterGsTags({
        chapterId,
        chapterCode,
        gsTagIds: [...selected],
      });
      if (result.error) toast.error(result.error);
      else toast.success("GS tags saved.");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {gsTags.map((t) => {
          const active = selected.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              title={t.note ?? undefined}
              className={
                "rounded-full border px-3 py-1 text-sm transition-colors " +
                (active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={save} disabled={pending}>
        {pending ? "Saving…" : "Save GS tags"}
      </Button>
    </div>
  );
}
