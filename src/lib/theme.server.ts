import "server-only";
import type { Theme } from "@/lib/theme";

/**
 * The theme for this request.
 *
 * The "bhavishya" redesign has been retired: the product ships the classic UI
 * only. This is the single chokepoint every server render goes through (the
 * root layout, the shared footer, and every `ThemedPage` route), so returning
 * "classic" here is what makes the whole app classic — no cookie, deploy flag,
 * or saved preference can select the redesign any more.
 */
export async function getTheme(): Promise<Theme> {
  return "classic";
}
