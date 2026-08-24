"use client";

import { useState } from "react";
import type { Tables } from "@/types/database";

type Mcq = Tables<"mcqs">;

/**
 * The Prelims rung.
 *
 * Colour cannot carry correctness here: the palette is red, black and white, and
 * red already means "the active thing". So red marks the CORRECT option — the
 * answer is what matters on the page — and a wrong pick is marked in ink with an
 * explicit "Your answer" label. Nothing depends on hue alone; every state is
 * also stated in words, which is what a screen reader and a colour-blind reader
 * both need.
 */
export function Prelims({
  mcqs,
  onAllAnswered,
}: {
  mcqs: Mcq[];
  onAllAnswered?: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const answered = Object.keys(answers).length;
  const correct = mcqs.filter((m) => answers[m.id] === m.correct_index).length;

  function answer(mcq: Mcq, choice: number) {
    if (answers[mcq.id] !== undefined) return;
    const next = { ...answers, [mcq.id]: choice };
    setAnswers(next);
    if (Object.keys(next).length === mcqs.length) onAllAnswered?.();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="bh-note">
          Commit to an answer, then the solution opens.
        </p>
        <p className="bh-mono bh-muted" aria-live="polite">
          {answered} / {mcqs.length} answered
          {answered > 0 && ` · ${correct} correct`}
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        {mcqs.map((mcq, i) => (
          <Question
            key={mcq.id}
            mcq={mcq}
            index={i}
            chosen={answers[mcq.id]}
            onAnswer={(c) => answer(mcq, c)}
          />
        ))}
      </ol>
    </div>
  );
}

function Question({
  mcq,
  index,
  chosen,
  onAnswer,
}: {
  mcq: Mcq;
  index: number;
  chosen: number | undefined;
  onAnswer: (choice: number) => void;
}) {
  const options = (mcq.options as string[]) ?? [];
  const revealed = chosen !== undefined;
  const gotIt = chosen === mcq.correct_index;

  return (
    <li className="bh-q">
      <div className="flex items-start gap-3">
        <span className="bh-q-n">Q{index + 1}</span>
        <p className="bh-q-stem">{mcq.stem}</p>
        <span className="bh-tag">{mcq.difficulty}</span>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {options.map((opt, i) => {
          const isCorrect = i === mcq.correct_index;
          const isChosen = i === chosen;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => onAnswer(i)}
                className={[
                  "bh-opt",
                  revealed && isCorrect ? "is-correct" : "",
                  revealed && isChosen && !isCorrect ? "is-wrong" : "",
                ].join(" ")}
              >
                <span className="bh-opt-k">{String.fromCharCode(65 + i)}</span>
                <span className="bh-opt-t">{opt}</span>
                {revealed && isCorrect && (
                  <span className="bh-opt-tag">Correct answer</span>
                )}
                {revealed && isChosen && !isCorrect && (
                  <span className="bh-opt-tag">Your answer</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {revealed && (
        <div className="bh-solution">
          <p className="bh-solution-verdict">
            {gotIt
              ? "Right."
              : `Not this time — the answer is ${String.fromCharCode(65 + mcq.correct_index)}.`}
          </p>
          {mcq.solution && <p className="bh-solution-body">{mcq.solution}</p>}
        </div>
      )}
    </li>
  );
}
