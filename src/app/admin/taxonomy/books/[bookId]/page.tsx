import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBook } from "@/lib/queries";
import { deleteBook, deleteChapter } from "../../actions";
import { BookForm } from "../../_components/BookForm";
import { ChapterForm } from "../../_components/ChapterForm";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Edit book" };

export default async function BookWorkspace({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const book = await getAdminBook(bookId);
  if (!book) notFound();

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/admin/taxonomy"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Taxonomy
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {book.title}
          </h1>
          <Badge variant="secondary">{book.class.label}</Badge>
          <Badge variant="secondary">{book.subject.name}</Badge>
        </div>
      </div>

      {/* Book meta */}
      <section className="max-w-xl space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Book details
        </h2>
        <BookForm mode="edit" book={book} />
        <form action={deleteBook}>
          <input type="hidden" name="id" value={book.id} />
          <ConfirmSubmit
            variant="outline"
            message={`Delete “${book.title}” and all its chapters? This cannot be undone.`}
          >
            Delete book
          </ConfirmSubmit>
        </form>
      </section>

      {/* Chapters */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Chapters ({book.chapters.length})
        </h2>

        {book.chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No chapters yet — add the first one below.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {book.chapters.map((ch) => (
              <li key={ch.id} className="p-4">
                <details>
                  <summary className="flex cursor-pointer list-none items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {ch.chapter_code}
                    </span>
                    <span className="font-medium">
                      {ch.chapter_number}. {ch.title}
                    </span>
                    <Badge
                      variant={ch.status === "published" ? "default" : "secondary"}
                    >
                      {ch.status}
                    </Badge>
                    {!ch.official_pdf_url && (
                      <Badge variant="outline">no PDF</Badge>
                    )}
                    <span className="ml-auto flex items-center gap-3">
                      <Link
                        href={`/admin/chapters/${ch.chapter_code}`}
                        className="text-xs font-medium underline-offset-4 hover:underline"
                      >
                        Author
                      </Link>
                      <Link
                        href={`/chapter/${ch.chapter_code}`}
                        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                      >
                        View
                      </Link>
                    </span>
                  </summary>

                  <div className="mt-4 space-y-4 border-t pt-4">
                    <ChapterForm
                      mode="edit"
                      bookId={book.id}
                      codePrefix={book.subject.code_prefix}
                      classNumber={book.class.number}
                      chapter={ch}
                    />
                    <form action={deleteChapter}>
                      <input type="hidden" name="id" value={ch.id} />
                      <input type="hidden" name="book_id" value={book.id} />
                      <ConfirmSubmit
                        variant="ghost"
                        message={`Delete chapter “${ch.title}”?`}
                      >
                        Delete chapter
                      </ConfirmSubmit>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Add chapter */}
      <section className="max-w-2xl space-y-4 rounded-lg border bg-muted/20 p-5">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Add a chapter
        </h2>
        <ChapterForm
          mode="create"
          bookId={book.id}
          codePrefix={book.subject.code_prefix}
          classNumber={book.class.number}
        />
      </section>

      <p className="text-xs text-muted-foreground">
        Tip: the Read tab shows the official NCERT PDF. Get the link from{" "}
        <a
          href="https://ncert.nic.in/textbook.php"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
        >
          ncert.nic.in
        </a>
        . Chapters stay in <em>draft</em> until you publish them.
      </p>
      <div>
        <Button
          render={<Link href="/admin/taxonomy" />}
          variant="ghost"
          size="sm"
        >
          ← Back to taxonomy
        </Button>
      </div>
    </div>
  );
}
