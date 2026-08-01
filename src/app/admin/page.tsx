import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [classes, subjects, gsTags] = await Promise.all([
    supabase.from("classes").select("id", { count: "exact", head: true }),
    supabase.from("subjects").select("*").order("order"),
    supabase.from("gs_tags").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Classes", value: classes.count ?? 0 },
    { label: "Subjects (enabled)", value: subjects.data?.filter((s) => s.enabled).length ?? 0 },
    { label: "GS tags", value: gsTags.count ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Content control room.
          </p>
        </div>
        <div className="flex gap-2">
          <Button render={<Link href="/admin/import" />} variant="outline" size="sm">
            Import chapters
          </Button>
          <Button render={<Link href="/admin/pyqs" />} variant="outline" size="sm">
            Upload PYQs
          </Button>
          <Button render={<Link href="/admin/taxonomy" />} size="sm">
            Manage taxonomy
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Seeded subjects
        </h2>
        <div className="flex flex-wrap gap-2">
          {subjects.data?.map((s) => (
            <Badge key={s.id} variant={s.enabled ? "default" : "secondary"}>
              {s.name} · {s.code_prefix}
            </Badge>
          ))}
          {!subjects.data?.length && (
            <p className="text-sm text-muted-foreground">
              No subjects yet — run the taxonomy seed (supabase/migrations).
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
