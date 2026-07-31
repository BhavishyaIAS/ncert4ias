"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GistView } from "@/components/gist-view";
import type { Tables } from "@/types/database";

type Mains = Tables<"mains_questions">;

function MainsItem({ item, index }: { item: Mains; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border p-4">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Q{index + 1}.
        </span>
        <div className="flex-1">
          <p className="font-medium">{item.question}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.gs_paper && <Badge variant="outline">{item.gs_paper}</Badge>}
            {item.directive_word && (
              <Badge variant="secondary">{item.directive_word}</Badge>
            )}
            {item.word_limit && (
              <Badge variant="secondary">{item.word_limit} words</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        {open ? (
          <div className="rounded-md bg-muted/40 p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Model answer
            </p>
            {item.model_answer_html ? (
              <GistView html={item.model_answer_html} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No model answer provided.
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setOpen(false)}
            >
              Hide model answer
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Reveal model answer
          </Button>
        )}
      </div>
    </li>
  );
}

export function MainsPractice({ items }: { items: Mains[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Attempt the answer yourself first, then reveal the model answer.
      </p>
      <ol className="space-y-4">
        {items.map((m, i) => (
          <MainsItem key={m.id} item={m} index={i} />
        ))}
      </ol>
    </div>
  );
}
