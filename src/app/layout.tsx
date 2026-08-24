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
   own origin, so no render-blocking call to Google and no layout shift. The
   browser only fetches a file when a glyph actually needs it, so classic pays
   nothing for these being declared. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexDevanagari = IBM_Plex_Sans_Devanagari({
  variable: "--font-plex-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
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
 * Reconciles localStorage with the cookie. The server has already stamped the
 * correct theme from the cookie, so this does nothing in the normal case — it
 * only matters when the cookie was cleared but localStorage still remembers.
 * Runs before paint, so that recovery is also flash-free.
 */
const THEME_BOOTSTRAP = `
(function(){try{
  var c=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);
  if(c)return;
  var s=localStorage.getItem("${THEME_COOKIE}");
  if(s!=="classic"&&s!=="bhavishya")return;
  document.documentElement.dataset.theme=s;
  document.cookie="${THEME_COOKIE}="+s+";path=/;max-age=${THEME_COOKIE_MAX_AGE};samesite=lax";
}catch(e){}})();
`;

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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${plexSans.variable} ${plexDevanagari.variable} ${plexMono.variable} h-full antialiased`}
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
