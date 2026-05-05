import Link from "next/link";

import { getRoleLabel } from "@/lib/reports/format-report-data";
import type { ReportDefinition, UserRole } from "@/types/report";

interface ReportHeaderProps {
  definition: ReportDefinition;
  userRole: UserRole;
}

export function ReportHeader({ definition, userRole }: ReportHeaderProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {definition.sheetName}
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {definition.title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">{definition.description}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>
            Role aktif: <span className="font-semibold">{getRoleLabel(userRole)}</span>
          </p>
          <p>
            Orientasi export default: <span className="font-semibold">{definition.orientation}</span>
          </p>
          <Link href="/reports" className="mt-2 inline-flex text-sm font-medium text-blue-700">
            Kembali ke daftar laporan
          </Link>
        </div>
      </div>
    </div>
  );
}
