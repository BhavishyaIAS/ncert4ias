"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainsForm } from "./MainsForm";
import { deleteMains } from "@/app/admin/chapters/[code]/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { toast } from "sonner";
import type { Tables } from "@/types/database";

type Mains = Tables<"mains_questions">;

export function MainsManager({
  chapterId,
  chapterCode,
  items,
}: {
  chapterId: string;
  chapterCode: string;
  items: Mains[];
}) {
  const router = useRouter();
  const [drafting, setDrafting] = useState(false);
  const [adding, setAdding] = useState(false);

  async function draftWithAI() {
    setDrafting(true);
    try {
      const res = await fetch("/api/ai/draft-mains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, count: 2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Draft failed");
      toast.success(`${data.count} draft mains Q&A added — review and publish.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Draft failed");
    } finally {
      setDrafting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} question{items.length === 1 ? "" : "s"} ·{" "}
          {items.filter((m) => m.status === "published").length} published
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={draftWithAI}
          disabled={drafting}
        >
          {drafting ? "Drafting…" : "✦ Draft 2 with AI"}
        </Button>
      </div>

      {items.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {items.map((m, idx) => (
            <li key={m.id} className="p-4">
              <details>
                <summary className="flex cursor-pointer list-none items-start gap-3">
                  <span className="text-sm text-muted-foreground">{idx + 1}.</span>
                  <span className="flex-1 text-sm font-medium">{m.question}</span>
                  {m.gs_paper && <Badge variant="outline">{m.gs_paper}</Badge>}
                  <Badge variant={m.status === "published" ? "default" : "secondary"}>
                    {m.status}
                  </Badge>
                </summary>
                <div className="mt-4 space-y-4 border-t pt-4">
                  <MainsForm
                    mode="edit"
                    chapterId={chapterId}
                    chapterCode={chapterCode}
                    item={m}
                  />
                  <form action={deleteMains}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="chapter_code" value={chapterCode} />
                    <ConfirmSubmit variant="ghost" message="Delete this question?">
                      Delete question
                    </ConfirmSubmit>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="rounded-lg border bg-muted/20 p-4">
          <MainsForm
            mode="create"
            chapterId={chapterId}
            chapterCode={chapterCode}
            onDone={() => setAdding(false)}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAdding(true)}
        >
          + Add question manually
        </Button>
      )}
    </div>
  );
}
