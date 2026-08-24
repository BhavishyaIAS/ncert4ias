import "server-only";
import { cookies } from "next/headers";
import { THEME_COOKIE, defaultTheme, isTheme, type Theme } from "@/lib/theme";

/**
 * The deploy-level kill switch, resolved server-side at request time.
 *
 * NEXT_PUBLIC_* values are inlined into the bundle at BUILD time, so changing
 * NEXT_PUBLIC_DEFAULT_THEME alone would need a rebuild before it took effect.
 * DEFAULT_THEME is a plain server variable and is therefore read fresh on every
 * request — set that one and the rollback is immediate, with no rebuild and no
 * code push. NEXT_PUBLIC_DEFAULT_THEME stays supported as the fallback.
 */
function deployDefault(): Theme {
  const runtime = process.env.DEFAULT_THEME;
  return isTheme(runtime) ? runtime : defaultTheme();
}

/**
 * The theme for this request. Reads the cookie, falls back to the deploy-level
 * default. Called by the root layout, and by ThemedPage on each themed route.
 *
 * Lives apart from lib/theme.ts because that module holds the constants and the
 * client-side switch needs them — anything importing next/headers has to stay
 * out of the client bundle.
 */
export async function getTheme(): Promise<Theme> {
  // FORCE_THEME beats everything, including a reader's own choice. This is the
  // break-glass lever: DEFAULT_THEME only redirects people who have no
  // preference yet, so on its own it would leave everyone who already opted in
  // stranded on a broken redesign. Set FORCE_THEME=classic to pull all of them
  // back at once, then unset it once the problem is fixed.
  const forced = process.env.FORCE_THEME;
  if (isTheme(forced)) return forced;

  const store = await cookies();
  const fromCookie = store.get(THEME_COOKIE)?.value;
  return isTheme(fromCookie) ? fromCookie : deployDefault();
}
