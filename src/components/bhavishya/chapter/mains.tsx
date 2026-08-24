"use client";

import { useState } from "react";
import { GistView } from "@/components/gist-view";
import type { Tables } from "@/types/database";

type Mains = Tables<"mains_questions">;

/**
 * The Mains rung. The model answer stays shut until asked for — the value is in
 * attempting first, and an answer already on screen removes the reason to try.
 */
export function MainsRung({ items }: { items: Mains[] }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="bh-note">
        Write your answer first, then open the model answer to compare.
      </p>
      <ol className="flex flex-col gap-4">
        {items.map((item, i) => (
          <MainsItem key={item.id} item={item} index={i} />
        ))}
      </ol>
    </div>
  );
}

function MainsItem({ item, index }: { item: Mains; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <li className="bh-q">
      <div className="flex items-start gap-3">
        <span className="bh-q-n">Q{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="bh-q-stem">{item.question}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.gs_paper && <span className="bh-tag">{item.gs_paper}</span>}
            {item.directive_word && (
              <span className="bh-tag">{item.directive_word}</span>
            )}
            {item.word_limit && (
              <span className="bh-tag">{item.word_limit} words</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="bh-btn bh-btn-quiet"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide model answer" : "Show model answer"}
        </button>

        {open && (
          <div className="bh-model">
            <p className="bh-eyebrow">Model answer</p>
            {item.model_answer_html ? (
              <div className="bh-prose mt-3">
                <GistView html={item.model_answer_html} />
              </div>
            ) : (
              <p className="bh-note mt-3">
                No model answer has been written for this question yet.
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
