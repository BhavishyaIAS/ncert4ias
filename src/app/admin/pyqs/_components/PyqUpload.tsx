"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import {
  uploadPyqs,
  type RawPyqRow,
  type UploadResult,
} from "@/app/admin/pyqs/actions";
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

const HEADERS = ["year", "paper", "question_text", "chapter_codes", "notes"];

function normalizeRow(obj: Record<string, unknown>): RawPyqRow {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.trim().toLowerCase().replace(/\s+/g, "_")] = v;
  }
  return {
    year: out.year as string | number | undefined,
    paper: out.paper as string | undefined,
    question_text: out.question_text as string | undefined,
    chapter_codes: out.chapter_codes as string | undefined,
    notes: out.notes as string | undefined,
  };
}

export function PyqUpload() {
  const [rows, setRows] = useState<RawPyqRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
      const parsed = json.map(normalizeRow).filter((r) => r.question_text || r.year);
      setRows(parsed);
      setFileName(file.name);
      toast.success(`Parsed ${parsed.length} row(s) from ${file.name}.`);
    } catch {
      toast.error("Could not read that file. Use the .xlsx template.");
    }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      HEADERS,
      [2023, "Prelims", "With reference to the Revolt of 1857, consider…", "H-8-5", "Example row — delete before upload"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PYQs");
    XLSX.writeFile(wb, "ncert4ias-pyq-template.xlsx");
  }

  function submit() {
    startTransition(async () => {
      const res = await uploadPyqs(rows);
      setResult(res);
      toast.success(
        `Uploaded: ${res.summary.inserted} saved, ${res.summary.links} link(s), ${res.summary.failed} failed.`,
      );
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/20 p-4 text-sm">
        <p className="font-medium">Excel columns (first sheet):</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          year | paper | question_text | chapter_codes | notes
        </p>
        <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
          <li>
            <strong>paper</strong>: Prelims, GS-I, GS-II, GS-III, GS-IV, or Essay
          </li>
          <li>
            <strong>chapter_codes</strong>: comma-separated, e.g. <code>H-8-5, P-9-1</code>
          </li>
        </ul>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={downloadTemplate}
        >
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
        <Button
          type="button"
          onClick={submit}
          disabled={pending || rows.length === 0}
        >
          {pending ? "Uploading…" : `Upload ${rows.length || ""} row(s)`}
        </Button>
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex gap-2 text-sm">
            <Badge>{result.summary.inserted} saved</Badge>
            <Badge variant="secondary">{result.summary.links} chapter links</Badge>
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
                    <Badge
                      variant={
                        e.status === "linked"
                          ? "default"
                          : e.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
