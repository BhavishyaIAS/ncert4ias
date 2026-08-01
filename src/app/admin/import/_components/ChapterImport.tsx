"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import {
  importChapters,
  type RawChapterRow,
  type ImportResult,
} from "@/app/admin/import/actions";
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
import { toast } from "sonner";

const HEADERS = [
  "class_number",
  "subject_slug",
  "book_title",
  "book_order",
  "ncert_code",
  "chapter_number",
  "chapter_title",
  "official_pdf_url",
  "status",
];

function normalize(obj: Record<string, unknown>): RawChapterRow {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    o[k.trim().toLowerCase().replace(/\s+/g, "_")] = v;
  }
  return o as RawChapterRow;
}

export function ChapterImport() {
  const [rows, setRows] = useState<RawChapterRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      const parsed = json.map(normalize).filter((r) => r.chapter_title || r.book_title);
      setRows(parsed);
      setFileName(file.name);
      toast.success(`Parsed ${parsed.length} row(s).`);
    } catch {
      toast.error("Could not read that file. Use the .xlsx template.");
    }
  }

  function downloadTemplate() {
    const example = [
      HEADERS,
      [8, "history", "Our Pasts III", 1, "hess2", 1, "How, When and Where", "", "published"],
      [8, "history", "Our Pasts III", 1, "hess2", 2, "From Trade to Territory", "", "published"],
      [11, "geography", "India: Physical Environment", 2, "kegy1", 1, "India – Location", "", "published"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(example);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chapters");
    XLSX.writeFile(wb, "ncert4ias-chapter-template.xlsx");
  }

  function submit() {
    startTransition(async () => {
      const res = await importChapters(rows);
      setResult(res);
      toast.success(
        `Imported: ${res.summary.chapters} chapters, ${res.summary.books} books, ${res.summary.failed} failed.`,
      );
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/20 p-4 text-sm">
        <p className="font-medium">Excel columns (first sheet):</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          class_number | subject_slug | book_title | book_order | ncert_code |
          chapter_number | chapter_title | official_pdf_url | status
        </p>
        <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
          <li>
            <strong>subject_slug</strong>: history, geography, polity, economy
          </li>
          <li>
            <strong>ncert_code</strong>: the NCERT book code (e.g. <code>hess2</code>).
            The official PDF URL is auto-derived per chapter — leave
            <strong> official_pdf_url</strong> blank unless you want to override it.
          </li>
          <li>
            <strong>book_order</strong>: orders books within a class+subject (and
            picks the chapter-code letter when a class+subject has several books).
          </li>
          <li>
            <strong>status</strong>: <code>published</code> (default) or <code>draft</code>.
          </li>
        </ul>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={downloadTemplate}>
          Download .xlsx template
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFile}
          className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm"
        />
        {fileName && (
          <Badge variant="secondary">
            {fileName} · {rows.length} row(s)
          </Badge>
        )}
        <Button type="button" onClick={submit} disabled={pending || rows.length === 0}>
          {pending ? "Importing…" : `Import ${rows.length || ""} row(s)`}
        </Button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex gap-2 text-sm">
            <Badge>{result.summary.chapters} chapters</Badge>
            <Badge variant="secondary">{result.summary.books} books</Badge>
            <Badge variant={result.summary.failed ? "destructive" : "outline"}>
              {result.summary.failed} failed
            </Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Row</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.log.map((e) => (
                <TableRow key={e.row}>
                  <TableCell className="tabular-nums">{e.row}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === "error" ? "destructive" : "default"}>
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
