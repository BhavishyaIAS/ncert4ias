import type { Metadata } from "next";
import Link from "next/link";
import { getClassesAndSubjects } from "@/lib/queries";
import { BookForm } from "../../_components/BookForm";

export const metadata: Metadata = { title: "New book" };

export default async function NewBookPage() {
  const { classes, subjects } = await getClassesAndSubjects();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/admin/taxonomy"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Taxonomy
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New book</h1>
        <p className="text-sm text-muted-foreground">
          A book belongs to one class + subject, e.g. Class 8 · History · “Our
          Pasts III”.
        </p>
      </div>
      <BookForm mode="create" classes={classes} subjects={subjects} />
    </div>
  );
}
