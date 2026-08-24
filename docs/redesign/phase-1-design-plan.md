# Phase 1 — Design plan

Visual redesign of NCERT4IAS, derived from the Bhavishya logo.
Interactive version of this document: **The Bhavishya Trajectory** (published artifact).

Status: **plan only.** No production code has been written. Nothing in `src/` has changed.

---

## Revert anchors

| Level | Mechanism |
| ----- | --------- |
| Git | Commit `1369c5f` is the pre-redesign state. A local `pre-redesign` tag points at it; GitHub rejected the tag push with HTTP 403 (this session's credential can push branches, not tags), so the SHA is the anchor until the tag is created locally. |
| Env var | `NEXT_PUBLIC_DEFAULT_THEME` — planned, Phase 2. |
| User | "Classic view" / "New view" switch in the footer — planned, Phase 2. |

---

## 1. Palette

Six values. The rule that makes them work is behavioural, not chromatic:
**red marks only what is active, complete, or next.** If red appears on a screen where
nothing is active, that is a bug. On a chapter page the quantity of red is a direct
readout of progress.

| Token | Hex | Role |
| ----- | --- | ---- |
| Ember | `#E31E24` | Brand red. Large text (≥24px), surfaces, rules, the arc, active marks. |
| Oxblood | `#9E1B1E` | Small red text on light grounds. Hover and pressed weight. |
| Flare | `#F0453F` | Oxblood's counterpart on dark grounds. Small red text only. |
| Ink | `#141110` | Body text. Near-black with a trace of warmth, never pure `#000`. |
| Paper | `#FBF9F6` | Page ground. Off-white so the red doesn't buzz. |
| Slate | `#6B6560` | Metadata, captions, chapter codes. Warm-biased toward the red. |

### What the contrast maths decided

Run `node scripts/check-palette.mjs` to reproduce. It exits non-zero if a pair that must
pass doesn't, so it can gate CI later.

- **Ember on Paper is 4.46:1** — it fails AA body text by 0.04. Handled exactly as the brief
  demands: the brand red is never set below 24px as text. It becomes a surface, a 3px rule,
  a filled mark, a large numeral. **Oxblood carries every small red word.** The brand red is
  not lightened.
- **White on Ember is 4.69:1, Paper on Ember is 4.46:1.** Red fills therefore take *pure
  white* text, never Paper.
- On dark grounds Ember drops to 4.01:1, so the same large-text-only rule applies and
  **Flare** (5.04:1) carries small red text.

> The red itself is provisional. The logo never reached the repo, so `#E31E24` is matched by
> eye from the brief's attachment. It is a single token; drop the real file at
> `public/bhavishya-logo.png` and the palette re-derives from one line.

---

## 2. Type

Three faces, all self-hosted through `next/font` — downloaded at build time and served from
our own origin, so no render-blocking Google call and no layout shift.

- **Fraunces** — display. Chapter titles, section heads, hero. A variable serif with an
  `opsz` axis and a `WONK` axis that swaps in canted, irregular letterforms. At
  `opsz 144, WONK 1` it reads chiselled, which is the inscription idea doing real work
  rather than a texture pasted behind it. The variable axes are the functional argument:
  one file covers a 74px hero and a 20px sub-head without either looking wrong.
- **IBM Plex Sans** (+ **Plex Sans Devanagari**) — body. Read for forty minutes on a phone,
  so legibility beats character. Large x-height, open apertures, unambiguous `I l 1`. The
  Devanagari sibling is a real family, so transliterated NCERT terms stay in voice instead
  of dropping to a system face mid-sentence.
- **IBM Plex Mono** — utility. Chapter codes, question numbers, PYQ years, rung numerals.
  Same superfamily as the body face. The site already sets `chapter_code` in mono; this
  makes it deliberate.

Rejected: **Inter / Geist** (ruled out by the brief, and rightly — the default that looks
untouched), **Playfair** (the reflex pairing), **Rozha One** (genuinely tempting — a
Latin+Devanagari display serif from an Indian foundry — but single-weight and far too
high-contrast to hold a rung label at 14px).

### Scale

| Role | Face | Size | Weight | Line height | Tracking |
| ---- | ---- | ---- | ------ | ----------- | -------- |
| Hero | Fraunces | 42 → 74px | 900 | 0.94 | −0.025em |
| Chapter title | Fraunces | 32 → 54px | 900 | 0.98 | −0.028em |
| Section head | Fraunces | 28 → 40px | 600 | 1.05 | −0.018em |
| Sub-head | Fraunces | 20px | 600 | 1.25 | −0.01em |
| Rung label | Fraunces | 18px | 600 | 1.2 | −0.01em |
| Body | Plex Sans | 17px | 400 | 1.72 | 0 |
| Body small | Plex Sans | 15px | 400 | 1.6 | 0 |
| Metadata | Plex Sans | 14px | 400 | 1.5 | 0 |
| Eyebrow / label | Plex Mono | 11.5px | 500 | 1.4 | 0.18em |
| Rung numeral | Plex Mono | 11px | 500 | 1.4 | 0.16em |
| Data / code | Plex Mono | 13px | 400 | 1.5 | 0.02em |

---

## 3. Signature — the trajectory spine

A red arc runs the length of the chapter page. The five rungs sit on it as marks.
Completing a rung draws the arc forward; completing all five lands the arrowhead in a
target. This is the one place the interface raises its voice.

**How it's drawn.** A single SVG path animated on `stroke-dashoffset`. Being precise about
the brief's "transforms and opacity only": `stroke-dashoffset` is not a transform and is not
compositor-only — it repaints. It is also not a *layout* property, so it triggers no reflow,
and the repaint is one 2.5px stroke inside a ~150×380 box. That is the right trade for a
once-per-rung animation. The pure-transform alternative (masking the arc with a scaled rect)
only works while the arc stays monotonic in Y and buys nothing measurable here.

**Where progress lives.** There is no progress model in the product today — no table, no
column, nothing — and the brief puts schema changes off-limits. So rung completion is
`localStorage`, keyed by `chapter_code`: per-device, no migration, no auth coupling, and it
degrades to an undrawn arc rather than an error. **Known limitation:** progress will not
follow a user between devices. Making it cross-device is a schema change and therefore a
product decision, not a design one.

The arrow appears exactly twice in the whole interface: the header seal, and the arrowhead
that lands at the end of a chapter. It is not scattered.

---

## 4. Subject system

No subject gets its own hue — that constraint is what keeps this one product instead of
seven. Identity is carried by pattern, line quality and heading treatment. Each subject is a
token set (pattern, accent rule, heading rule) keyed by the `slug` that already exists in
`src/lib/config/subjects.ts`. Every texture carries **exactly one** red element, so the
"red marks the active thing" rule holds inside the decoration too.

| Subject | Vocabulary | Texture |
| ------- | ---------- | ------- |
| History | Inscription | Chiselled horizontal rules; a chronological spine in the margin |
| Polity | Blueprint | Construction grid with a drawn dimension mark |
| Geography | Contour | Topographic strata, one contour promoted to red |
| Economy | Ledger | Graph ruling, a column gutter, one hairline plot |
| Science | Orbital | Concentric shells, mono annotation, a red nucleus |
| Art & Culture | Jaali | A pierced lattice frame that never crowds the text |
| Ecology | Venation | Branching leaf and watershed lines — the one place organic curves are allowed |

An eighth subject is a config entry: Sociology already sits registered and disabled, so
onboarding it means one token set and flipping `enabled`.

---

## 5. Motion

**Earned** — chapter entry resolves title, spine and rungs in one 420ms sequence; each rung
reveals once on scroll (opacity + 8px rise); press states on anything tappable (120ms,
transform only); the arc drawing forward on rung completion (620ms); the landing, once, on
the fifth rung.

**Cut** — ambient particles, parallax, blur-in on paragraphs (it delays reading, which is
the product), staggered fades on lists that are merely lists, route transitions.

`prefers-reduced-motion: reduce` is a first-class path, not a switch-off: every state change
still happens and is still legible — the arc renders at final length, the rung fills, the
target is present. What is removed is duration. To be tested, not assumed.

---

## 6. Self-review

The brief asked me to hunt for the average answer in my own plan. Four things went:

- **Cream `#F4F1EA` with a terracotta accent** — my first instinct for "NCERT, heritage,
  India", and the single most recognisable AI-design cliché. It also violates the brief
  outright: terracotta is a second hue. Killed.
- **Numbered markers as decoration** — kept, but confined. `01`–`05` is real information for
  the rungs because `LADDER_RUNGS` is an ordered sequence and the order *is* the product.
  It appears on the rungs and nowhere else.
- **Arrows and seals everywhere** — the reflex is arrow bullets, seal badges, a bow divider.
  That spends the idea until it means nothing. Two appearances only.
- **Subject colours** — never on the table given the constraint, but worth naming: the
  moment Geography goes blue and Ecology goes green, this stops being one product.

---

## 7. Open decisions

1. **The logo file** — needed to sample the real red.
2. **File policy** — proceeding on the switch-wrapper approach: each page's existing
   component is renamed in place, nothing deleted, and a two-line default export picks
   `classic` or `bhavishya`. Affects `app/page.tsx`, `browse/` ×3, `chapter/[code]/`,
   `gs/` ×2, `search/`, `(auth)/` ×2, plus `layout.tsx` and the three root states. Admin
   stays classic-only.
3. **Cross-device progress** — `localStorage` means progress doesn't follow a user between
   devices. The fix is a table and an RLS policy, which the brief puts off-limits.
