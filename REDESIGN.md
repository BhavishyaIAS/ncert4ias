# REDESIGN.md

The Bhavishya visual redesign ships as a **layer that can be switched off**, not a
replacement. The original UI is still in the repo, still working, and still reachable by
anyone at any time.

**Status: Phase 4 of 5 complete** (foundation, layout, homepage, subject system, browse,
search, and the chapter experience). Phase 5 — responsive/a11y/perf polish — is not done yet.

---

## How to fall back to `classic`

Three levels, fastest first.

### 1. User — the switch in the footer

Every page has a quiet **Classic view / New view** control in the footer. It writes a cookie
*and* `localStorage`, and the root layout reads the cookie server-side, so the choice
survives a reload with no flash of the wrong theme.

### 2. Deploy — an environment variable, no code push

| Variable | Effect | Overrides a user's own choice? |
| -------- | ------ | ------------------------------ |
| `DEFAULT_THEME=classic` | New visitors with no preference get classic. | No |
| `FORCE_THEME=classic` | **Break glass.** Everyone gets classic, including people who already opted in. | Yes |
| `NEXT_PUBLIC_DEFAULT_THEME=classic` | Same as `DEFAULT_THEME`, but baked in at build time. | No |

Use **`FORCE_THEME`** if the redesign is actually broken — `DEFAULT_THEME` alone only
redirects people who have no preference yet, and would strand everyone who already switched
to the new view.

`DEFAULT_THEME` and `FORCE_THEME` are plain server variables, read fresh on every request:
set one in the Vercel dashboard and the change is live immediately, with no rebuild.
`NEXT_PUBLIC_*` values are inlined into the bundle at build time, so that one needs a
redeploy to take effect — it exists because the brief named it, but prefer the other two.

Unset the variable to hand control back to readers.

### 3. Git — full revert

Commit **`1369c5f`** is the pre-redesign state.

```bash
git checkout 1369c5f            # inspect the original site
git revert <redesign commits>   # or undo the layer entirely
```

A local `pre-redesign` tag points at that commit. It is **not on the remote**: pushing it
failed with HTTP 403, because this session's credential can push branches but not tags. To
create it yourself:

```bash
git tag -a pre-redesign 1369c5f -m "Pre-redesign snapshot" && git push origin pre-redesign
```

---

## Files added

Nothing in this list existed before. None of it runs when the theme is `classic`, except
the footer and the theme plumbing.

| File | What it is |
| ---- | ---------- |
| `src/lib/theme.ts` | Theme names, cookie name, the build-time default. Shared by server and client. |
| `src/lib/theme.server.ts` | `getTheme()` — resolves `FORCE_THEME` → cookie → `DEFAULT_THEME`. Server only. |
| `src/app/theme-actions.ts` | Server action that persists the reader's choice to a cookie. |
| `src/app/bhavishya.css` | Every new token and class. All of it scoped under `[data-theme="bhavishya"]`. |
| `src/components/themed-page.tsx` | Picks which tree a route renders. |
| `src/components/theme-switch.tsx` | The footer switch. |
| `src/components/site-footer.tsx` | Footer, rendered in **both** themes. |
| `src/components/bhavishya/site-header.tsx` | Header for the new theme. |
| `src/components/bhavishya/nav-links.tsx` | Nav, with the current section marked in red. |
| `src/components/bhavishya/seal.tsx` | The bow-and-arrow mark. |
| `src/components/bhavishya/home.tsx` | Homepage for the new theme. |
| `src/lib/config/subject-themes.ts` | Per-subject token sets: pattern, motif, rationale. |
| `src/components/bhavishya/subject-texture.tsx` | The seven textures. Server-rendered SVG, no client JS. |
| `src/components/bhavishya/browse.tsx` | Class picker, subject picker, subject landing page. |
| `src/components/bhavishya/search.tsx` | Search. |
| `src/components/bhavishya/gs.tsx` | GS index and GS paper pages. |
| `src/components/bhavishya/crumbs.tsx` | Breadcrumb trail. |
| `src/components/bhavishya/chapter/spine-geometry.ts` | The arc's maths. Control points chosen so mark positions are exact. |
| `src/components/bhavishya/chapter/spine.tsx` | The trajectory spine: arc, rung marks, the landing. |
| `src/components/bhavishya/chapter/use-progress.ts` | Rung completion in `localStorage`, keyed by `chapter_code`. |
| `src/components/bhavishya/chapter/prelims.tsx` | MCQ practice and answer reveal. |
| `src/components/bhavishya/chapter/mains.tsx` | Mains questions and model answers. |
| `src/components/bhavishya/chapter/index.tsx` | The chapter shell — header, ladder, rung panels. |
| `scripts/check-palette.mjs` | Re-derives every contrast decision from the red token. Exits non-zero on failure. |
| `docs/redesign/phase-1-design-plan.md` | Palette, type, motion and subject rationale. |

## Files modified

Three, all additive — nothing was deleted or rewritten.

| File | Change |
| ---- | ------ |
| `src/app/layout.tsx` | Stamps `data-theme` on `<html>`; declares the four new fonts alongside the two existing ones; picks the header; renders the footer; adds the no-flash bootstrap script. |
| `src/app/page.tsx` | The existing component was **renamed in place** to `ClassicHome` — its body is untouched — and a two-line default export chooses between it and `BhavishyaHome`. |
| `src/app/browse/page.tsx`, `browse/[classNo]/page.tsx`, `browse/[classNo]/[subject]/page.tsx`, `search/page.tsx`, `gs/page.tsx`, `gs/[code]/page.tsx`, `chapter/[code]/page.tsx` | Same pattern: existing component renamed in place, new default export switches. No existing body was edited. |
| `REDESIGN.md`, `docs/`, `scripts/` | New files, listed above. |

**`src/app/globals.css` and `src/components/ui/` were not touched.** Verified with
`git diff`.

### The one deliberate change to `classic`

The footer is new, and it renders in the classic theme too. This is necessary: without it,
someone who switches to classic has no way back. It is a single bordered strip with a link
and the switch.

---

## How the theme layer works

```
request
  → proxy.ts (unchanged — Supabase session refresh)
  → app/layout.tsx  getTheme()  →  FORCE_THEME ?? cookie ?? DEFAULT_THEME
  → <html data-theme="classic|bhavishya">
  → header: BhavishyaHeader | SiteHeader
  → page:   <ThemedPage classic={…} bhavishya={…} />
```

Both branches of `ThemedPage` are passed as elements, so only the selected one ever renders.
The other is never invoked.

Adding the layer to a route is the same three steps every time — rename the existing
component, import, and switch:

```tsx
function ClassicThing(props) { /* the existing body, untouched */ }

export default function Thing(props) {
  return <ThemedPage classic={<ClassicThing {...props} />}
                     bhavishya={<BhavishyaThing {...props} />} />;
}
```

Routes still on classic in both themes: `/login`, `/signup`, the root
`error`/`loading`/`not-found` states, and all of `/admin`. Admin is intentionally staying
classic; the auth and root-state screens are Phase 5.

## The chapter experience

The trajectory spine is the one place this interface raises its voice. A red arc runs beside
the five rungs; completing a rung draws it forward, and the fifth lands the arrow in a
target.

**The geometry is exact, not approximate.** The arc is a cubic Bézier whose control points
have y-values `0, H/3, 2H/3, H`, which collapses the Bernstein form to `y(t) = H·t`. A rung
mark at `t = (i + 0.5)/5` therefore lands precisely on the centre of rung row `i` — no
measuring, no layout reads, no drift when the font, zoom or spine height changes. Verified:
**0.00px drift** between mark centres and row centres at both the 440px desktop spine and the
280px mobile one. `pathLength="1"` normalises the arc so the progress dash is just `n/5`,
correct on the first paint with no DOM measurement.

Progress lives in `localStorage`, keyed by `chapter_code` — there is no progress model in the
schema and the brief puts schema changes off-limits. The first paint is always "nothing
done", then the real state arrives; the arc animating from empty to where you left off is the
deliberate consequence, so you see your position before you have to think about it.
**Progress does not follow a reader between devices.** That needs a table and an RLS policy.

**Correctness without a second hue.** The palette is red, black and white, so green-for-right
is not available. Red marks the *correct* option — red means "the thing that matters"
everywhere else in the product — and a wrong pick is marked in ink: dashed border, struck
through, labelled "Your answer". Every state is stated in words as well as form, so nothing
depends on colour alone.

## The subject system

Seven subjects, one palette. No subject gets its own hue — identity comes from pattern, line
quality and motif label. Each texture carries **exactly one** red mark, because red means
"the active thing" everywhere else in the product and decoration does not get to break that.

| Subject | Motif | Pattern |
| ------- | ----- | ------- |
| History | Inscription | Chiselled rules, red margin spine |
| Polity | Blueprint | Construction grid, red dimension mark |
| Geography | Contour | Strata, one contour promoted |
| Economy | Ledger | Graph ruling, column gutter, red plot |
| Science | Orbital | Concentric shells, red nucleus |
| Art & Culture | Jaali | Pierced lattice, red rosette |
| Ecology & Environment | Venation | Branching veins, red midrib |

**Adding an eighth subject is config only.** Verified by enabling Sociology: two changed
lines in `subjects.ts` and a five-line entry in `subject-themes.ts` — **seven lines total**,
no component touched — and it rendered with its own motif. Then reverted. A subject that
wants a brand-new pattern adds one function to `subject-texture.tsx`; reusing an existing
pattern needs no new code at all. Anything missing from the map falls back to
`DEFAULT_SUBJECT_THEME` rather than breaking.

---

## What was verified

- `next build` succeeds; all 22 routes present and typechecking clean.
- Every route returns the same HTTP status in both themes, including 404.
- **Classic body markup is byte-identical to the pre-redesign build** on `/`, `/browse`,
  `/browse/8`, `/browse/8/history`, `/chapter/H-8-3`, `/gs`, `/gs/GS-I`. The three routes
  that differ (`/search`, `/login`, `/signup`) differ only in React-generated element ids
  and Server Action hashes, which change whenever the bundle changes.
- Every selector in `bhavishya.css` is scoped under `[data-theme="bhavishya"]` — checked
  mechanically, not by eye.
- The switch round-trips, and after a reload the server-rendered HTML already carries the
  chosen theme, so there is no flash.
- `FORCE_THEME` and `DEFAULT_THEME` behave as described above, without a rebuild.
- No horizontal overflow at 360px in either theme.

## Known issues

- **Classic renders body text in Times New Roman, and always has.** `globals.css` maps
  `--font-sans: var(--font-sans)` — a self-reference that resolves to nothing, so
  `html { font-sans }` falls back. `--font-geist-sans` is defined and Geist loads fine; only
  the mapping is wrong. This predates the redesign and is **not fixed here**, because
  correcting it would change how classic looks and classic is meant to stay as it was. One
  line, if you want it: `--font-sans: var(--font-geist-sans);`
- Chapter progress (Phase 4) will use `localStorage`, so it will not follow a reader between
  devices. Cross-device progress needs a table and an RLS policy — a schema change.
- The brand red `#E31E24` is matched by eye from the logo in the brief; the logo file never
  reached the repo. Run `node scripts/check-palette.mjs '#YOURRED'` after sampling it.
