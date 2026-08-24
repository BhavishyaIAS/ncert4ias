#!/usr/bin/env node
/**
 * Palette guard for the Bhavishya redesign.
 *
 * The brand red is a single token. When it changes — and it will, once the real
 * logo file is sampled — every accessibility decision downstream of it has to be
 * re-derived, not re-guessed. This script does that derivation.
 *
 *   node scripts/check-palette.mjs              # check the committed palette
 *   node scripts/check-palette.mjs '#E31E24'    # try a candidate red
 *
 * It prints the WCAG AA verdict for every pair the design actually uses, and
 * exits non-zero if a pair that must pass doesn't — so it can gate CI later.
 */

const PALETTE = {
  red: "#E31E24", // brand. large text, surfaces, rules, the arc
  deep: "#9E1B1E", // oxblood. small red text on light grounds
  flare: "#F0453F", // oxblood's counterpart on dark grounds
  ink: "#141110", // near-black body text
  paper: "#FBF9F6", // off-white page ground
  slate: "#6B6560", // metadata neutral
  white: "#FFFFFF", // the only value that clears AA on a red fill
};

const AA_BODY = 4.5;
const AA_LARGE = 3.0; // >=24px, or >=18.66px bold

const srgb = (hex) => {
  const m = hex.replace("#", "").match(/../g);
  if (!m || m.length !== 3) throw new Error(`not a hex colour: ${hex}`);
  return m.map((x) => parseInt(x, 16) / 255);
};
const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const [r, g, b] = srgb(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const red = process.argv[2] ?? PALETTE.red;
const P = { ...PALETTE, red };

/** `body: true` means this pair carries small text and must clear 4.5. */
const PAIRS = [
  ["Ember on Paper", P.red, P.paper, false, "large text & surfaces only"],
  ["Oxblood on Paper", P.deep, P.paper, true, "all small red text on light"],
  ["White on Ember", P.white, P.red, true, "text on a red fill"],
  ["Ember on Ink", P.red, P.ink, false, "large text & surfaces on dark"],
  ["Flare on Ink", P.flare, P.ink, true, "all small red text on dark"],
  ["Ink on Paper", P.ink, P.paper, true, "body text"],
  ["Paper on Ink", P.paper, P.ink, true, "body text, dark theme"],
  ["Slate on Paper", P.slate, P.paper, true, "metadata, captions"],
  ["Ember edge on Paper", P.red, P.paper, false, "focus rings, rules"],
];

let failed = 0;
const rows = PAIRS.map(([name, fg, bg, mustPassBody, use]) => {
  const r = contrast(fg, bg);
  const body = r >= AA_BODY;
  const large = r >= AA_LARGE;
  if (mustPassBody && !body) failed++;
  if (!mustPassBody && !large) failed++;
  return {
    pair: name,
    ratio: r.toFixed(2),
    body: body ? "pass" : "FAIL",
    large: large ? "pass" : "FAIL",
    required: mustPassBody ? "body 4.5" : "large 3.0",
    use,
  };
});

console.log(`\n  brand red: ${red}${red !== PALETTE.red ? "  (candidate)" : ""}\n`);
console.table(rows);

if (contrast(red, P.paper) < AA_BODY) {
  console.log(
    "  NOTE  This red does not clear AA for body text on paper.\n" +
      "        That is expected and handled: it is never set below 24px as text.\n" +
      "        Oxblood carries small red text. Do not lighten the brand red to fix this.\n",
  );
}

if (failed) {
  console.error(`  ${failed} required pair(s) failed. The palette is not shippable.\n`);
  process.exit(1);
}
console.log("  All required pairs clear WCAG AA.\n");
