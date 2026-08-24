"use client";

import { useTransition } from "react";
import { setTheme } from "@/app/theme-actions";
import {
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  type Theme,
} from "@/lib/theme";

/**
 * The escape hatch. Lets a reader flip between the original UI and the redesign
 * and see the old site, intact.
 *
 * Three things happen on click, in this order:
 *   1. <html data-theme> flips immediately, so the change is instant.
 *   2. localStorage records it, so it survives a cleared cookie.
 *   3. A server action writes the cookie, so the *next* request renders the
 *      right theme server-side and there is no flash on reload.
 */
export function ThemeSwitch({ theme }: { theme: Theme }) {
  const [pending, startTransition] = useTransition();

  function choose(next: Theme) {
    if (next === theme) return;

    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_COOKIE, next);
    } catch {
      // Private mode, or storage disabled. The cookie still carries the choice.
    }
    document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=${THEME_COOKIE_MAX_AGE};samesite=lax`;

    startTransition(() => setTheme(next));
  }

  const bhavishya = theme === "bhavishya";

  return (
    <div
      className={
        bhavishya
          ? "bh-switch"
          : "inline-flex items-center rounded-md border p-[2px]"
      }
      role="group"
      aria-label="Site appearance"
    >
      <Option
        label="Classic view"
        active={theme === "classic"}
        bhavishya={bhavishya}
        pending={pending}
        onSelect={() => choose("classic")}
      />
      <Option
        label="New view"
        active={theme === "bhavishya"}
        bhavishya={bhavishya}
        pending={pending}
        onSelect={() => choose("bhavishya")}
      />
    </div>
  );
}

function Option({
  label,
  active,
  bhavishya,
  pending,
  onSelect,
}: {
  label: string;
  active: boolean;
  bhavishya: boolean;
  pending: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={pending}
      onClick={onSelect}
      className={
        bhavishya
          ? undefined
          : [
              "rounded px-3 py-1.5 text-xs transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")
      }
    >
      {label}
    </button>
  );
}
