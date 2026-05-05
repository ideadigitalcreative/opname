import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateTime } from "@/lib/utils/format-date";
import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type DataTableColumn = {
  label: string;
  className?: string;
  hideOnMobile?: boolean;
};

type DataTableProps = {
  columns: string[] | DataTableColumn[];
  rows: Array<Array<ReactNode>>;
  emptyMessage?: string;
};

function formatCellValue(value: ReactNode): ReactNode {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Aktif" : "Nonaktif";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString("id-ID") : formatCurrency(value);
  }

  if (typeof value === "string") {
    if (value.includes("T") && value.includes(":")) {
      return formatDateTime(value);
    }
  }

  return value;
}

function isColumnObject(col: string | DataTableColumn): col is DataTableColumn {
  return typeof col === "object" && "label" in col;
}

export function DataTable({ columns, rows, emptyMessage }: DataTableProps) {
  return (
    <div className="max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600 sm:bg-slate-100 sm:text-slate-700">
            <tr>
              {columns.map((column, i) => {
                const isObj = isColumnObject(column);
                const label = isObj ? column.label : column;
                const cls = isObj ? column.className : undefined;
                const hide = isObj && column.hideOnMobile;

                return (
                  <th
                    key={i}
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 text-left font-semibold sm:px-4 sm:py-3",
                      hide && "hidden sm:table-cell",
                      cls,
                    )}
                  >
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  {emptyMessage ?? "Tidak ada data"}
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={index} className="bg-white">
                {row.map((cell, cellIndex) => {
                  const col = columns[cellIndex];
                  const isObj = isColumnObject(col);
                  const hide = isObj && col.hideOnMobile;

                  return (
                    <td
                      key={cellIndex}
                      className={cn(
                        "whitespace-nowrap px-3 py-2.5 align-middle text-slate-700 sm:px-4 sm:py-3",
                        hide && "hidden sm:table-cell",
                      )}
                    >
                      {formatCellValue(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
