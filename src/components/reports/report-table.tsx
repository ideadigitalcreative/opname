import Link from "next/link";

import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDate, formatDateTime } from "@/lib/utils/format-date";
import { formatNumber } from "@/lib/utils/format-number";
import type { ReportColumn, ReportPagination, ReportRow } from "@/types/report";

interface ReportTableProps {
  columns: ReportColumn[];
  rows: ReportRow[];
  pagination: ReportPagination;
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
}

function buildPageHref(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (!value || key === "page") {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      continue;
    }

    params.set(key, value);
  }

  params.set("page", String(page));

  return `${pathname}?${params.toString()}`;
}

function formatCellValue(column: ReportColumn, row: ReportRow): string {
  const value = row[column.key];

  switch (column.valueType) {
    case "number":
      return formatNumber(typeof value === "number" ? value : Number(value));
    case "currency":
      return formatCurrency(typeof value === "number" ? value : Number(value));
    case "date":
      return formatDate(typeof value === "string" ? value : undefined);
    case "datetime":
      return formatDateTime(typeof value === "string" ? value : undefined);
    default:
      return value ? String(value) : "-";
  }
}

export function ReportTable({
  columns,
  rows,
  pagination,
  pathname,
  searchParams,
}: ReportTableProps) {
  const hasPreviousPage = pagination.page > 1;
  const hasNextPage = pagination.page < pagination.totalPages;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left font-semibold ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={`${rowIndex}-${String(row[columns[0]?.key] ?? "row")}`} className="bg-white">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 align-top text-slate-700 ${
                      column.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {formatCellValue(column, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Halaman {pagination.page} dari {pagination.totalPages} • Total data {pagination.totalRows}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={hasPreviousPage ? buildPageHref(pathname, searchParams, pagination.page - 1) : "#"}
            aria-disabled={!hasPreviousPage}
            className={`rounded-lg px-3 py-2 ${
              hasPreviousPage
                ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                : "cursor-not-allowed border border-slate-200 text-slate-300"
            }`}
          >
            Sebelumnya
          </Link>
          <Link
            href={hasNextPage ? buildPageHref(pathname, searchParams, pagination.page + 1) : "#"}
            aria-disabled={!hasNextPage}
            className={`rounded-lg px-3 py-2 ${
              hasNextPage
                ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                : "cursor-not-allowed border border-slate-200 text-slate-300"
            }`}
          >
            Berikutnya
          </Link>
        </div>
      </div>
    </div>
  );
}
