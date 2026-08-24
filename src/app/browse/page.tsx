import type { Metadata } from "next";
import Link from "next/link";
import { CLASSES } from "@/lib/config/taxonomy";
import { Card, CardContent } from "@/components/ui/card";
import { ThemedPage } from "@/components/themed-page";
import { BhavishyaBrowse } from "@/components/bhavishya/browse";

export const metadata: Metadata = { title: "Browse by class" };

function ClassicBrowsePage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Browse by class</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a class, then a subject, then a chapter.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {CLASSES.map((n) => (
          <Link key={n} href={`/browse/${n}`}>
            <Card className="transition-colors hover:border-foreground/30">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Class
                </span>
                <span className="text-3xl font-semibold tabular-nums">{n}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <ThemedPage classic={<ClassicBrowsePage />} bhavishya={<BhavishyaBrowse />} />
  );
}
