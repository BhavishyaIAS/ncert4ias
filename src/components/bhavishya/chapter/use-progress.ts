"use client";

import { useCallback, useEffect, useState } from "react";
import type { LadderRungKey } from "@/lib/config/taxonomy";

/**
 * Chapter progress.
 *
 * There is no progress model in the product — no table, no column — and the
 * redesign brief puts schema changes off-limits. So this lives in
 * localStorage, keyed by chapter_code.
 *
 * Known limitation, stated plainly: progress does not follow a reader between
 * devices. Making it do so needs a table and an RLS policy.
 *
 * `hydrated` exists because the server cannot know what localStorage holds. The
 * first paint is always "nothing done"; once this flips true the real state is
 * in. The arc animating from empty to where you left off is the deliberate
 * consequence — you see your position before you have to think about it.
 */

const KEY_PREFIX = "n4i-progress:";

export type Progress = {
  done: Set<LadderRungKey>;
  hydrated: boolean;
  toggle: (rung: LadderRungKey) => void;
  reset: () => void;
};

export function useChapterProgress(chapterCode: string): Progress {
  const [done, setDone] = useState<Set<LadderRungKey>>(() => new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let next = new Set<LadderRungKey>();
    try {
      const raw = localStorage.getItem(KEY_PREFIX + chapterCode);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          next = new Set(parsed.filter((k): k is LadderRungKey => typeof k === "string"));
        }
      }
    } catch {
      // Private mode, disabled storage, or corrupt JSON. Start empty rather
      // than throwing — progress is a convenience, never a blocker.
    }
    setDone(next);
    setHydrated(true);
  }, [chapterCode]);

  const persist = useCallback(
    (next: Set<LadderRungKey>) => {
      try {
        localStorage.setItem(KEY_PREFIX + chapterCode, JSON.stringify([...next]));
      } catch {
        // Nothing to do — the in-memory state still works for this session.
      }
    },
    [chapterCode],
  );

  const toggle = useCallback(
    (rung: LadderRungKey) => {
      setDone((prev) => {
        const next = new Set(prev);
        if (next.has(rung)) next.delete(rung);
        else next.add(rung);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const reset = useCallback(() => {
    setDone(new Set());
    persist(new Set());
  }, [persist]);

  return { done, hydrated, toggle, reset };
}
