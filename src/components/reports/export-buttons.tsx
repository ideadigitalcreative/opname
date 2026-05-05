"use client";

import { FileDown, FileText, Table } from "lucide-react";

interface ExportButtonsProps {
  csvTypes: { label: string; type: string }[];
  pdfTypes: { label: string; type: string }[];
}

export function ExportButtons({ csvTypes, pdfTypes }: ExportButtonsProps) {
  function handleExportCsv(type: string) {
    window.open(`/api/export/csv?type=${type}`, "_blank");
  }

  function handleExportPdf(type: string) {
    window.open(`/api/export/pdf?type=${type}`, "_blank");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {csvTypes.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => handleExportCsv(item.type)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:px-4 sm:py-2 sm:text-sm"
        >
          <Table className="h-3.5 w-3.5" />
          CSV {item.label}
        </button>
      ))}
      {pdfTypes.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => handleExportPdf(item.type)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 sm:px-4 sm:py-2 sm:text-sm"
        >
          <FileText className="h-3.5 w-3.5" />
          PDF {item.label}
        </button>
      ))}
    </div>
  );
}
