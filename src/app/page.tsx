import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LADDER_RUNGS } from "@/lib/config/taxonomy";
import { ENABLED_SUBJECTS } from "@/lib/config/subjects";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <Badge variant="secondary" className="mb-5">
            Classes 6–12 · UPSC Civil Services
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            The NCERTs, turned into a UPSC prep engine.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Every NCERT chapter becomes one unit that walks an aspirant up a
            five-rung ladder — from reading the source, to seeing the actual UPSC
            questions that came from it.
          </p>
          <div className="mt-8">
            <Button render={<Link href="/browse" />} size="lg">
              Browse chapters
            </Button>
          </div>
        </div>
      </section>

      {/* The five-rung ladder */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          The five-rung ladder
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LADDER_RUNGS.map((rung, i) => (
            <li key={rung.key}>
              <Card className="h-full">
                <CardHeader>
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">
                    Rung {i + 1}
                  </div>
                  <CardTitle className="text-lg">{rung.label}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{rung.tagline}</p>
                  <p className="mt-2 text-xs italic">{rung.forWho}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* MVP subjects */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Subjects in this release
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ENABLED_SUBJECTS.map((subject) => (
            <Card key={subject.slug} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{subject.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {subject.blurb}
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          More subjects are on the roadmap — the platform is built so adding one
          is a configuration change, not a rewrite.
        </p>
      </section>
    </main>
  );
}
