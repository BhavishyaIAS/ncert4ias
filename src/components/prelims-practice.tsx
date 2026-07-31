"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";

type Mcq = Tables<"mcqs">;

function Question({ mcq, index }: { mcq: Mcq; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const options = (mcq.options as string[]) ?? [];

  return (
    <li className="rounded-lg border p-4">
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Q{index + 1}.
        </span>
        <p className="flex-1 font-medium">{mcq.stem}</p>
        <Badge variant="outline">{mcq.difficulty}</Badge>
      </div>

      <ul className="mt-3 space-y-2">
        {options.map((opt, i) => {
          const isCorrect = i === mcq.correct_index;
          const isChosen = i === selected;
          const showState = revealed || (selected !== null && isChosen);
          return (
            <li key={i}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => {
                  setSelected(i);
                  setRevealed(true);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  !showState && "hover:bg-muted/50",
                  revealed && isCorrect && "border-green-600/50 bg-green-600/10",
                  revealed &&
                    isChosen &&
                    !isCorrect &&
                    "border-destructive/50 bg-destructive/10",
                )}
              >
                <span className="text-xs text-muted-foreground">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
                {revealed && isCorrect && <span className="text-green-600">✓</span>}
                {revealed && isChosen && !isCorrect && (
                  <span className="text-destructive">✗</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {revealed && (
        <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm">
          <p className="font-medium">
            {selected === mcq.correct_index ? "Correct!" : "Not quite."} Answer:{" "}
            {String.fromCharCode(65 + mcq.correct_index)}
          </p>
          {mcq.solution && (
            <p className="mt-1 text-muted-foreground">{mcq.solution}</p>
          )}
        </div>
      )}
    </li>
  );
}

export function PrelimsPractice({ mcqs }: { mcqs: Mcq[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Attempt each question, then the answer and solution reveal.
      </p>
      <ol className="space-y-4">
        {mcqs.map((m, i) => (
          <Question key={m.id} mcq={m} index={i} />
        ))}
      </ol>
    </div>
  );
}
