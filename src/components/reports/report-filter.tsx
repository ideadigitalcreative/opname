import Link from "next/link";

import { getFilterOptions } from "@/lib/reports/format-report-data";
import { REPORT_DEFINITIONS } from "@/lib/reports/report-columns";
import type { ReportType, UserRole } from "@/types/report";
import { DateRangeFilter } from "./date-range-filter";
import { LocationFilter } from "./location-filter";
import { ProductFilter } from "./product-filter";
import { StatusFilter } from "./status-filter";
import { UserFilter } from "./user-filter";

interface ReportFilterProps {
  reportType: ReportType;
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
  userRole: UserRole;
}

function getSearchValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function ReportFilter({
  reportType,
  pathname,
  searchParams,
  userRole,
}: ReportFilterProps) {
  const definition = REPORT_DEFINITIONS[reportType];

  return (
    <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Filter Laporan</h2>
            <p className="text-sm text-slate-600">
              Gunakan filter di bawah untuk mempersempit data preview sebelum export.
            </p>
          </div>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="font-medium">Simulasi Role</span>
            <select
              name="role"
              defaultValue={userRole}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500 lg:w-52"
            >
              <option value="admin">Admin</option>
              <option value="petugas_gudang">Petugas Gudang</option>
              <option value="user">User</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {definition.filters.includes("startDate") || definition.filters.includes("endDate") ? (
            <DateRangeFilter
              startDate={getSearchValue(searchParams.startDate)}
              endDate={getSearchValue(searchParams.endDate)}
            />
          ) : null}

          {definition.filters.includes("product") ? (
            <ProductFilter
              options={getFilterOptions(reportType, "product")}
              defaultValue={getSearchValue(searchParams.product)}
            />
          ) : null}

          {definition.filters.includes("category") ? (
            <StatusFilter
              name="category"
              label="Kategori"
              allLabel="Semua kategori"
              options={getFilterOptions(reportType, "category")}
              defaultValue={getSearchValue(searchParams.category)}
            />
          ) : null}

          {definition.filters.includes("location") ? (
            <LocationFilter
              options={getFilterOptions(reportType, "location")}
              defaultValue={getSearchValue(searchParams.location)}
            />
          ) : null}

          {definition.filters.includes("user") ? (
            <UserFilter
              options={getFilterOptions(reportType, "user")}
              defaultValue={getSearchValue(searchParams.user)}
            />
          ) : null}

          {definition.filters.includes("transactionType") ? (
            <StatusFilter
              name="transactionType"
              label="Jenis Transaksi"
              allLabel="Semua jenis transaksi"
              options={getFilterOptions(reportType, "transactionType")}
              defaultValue={getSearchValue(searchParams.transactionType)}
            />
          ) : null}

          {definition.filters.includes("transactionStatus") ? (
            <StatusFilter
              name="transactionStatus"
              label="Status Transaksi"
              allLabel="Semua status transaksi"
              options={getFilterOptions(reportType, "transactionStatus")}
              defaultValue={getSearchValue(searchParams.transactionStatus)}
            />
          ) : null}

          {definition.filters.includes("stockStatus") ? (
            <StatusFilter
              name="stockStatus"
              label="Status Stok"
              allLabel="Semua status stok"
              options={getFilterOptions(reportType, "stockStatus")}
              defaultValue={getSearchValue(searchParams.stockStatus)}
            />
          ) : null}

          {definition.filters.includes("opnameStatus") ? (
            <StatusFilter
              name="opnameStatus"
              label="Status Hasil Opname"
              allLabel="Semua status hasil opname"
              options={getFilterOptions(reportType, "opnameStatus")}
              defaultValue={getSearchValue(searchParams.opnameStatus)}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Filter
          </button>
          <Link
            href={`${pathname}?role=${userRole}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset Filter
          </Link>
        </div>
      </div>
    </form>
  );
}
