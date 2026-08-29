"use client";

import { LADDER_RUNGS, type LadderRungKey } from "@/lib/config/taxonomy";
import {
  SPINE_W,
  SPINE_H,
  RUNG_COUNT,
  SPINE_PATH,
  markPoint,
  TARGET,
} from "./spine-geometry";

/**
 * The trajectory spine — the one place this interface raises its voice.
 *
 * The arc draws forward as rungs complete and the arrow lands in a target on
 * the last rung. Everything else in the redesign is kept quiet so this can land.
 *
 * The arc is animated on stroke-dashoffset. Being precise about the brief's
 * "transforms and opacity only": dashoffset is not a transform and is not
 * compositor-only, but it is also not a layout property — it triggers no
 * reflow, and the repaint is one 2.5px stroke inside a 48×440 box. That is the
 * right trade for an animation that fires once per rung.
 *
 * pathLength="1" normalises the path so the dash maths is just n/5 — no DOM
 * measurement, so it is correct on the very first paint.
 */
export function TrajectorySpine({
  done,
  active,
  available,
  onSelect,
}: {
  done: Set<LadderRungKey>;
  active: LadderRungKey;
  available: Record<LadderRungKey, boolean>;
  onSelect: (rung: LadderRungKey) => void;
}) {
  const count = LADDER_RUNGS.filter((r) => done.has(r.key)).length;
  const landed = count === RUNG_COUNT;

  return (
    <div className="bh-spine">
      <svg
        className="bh-spine-arc"
        viewBox={`0 0 ${SPINE_W} ${SPINE_H}`}
        preserveAspectRatio="xMinYMin meet"
        aria-hidden="true"
        focusable="false"
      >
        <path className="bh-arc-track" d={SPINE_PATH} pathLength={1} />
        <path
          className="bh-arc-live"
          d={SPINE_PATH}
          pathLength={1}
          style={{ strokeDashoffset: 1 - count / RUNG_COUNT }}
        />

        {LADDER_RUNGS.map((rung, i) => {
          const p = markPoint(i);
          const isDone = done.has(rung.key);
          const isActive = rung.key === active;
          return (
            <circle
              key={rung.key}
              cx={p.x}
              cy={p.y}
              r={isActive ? 7.5 : 6}
              className={[
                "bh-arc-mark",
                isDone ? "is-done" : "",
                isActive ? "is-active" : "",
              ].join(" ")}
            />
          );
        })}

        {/* The landing. A target, not a tick — the logo is a bow and arrow. */}
        <g className={`bh-arc-target ${landed ? "is-landed" : ""}`}>
          <circle cx={TARGET.x} cy={TARGET.y} r={12} className="bh-target-ring" />
          <circle cx={TARGET.x} cy={TARGET.y} r={6.5} className="bh-target-ring" />
          <circle cx={TARGET.x} cy={TARGET.y} r={2.5} className="bh-target-eye" />
        </g>
      </svg>

      <ol className="bh-rung-list">
        {LADDER_RUNGS.map((rung, i) => {
          const isDone = done.has(rung.key);
          const isActive = rung.key === active;
          const ready = available[rung.key];
          return (
            <li key={rung.key}>
              <button
                type="button"
                onClick={() => onSelect(rung.key)}
                aria-current={isActive ? "step" : undefined}
                className={[
                  "bh-rung-btn",
                  isActive ? "is-active" : "",
                  isDone ? "is-done" : "",
                  ready ? "" : "is-empty",
                ].join(" ")}
              >
                <span className="bh-rung-btn-n">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="bh-rung-btn-l">{rung.label}</span>
                <span className="bh-rung-btn-s">
                  {!ready ? "Not ready yet" : isDone ? "Done" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
