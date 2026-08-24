/**
 * The trajectory spine's geometry.
 *
 * The arc is one cubic Bézier. Its control points are chosen so that the y
 * coordinate is EXACTLY linear in t: with y-values 0, H/3, 2H/3, H the
 * Bernstein form collapses to y(t) = H·t. That matters because it means a rung
 * mark at t = (i + 0.5) / 5 lands exactly on the centre of rung row i, with no
 * measuring, no layout reads, and no drift when the font or zoom changes.
 *
 * The x coordinates bow the arc leftward and return it to centre, so the line
 * reads as a flight path rather than a progress bar.
 */

export const SPINE_W = 48;
export const SPINE_H = 440;
export const RUNG_COUNT = 5;
/** Each rung row is this tall, so row centres are at ROW_H * (i + 0.5). */
export const ROW_H = SPINE_H / RUNG_COUNT; // 88

const P0 = { x: 24, y: 0 };
const P1 = { x: 5, y: SPINE_H / 3 };
const P2 = { x: 5, y: (SPINE_H * 2) / 3 };
const P3 = { x: 24, y: SPINE_H };

export const SPINE_PATH = `M${P0.x} ${P0.y} C ${P1.x} ${P1.y}, ${P2.x} ${P2.y}, ${P3.x} ${P3.y}`;

function bezier(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** Where rung `i` sits on the arc. y is exact by construction. */
export function markPoint(i: number) {
  const t = (i + 0.5) / RUNG_COUNT;
  return {
    x: bezier(P0.x, P1.x, P2.x, P3.x, t),
    y: SPINE_H * t,
  };
}

/** The point the arrow lands on when every rung is done. */
export const TARGET = { x: P3.x, y: SPINE_H };
