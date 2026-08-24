import Link from "next/link";
import { getTheme } from "@/lib/theme.server";
import { ThemeSwitch } from "@/components/theme-switch";

/**
 * Shared footer. Renders in both themes, because the theme switch has to be
 * reachable from *either* side — a reader who flips to classic must be able to
 * come back. This is the one place the redesign adds something to the classic
 * UI; see REDESIGN.md.
 */
export async function SiteFooter() {
  const theme = await getTheme();
  const bhavishya = theme === "bhavishya";

  if (bhavishya) {
    return (
      <footer className="bh-footer mt-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-6 px-6 py-10">
          <div className="flex flex-col gap-1">
            <span className="bh-eyebrow">NCERT4IAS</span>
            <span className="bh-note">
              Read, Revise, Prelims, Mains, PYQs — one chapter at a time.
            </span>
          </div>
          <div className="flex flex-col items-start gap-2">
            <span className="bh-eyebrow">Appearance</span>
            <ThemeSwitch theme={theme} />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <p className="text-sm text-muted-foreground">
          NCERT4IAS —{" "}
          <Link href="/browse" className="underline-offset-4 hover:underline">
            browse chapters
          </Link>
        </p>
        <ThemeSwitch theme={theme} />
      </div>
    </footer>
  );
}
