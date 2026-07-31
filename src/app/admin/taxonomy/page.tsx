import type { Metadata } from "next";
import Link from "next/link";
import { getAdminBooks } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Taxonomy" };

export default async function TaxonomyPage() {
  const books = await getAdminBooks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Taxonomy</h1>
          <p className="text-sm text-muted-foreground">
            Books and chapters. Chapter codes are the permanent key PYQs link to.
          </p>
        </div>
        <Button render={<Link href="/admin/taxonomy/books/new" />} size="sm">
          New book
        </Button>
      </div>

      {books.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No books yet. Create the first one to start adding chapters.
          </p>
          <Button
            render={<Link href="/admin/taxonomy/books/new" />}
            className="mt-4"
            size="sm"
          >
            New book
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Chapters</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <Link
                    href={`/admin/taxonomy/books/${b.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {b.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{b.class.label}</Badge>
                </TableCell>
                <TableCell>{b.subject.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {b.chapters.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
