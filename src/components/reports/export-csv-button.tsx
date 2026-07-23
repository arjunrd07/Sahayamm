"use client";

import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

/**
 * Generic tabular export. `rows` should already be the flat, formatted
 * data you want in the file — the same shape could be handed to an
 * Excel (SheetJS) or PDF renderer later without changing callers.
 */
export function ExportCSVButton<T extends Record<string, unknown>>({
  rows,
  filename,
}: {
  rows: T[];
  filename: string;
}) {
  function handleExport() {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
