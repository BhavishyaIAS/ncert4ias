import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CLASSES } from "@/lib/config/taxonomy";
import { getSubjectsForClass } from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemedPage } from "@/components/themed-page";
import { BhavishyaClass } from "@/components/bhavishya/browse";

export const metadata: Metadata = { title: "Browse subjects" };

function parseClassNo(value: string): number | null {
  const n = Number(value);
  return (CLASSES as readonly number[]).includes(n) ? n : null;
}

async function ClassicClassPage({
  params,
}: {
  params: Promise<{ classNo: string }>;
}) {
  const { classNo } = await params;
  const n = parseClassNo(classNo);
  if (n === null) notFound();

  const subjects = await getSubjectsForClass(n);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <nav className="text-sm text-muted-foreground">
        <Link href="/browse" className="underline-offset-4 hover:underline">
          Browse
        </Link>{" "}
        / Class {n}
      </nav>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Class {n} · Subjects
      </h1>

      {subjects.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No published books for Class {n} yet. Check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => (
            <Link key={s.id} href={`/browse/${n}/${s.slug}`}>
              <Card className="h-full transition-colors hover:border-foreground/30">
                <CardHeader>
                  <CardTitle className="text-lg">{s.name}</CardTitle>
                </CardHeader>
                {s.ncert_name && (
                  <CardContent className="text-sm text-muted-foreground">
                    {s.ncert_name}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

async function BhavishyaClassPage({
  params,
}: {
  params: Promise<{ classNo: string }>;
}) {
  const { classNo } = await params;
  const n = parseClassNo(classNo);
  if (n === null) notFound();
  const subjects = await getSubjectsForClass(n);
  return <BhavishyaClass classNo={n} subjects={subjects} />;
}

export default function ClassPage(props: {
  params: Promise<{ classNo: string }>;
}) {
  return (
    <ThemedPage
      classic={<ClassicClassPage {...props} />}
      bhavishya={<BhavishyaClassPage {...props} />}
    />
  );
}
