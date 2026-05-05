"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DataTable } from "./data-table";
import type { ReactNode } from "react";

type DataTableColumn = {
  label: string;
  className?: string;
  hideOnMobile?: boolean;
};

interface PaginatedDataTableProps {
  columns: string[] | DataTableColumn[];
  rows: Array<Array<ReactNode>>;
  emptyMessage?: string;
  pageSize?: number;
}

export function PaginatedDataTable({
  columns,
  rows,
  emptyMessage,
  pageSize = 20,
}: PaginatedDataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(startIdx, startIdx + pageSize);

  if (rows.length <= pageSize) {
    return <DataTable columns={columns} rows={rows} emptyMessage={emptyMessage} />;
  }

  return (
    <div className="space-y-3">
      <DataTable columns={columns} rows={pageRows} emptyMessage={emptyMessage} />
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 sm:rounded-2xl">
        <p className="text-xs text-slate-500 sm:text-sm">
          Menampilkan {startIdx + 1}-{Math.min(startIdx + pageSize, rows.length)} dari {rows.length} data
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors sm:text-sm ${
                  currentPage === pageNum
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
