export type ReportType =
  | "stok-saat-ini"
  | "stok-per-lokasi"
  | "stok-masuk"
  | "pengambilan-barang"
  | "mutasi-stok"
  | "stock-opname"
  | "selisih-opname";

export type UserRole = "admin" | "petugas_gudang" | "user";

export type ReportFilterKey =
  | "startDate"
  | "endDate"
  | "product"
  | "category"
  | "location"
  | "user"
  | "transactionType"
  | "transactionStatus"
  | "stockStatus"
  | "opnameStatus";

export type ReportCellValue = string | number | null | undefined;

export type ReportRow = Record<string, ReportCellValue>;

export interface ReportColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  valueType?: "text" | "number" | "currency" | "date" | "datetime" | "status";
}

export interface ReportSummary {
  totalData: number;
  totalQty?: number;
  totalValue?: number;
  totalDifferenceValue?: number;
}

export interface ExportMeta {
  appName: string;
  title: string;
  sheetName: string;
  fileName: string;
  periodLabel: string;
  printedBy: string;
  printedAt: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface ReportDefinition {
  type: ReportType;
  title: string;
  description: string;
  orientation: "portrait" | "landscape";
  sheetName: string;
  filters: ReportFilterKey[];
  allowedRoles: UserRole[];
  requiresSignature?: boolean;
}

export interface ReportPagination {
  page: number;
  pageSize: number;
  totalRows: number;
  totalPages: number;
}

export interface ReportPayload {
  definition: ReportDefinition;
  columns: ReportColumn[];
  rows: ReportRow[];
  allRowsCount: number;
  summary: ReportSummary;
  exportMeta: ExportMeta;
  activeFilters: Array<{ label: string; value: string }>;
  pagination: ReportPagination;
  emptyMessage: string;
  canExport: boolean;
  userRole: UserRole;
}
