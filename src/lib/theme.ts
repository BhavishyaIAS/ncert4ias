/**
 * The redesign ships as a *layer*, not a replacement. Two themes coexist:
 *
 *   classic    — the original UI, untouched. Every existing component and every
 *                existing class keeps working exactly as it did.
 *   bhavishya  — the new visual identity, scoped entirely under
 *                [data-theme="bhavishya"] in src/app/bhavishya.css.
 *
 * The active theme is stamped on <html> by the root layout, server-side, so the
 * first paint is already correct — no flash of the wrong theme.
 *
 * Three levels of fallback, in order of how quickly they can be reached:
 *   1. user   — the "Classic view" switch in the footer (cookie + localStorage)
 *   2. deploy — NEXT_PUBLIC_DEFAULT_THEME, changeable from the Vercel dashboard
 *               with no code push
 *   3. git    — see REDESIGN.md
 */

export const THEMES = ["classic", "bhavishya"] as const;
export type Theme = (typeof THEMES)[number];

/** Cookie name. Also read by the inline script that keeps localStorage in sync. */
export const THEME_COOKIE = "n4i-theme";

/** One year. The choice should outlive a study season. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * The deploy-level default, for visitors with no cookie yet. Set
 * NEXT_PUBLIC_DEFAULT_THEME=classic in the Vercel dashboard to pull every new
 * visitor back to the old UI without shipping code.
 */
export function defaultTheme(): Theme {
  const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_THEME;
  return isTheme(fromEnv) ? fromEnv : "classic";
}
