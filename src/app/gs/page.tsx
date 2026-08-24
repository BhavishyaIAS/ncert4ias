import type { Metadata } from "next";
import Link from "next/link";
import { getGsTags } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedPage } from "@/components/themed-page";
import { BhavishyaGsIndex } from "@/components/bhavishya/gs";

export const metadata: Metadata = { title: "Browse by GS subject" };

async function ClassicGsIndexPage() {
  const tags = await getGsTags();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Browse by GS subject</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The way aspirants actually think — jump to chapters by General Studies
        paper.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {tags.map((t) => (
          <Link key={t.id} href={`/gs/${t.code}`}>
            <Card className="h-full transition-colors hover:border-foreground/30">
              <CardHeader>
                <CardTitle className="text-lg">{t.label}</CardTitle>
              </CardHeader>
              {t.note && (
                <CardContent className="text-sm text-muted-foreground">
                  {t.note}
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

async function BhavishyaGsIndexPage() {
  const tags = await getGsTags();
  return <BhavishyaGsIndex tags={tags} />;
}

export default function GsIndexPage() {
  return (
    <ThemedPage
      classic={<ClassicGsIndexPage />}
      bhavishya={<BhavishyaGsIndexPage />}
    />
  );
}
