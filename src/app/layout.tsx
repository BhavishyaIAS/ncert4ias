import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Fraunces,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Devanagari,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";
import "./bhavishya.css";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BhavishyaHeader } from "@/components/bhavishya/site-header";
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE } from "@/lib/theme";
import { getTheme } from "@/lib/theme.server";

/* Classic keeps its original faces, untouched. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* Bhavishya. Self-hosted by next/font — downloaded at build, served from our
   own origin, so no render-blocking call to Google and no layout shift.

   next/font emits its preload links from the MODULE IMPORT, not from whichever
   className a render happens to use — so declaring these made classic download
   399KB of fonts it never renders, and gating the className did not help.
   preload:false is what actually stops it: the @font-face stays in the CSS and
   the browser fetches a file only when a glyph needs that family. Classic then
   fetches none of them. Bhavishya fetches them on first paint instead of via a
   preload hint, which display:"swap" already covers — text is readable
   immediately in the fallback and swaps when the face lands. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
  preload: false,
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

const plexDevanagari = IBM_Plex_Sans_Devanagari({
  variable: "--font-plex-deva",
  subsets: ["devanagari"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "NCERT4IAS — NCERTs, turned into a UPSC prep engine",
    template: "%s · NCERT4IAS",
  },
  description:
    "Every NCERT chapter (Classes 6–12) as a five-rung UPSC ladder: Read → Revise → Prelims → Mains → PYQs.",
};

/**
 * The redesign has been retired, so this migrates anyone still carrying a saved
 * "bhavishya" preference back to classic — before first paint, so a returning
 * reader never sees a flash of the old theme applied over classic markup.
 */
const THEME_BOOTSTRAP = `
(function(){try{
  document.documentElement.dataset.theme="classic";
  localStorage.setItem("${THEME_COOKIE}","classic");
  document.cookie="${THEME_COOKIE}=classic;path=/;max-age=${THEME_COOKIE_MAX_AGE};samesite=lax";
}catch(e){}})();
`;

/** Only the active theme's families, so neither theme pays for the other's. */
function themeFonts(theme: string) {
  return theme === "bhavishya"
    ? `${fraunces.variable} ${plexSans.variable} ${plexDevanagari.variable} ${plexMono.variable}`
    : `${geistSans.variable} ${geistMono.variable}`;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${themeFonts(theme)} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="flex min-h-full flex-col">
        {theme === "bhavishya" ? <BhavishyaHeader /> : <SiteHeader />}
        {children}
        <SiteFooter />
        <Toaster />
      </body>
    </html>
  );
}
