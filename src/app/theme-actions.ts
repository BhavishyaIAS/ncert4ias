"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, isTheme } from "@/lib/theme";

/**
 * Persist the reader's theme choice. Called by the footer switch.
 *
 * The cookie is what the root layout reads on the next request, which is what
 * makes the choice survive a reload with no flash. It is deliberately not
 * httpOnly: the inline bootstrap script reads it to keep localStorage in sync,
 * and it carries no security meaning.
 */
export async function setTheme(value: string): Promise<void> {
  if (!isTheme(value)) return;

  const store = await cookies();
  store.set(THEME_COOKIE, value, {
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: "lax",
  });

  // Every route renders the theme, so the whole tree needs re-rendering.
  revalidatePath("/", "layout");
}
