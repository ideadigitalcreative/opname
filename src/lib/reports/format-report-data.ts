import { REPORT_COLUMNS, REPORT_DEFINITIONS } from "@/lib/reports/report-columns";
import { formatDateRange, formatDateTime } from "@/lib/utils/format-date";
import type {
  ExportMeta,
  FilterOption,
  ReportFilterKey,
  ReportPayload,
  ReportRow,
  ReportType,
  UserRole,
} from "@/types/report";

const APP_NAME = "Sistem Manajemen Stok Gudang";
const PAGE_SIZE = 5;
const DEFAULT_USER_NAME = "Budi Santoso";

const FILTER_LABELS: Record<ReportFilterKey, string> = {
  startDate: "Tanggal Mulai",
  endDate: "Tanggal Selesai",
  product: "Produk",
  category: "Kategori",
  location: "Lokasi",
  user: "User / Petugas",
  transactionType: "Jenis Transaksi",
  transactionStatus: "Status Transaksi",
  stockStatus: "Status Stok",
  opnameStatus: "Status Hasil Opname",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  petugas_gudang: "Petugas Gudang",
  user: "User",
};

function buildFileName(reportType: ReportType, extension: "pdf" | "xlsx"): string {
  const exportDate = new Date().toISOString().slice(0, 10);
  return `laporan-${reportType}-${exportDate}.${extension}`;
}

function getStringValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function parsePage(value: string | string[] | undefined): number {
  const page = Number(getStringValue(value) || "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function normalizeRole(value?: string): UserRole {
  if (value === "petugas_gudang" || value === "user") {
    return value;
  }

  return "admin";
}

function sumBy(rows: ReportRow[], field: "__qty" | "__value" | "__differenceValue"): number | undefined {
  const total = rows.reduce((accumulator, row) => {
    const current = row[field];
    return accumulator + (typeof current === "number" ? current : 0);
  }, 0);

  return total > 0 ? total : undefined;
}

function buildExportMeta(reportType: ReportType, periodLabel: string): ExportMeta {
  const definition = REPORT_DEFINITIONS[reportType];
  const printedAt = new Date();

  return {
    appName: APP_NAME,
    title: definition.title,
    sheetName: definition.sheetName,
    fileName: buildFileName(reportType, "xlsx"),
    periodLabel,
    printedBy: ROLE_LABELS.admin,
    printedAt: formatDateTime(printedAt),
  };
}

function matchesFilter(rowValue: unknown, selectedValue: string): boolean {
  if (!selectedValue) {
    return true;
  }

  return String(rowValue ?? "").toLowerCase() === selectedValue.toLowerCase();
}

function matchesDate(rowValue: unknown, startDate?: string, endDate?: string): boolean {
  if (!rowValue || (!startDate && !endDate)) {
    return true;
  }

  const currentDate = new Date(String(rowValue));

  if (Number.isNaN(currentDate.getTime())) {
    return true;
  }

  if (startDate) {
    const start = new Date(startDate);
    if (currentDate < start) {
      return false;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (currentDate > end) {
      return false;
    }
  }

  return true;
}

const REPORT_DATA: Record<ReportType, ReportRow[]> = {
  "stok-saat-ini": [
    {
      sku: "SKU-001",
      barcode: "899100100001",
      productName: "Kabel LAN Cat6",
      category: "Jaringan",
      unit: "Roll",
      location: "Gudang Utama",
      availableStock: 24,
      minimumStock: 10,
      stockStatus: "Aman",
      printedDate: "2026-04-29T09:00:00+07:00",
      _product: "Kabel LAN Cat6",
      _category: "Jaringan",
      _location: "Gudang Utama",
      _stockStatus: "Aman",
      __qty: 24,
    },
    {
      sku: "SKU-002",
      barcode: "899100100002",
      productName: "Patch Panel 24 Port",
      category: "Jaringan",
      unit: "Unit",
      location: "Gudang Cabang A",
      availableStock: 3,
      minimumStock: 5,
      stockStatus: "Menipis",
      printedDate: "2026-04-29T09:00:00+07:00",
      _product: "Patch Panel 24 Port",
      _category: "Jaringan",
      _location: "Gudang Cabang A",
      _stockStatus: "Menipis",
      __qty: 3,
    },
    {
      sku: "SKU-003",
      barcode: "899100100003",
      productName: "Label Rak 10x5",
      category: "Operasional",
      unit: "Pack",
      location: "Gudang Transit",
      availableStock: 0,
      minimumStock: 8,
      stockStatus: "Habis",
      printedDate: "2026-04-29T09:00:00+07:00",
      _product: "Label Rak 10x5",
      _category: "Operasional",
      _location: "Gudang Transit",
      _stockStatus: "Habis",
      __qty: 0,
    },
  ],
  "stok-per-lokasi": [
    {
      locationCode: "LOC-001",
      locationName: "Gudang Utama",
      locationType: "Gudang",
      sku: "SKU-001",
      productName: "Kabel LAN Cat6",
      category: "Jaringan",
      unit: "Roll",
      availableQty: 24,
      locationStatus: "Aktif",
      _product: "Kabel LAN Cat6",
      _category: "Jaringan",
      _location: "Gudang Utama",
      _stockStatus: "Aktif",
      __qty: 24,
    },
    {
      locationCode: "LOC-002",
      locationName: "Gudang Cabang A",
      locationType: "Gudang",
      sku: "SKU-002",
      productName: "Patch Panel 24 Port",
      category: "Jaringan",
      unit: "Unit",
      availableQty: 3,
      locationStatus: "Aktif",
      _product: "Patch Panel 24 Port",
      _category: "Jaringan",
      _location: "Gudang Cabang A",
      _stockStatus: "Aktif",
      __qty: 3,
    },
    {
      locationCode: "LOC-003",
      locationName: "Gudang Transit",
      locationType: "Transit",
      sku: "SKU-003",
      productName: "Label Rak 10x5",
      category: "Operasional",
      unit: "Pack",
      availableQty: 0,
      locationStatus: "Perlu Isi Ulang",
      _product: "Label Rak 10x5",
      _category: "Operasional",
      _location: "Gudang Transit",
      _stockStatus: "Perlu Isi Ulang",
      __qty: 0,
    },
  ],
  "stok-masuk": [
    {
      transactionCode: "IN-2026-001",
      transactionDate: "2026-04-02",
      incomingType: "Pembelian",
      sourceName: "PT Sumber Kabel",
      productName: "Kabel LAN Cat6",
      destinationLocation: "Gudang Utama",
      qtyIn: 12,
      purchasePrice: 850000,
      totalValue: 10200000,
      createdBy: "Admin",
      note: "Pembelian bulanan",
      _date: "2026-04-02",
      _product: "Kabel LAN Cat6",
      _category: "Jaringan",
      _location: "Gudang Utama",
      _user: "Admin",
      _transactionType: "Pembelian",
      __qty: 12,
      __value: 10200000,
    },
    {
      transactionCode: "IN-2026-002",
      transactionDate: "2026-04-12",
      incomingType: "Drop Barang",
      sourceName: "Proyek Site Timur",
      productName: "Patch Panel 24 Port",
      destinationLocation: "Gudang Cabang A",
      qtyIn: 5,
      purchasePrice: 450000,
      totalValue: 2250000,
      createdBy: "Petugas Gudang",
      note: "Sisa proyek dipindahkan ke gudang",
      _date: "2026-04-12",
      _product: "Patch Panel 24 Port",
      _category: "Jaringan",
      _location: "Gudang Cabang A",
      _user: "Petugas Gudang",
      _transactionType: "Drop Barang",
      __qty: 5,
      __value: 2250000,
    },
  ],
  "pengambilan-barang": [
    {
      transactionCode: "OUT-2026-011",
      pickupDate: "2026-04-10",
      requesterName: "Budi Santoso",
      sourceLocation: "Gudang Utama",
      sku: "SKU-001",
      productName: "Kabel LAN Cat6",
      qtyOut: 2,
      unit: "Roll",
      purpose: "Instalasi kantor cabang",
      transactionStatus: "Selesai",
      note: "Disetujui petugas gudang",
      _date: "2026-04-10",
      _product: "Kabel LAN Cat6",
      _location: "Gudang Utama",
      _user: "Budi Santoso",
      _transactionStatus: "Selesai",
      __qty: 2,
    },
    {
      transactionCode: "OUT-2026-015",
      pickupDate: "2026-04-15",
      requesterName: "Sari Wulandari",
      sourceLocation: "Gudang Cabang A",
      sku: "SKU-002",
      productName: "Patch Panel 24 Port",
      qtyOut: 1,
      unit: "Unit",
      purpose: "Perbaikan rack server",
      transactionStatus: "Menunggu",
      note: "Menunggu konfirmasi",
      _date: "2026-04-15",
      _product: "Patch Panel 24 Port",
      _location: "Gudang Cabang A",
      _user: "Sari Wulandari",
      _transactionStatus: "Menunggu",
      __qty: 1,
    },
    {
      transactionCode: "OUT-2026-018",
      pickupDate: "2026-04-22",
      requesterName: "Budi Santoso",
      sourceLocation: "Gudang Transit",
      sku: "SKU-003",
      productName: "Label Rak 10x5",
      qtyOut: 4,
      unit: "Pack",
      purpose: "Labelisasi area baru",
      transactionStatus: "Selesai",
      note: "Dipakai untuk re-layout gudang",
      _date: "2026-04-22",
      _product: "Label Rak 10x5",
      _location: "Gudang Transit",
      _user: "Budi Santoso",
      _transactionStatus: "Selesai",
      __qty: 4,
    },
  ],
  "mutasi-stok": [
    {
      transactionDate: "2026-04-08",
      productName: "Kabel LAN Cat6",
      location: "Gudang Utama",
      mutationType: "IN",
      mutationSource: "Pembelian",
      qtyBefore: 12,
      qtyChange: 12,
      qtyAfter: 24,
      createdBy: "Admin",
      description: "Pembelian rutin vendor utama",
      _date: "2026-04-08",
      _product: "Kabel LAN Cat6",
      _location: "Gudang Utama",
      _user: "Admin",
      _transactionType: "IN",
      __qty: 12,
    },
    {
      transactionDate: "2026-04-15",
      productName: "Patch Panel 24 Port",
      location: "Gudang Cabang A",
      mutationType: "OUT",
      mutationSource: "Pengambilan",
      qtyBefore: 4,
      qtyChange: -1,
      qtyAfter: 3,
      createdBy: "Petugas Gudang",
      description: "Pengambilan untuk perbaikan rack server",
      _date: "2026-04-15",
      _product: "Patch Panel 24 Port",
      _location: "Gudang Cabang A",
      _user: "Petugas Gudang",
      _transactionType: "OUT",
      __qty: 1,
    },
    {
      transactionDate: "2026-04-27",
      productName: "Label Rak 10x5",
      location: "Gudang Transit",
      mutationType: "OPNAME",
      mutationSource: "Opname",
      qtyBefore: 3,
      qtyChange: -3,
      qtyAfter: 0,
      createdBy: "Petugas Gudang",
      description: "Selisih opname ditutup menjadi nol",
      _date: "2026-04-27",
      _product: "Label Rak 10x5",
      _location: "Gudang Transit",
      _user: "Petugas Gudang",
      _transactionType: "OPNAME",
      __qty: 3,
    },
  ],
  "stock-opname": [
    {
      sessionCode: "OPN-APR-01",
      sessionName: "Opname April Gudang Utama",
      location: "Gudang Utama",
      startedAt: "2026-04-25T08:00:00+07:00",
      finishedAt: "2026-04-25T10:00:00+07:00",
      sessionStatus: "Selesai",
      productName: "Kabel LAN Cat6",
      systemStock: 24,
      physicalStock: 24,
      differenceQty: 0,
      resultStatus: "Cocok",
      counterName: "Andi Pratama",
      note: "Sesuai sistem",
      _date: "2026-04-25",
      _product: "Kabel LAN Cat6",
      _location: "Gudang Utama",
      _user: "Andi Pratama",
      _opnameStatus: "Cocok",
      __qty: 24,
    },
    {
      sessionCode: "OPN-APR-02",
      sessionName: "Opname April Gudang Cabang A",
      location: "Gudang Cabang A",
      startedAt: "2026-04-26T09:00:00+07:00",
      finishedAt: "2026-04-26T11:30:00+07:00",
      sessionStatus: "Selesai",
      productName: "Patch Panel 24 Port",
      systemStock: 3,
      physicalStock: 4,
      differenceQty: 1,
      resultStatus: "Lebih",
      counterName: "Sari Wulandari",
      note: "Ditemukan 1 unit cadangan",
      _date: "2026-04-26",
      _product: "Patch Panel 24 Port",
      _location: "Gudang Cabang A",
      _user: "Sari Wulandari",
      _opnameStatus: "Lebih",
      __qty: 4,
    },
    {
      sessionCode: "OPN-APR-03",
      sessionName: "Opname April Gudang Transit",
      location: "Gudang Transit",
      startedAt: "2026-04-27T09:15:00+07:00",
      finishedAt: "2026-04-27T12:00:00+07:00",
      sessionStatus: "Selesai",
      productName: "Label Rak 10x5",
      systemStock: 3,
      physicalStock: 0,
      differenceQty: -3,
      resultStatus: "Kurang",
      counterName: "Andi Pratama",
      note: "Barang sudah terpakai namun belum diposting",
      _date: "2026-04-27",
      _product: "Label Rak 10x5",
      _location: "Gudang Transit",
      _user: "Andi Pratama",
      _opnameStatus: "Kurang",
      __qty: 0,
    },
  ],
  "selisih-opname": [
    {
      sessionCode: "OPN-APR-02",
      location: "Gudang Cabang A",
      productName: "Patch Panel 24 Port",
      systemStock: 3,
      physicalStock: 4,
      differenceQty: 1,
      estimatedDifferenceValue: 450000,
      differenceStatus: "Lebih",
      note: "Perlu update saldo awal",
      approvedBy: "Manager Operasional",
      approvedAt: "2026-04-26T14:00:00+07:00",
      _date: "2026-04-26",
      _product: "Patch Panel 24 Port",
      _location: "Gudang Cabang A",
      _opnameStatus: "Lebih",
      __differenceValue: 450000,
    },
    {
      sessionCode: "OPN-APR-03",
      location: "Gudang Transit",
      productName: "Label Rak 10x5",
      systemStock: 3,
      physicalStock: 0,
      differenceQty: -3,
      estimatedDifferenceValue: 180000,
      differenceStatus: "Kurang",
      note: "Perlu koreksi mutasi pemakaian",
      approvedBy: "Manager Operasional",
      approvedAt: "2026-04-27T15:30:00+07:00",
      _date: "2026-04-27",
      _product: "Label Rak 10x5",
      _location: "Gudang Transit",
      _opnameStatus: "Kurang",
      __differenceValue: 180000,
    },
  ],
};

export function isReportType(value: string): value is ReportType {
  return value in REPORT_DEFINITIONS;
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function getFilterOptions(reportType: ReportType, filterKey: ReportFilterKey): FilterOption[] {
  const rows = REPORT_DATA[reportType];

  const valueMap: Partial<Record<ReportFilterKey, keyof ReportRow>> = {
    product: "_product",
    category: "_category",
    location: "_location",
    user: "_user",
    transactionType: "_transactionType",
    transactionStatus: "_transactionStatus",
    stockStatus: "_stockStatus",
    opnameStatus: "_opnameStatus",
  };

  const sourceKey = valueMap[filterKey];

  if (!sourceKey) {
    return [];
  }

  const values = Array.from(
    new Set(
      rows
        .map((row) => row[sourceKey])
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );

  return values
    .sort((left, right) => left.localeCompare(right, "id-ID"))
    .map((value) => ({ label: value, value }));
}

export function canExportReport(reportType: ReportType, userRole: UserRole): boolean {
  return REPORT_DEFINITIONS[reportType].allowedRoles.includes(userRole);
}

export function getReportPayload(
  reportType: ReportType,
  rawSearchParams: Record<string, string | string[] | undefined>,
): ReportPayload {
  const definition = REPORT_DEFINITIONS[reportType];
  const columns = REPORT_COLUMNS[reportType];
  const userRole = normalizeRole(getStringValue(rawSearchParams.role));
  const startDate = getStringValue(rawSearchParams.startDate);
  const endDate = getStringValue(rawSearchParams.endDate);
  const selectedUser = getStringValue(rawSearchParams.user);
  const page = parsePage(rawSearchParams.page);

  const filteredRows = REPORT_DATA[reportType].filter((row) => {
    if (!matchesDate(row._date, startDate, endDate)) {
      return false;
    }

    if (!matchesFilter(row._product, getStringValue(rawSearchParams.product))) {
      return false;
    }

    if (!matchesFilter(row._category, getStringValue(rawSearchParams.category))) {
      return false;
    }

    if (!matchesFilter(row._location, getStringValue(rawSearchParams.location))) {
      return false;
    }

    if (!matchesFilter(row._transactionType, getStringValue(rawSearchParams.transactionType))) {
      return false;
    }

    if (!matchesFilter(row._transactionStatus, getStringValue(rawSearchParams.transactionStatus))) {
      return false;
    }

    if (!matchesFilter(row._stockStatus, getStringValue(rawSearchParams.stockStatus))) {
      return false;
    }

    if (!matchesFilter(row._opnameStatus, getStringValue(rawSearchParams.opnameStatus))) {
      return false;
    }

    if (selectedUser && !matchesFilter(row._user, selectedUser)) {
      return false;
    }

    if (userRole === "user") {
      return reportType === "pengambilan-barang" && row._user === DEFAULT_USER_NAME;
    }

    return true;
  });

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const rows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);
  const periodLabel = formatDateRange(startDate, endDate);

  const activeFilters = definition.filters
    .map((key) => {
      const rawValue = getStringValue(rawSearchParams[key]);

      if (!rawValue) {
        return null;
      }

      return {
        label: FILTER_LABELS[key],
        value: rawValue,
      };
    })
    .filter((item): item is { label: string; value: string } => item !== null);

  const canExport = canExportReport(reportType, userRole) && filteredRows.length > 0;

  return {
    definition,
    columns,
    rows,
    allRowsCount: filteredRows.length,
    summary: {
      totalData: filteredRows.length,
      totalQty: sumBy(filteredRows, "__qty"),
      totalValue: sumBy(filteredRows, "__value"),
      totalDifferenceValue: sumBy(filteredRows, "__differenceValue"),
    },
    exportMeta: buildExportMeta(reportType, periodLabel),
    activeFilters,
    pagination: {
      page: currentPage,
      pageSize: PAGE_SIZE,
      totalRows,
      totalPages,
    },
    emptyMessage: "Tidak ada data untuk diekspor berdasarkan filter yang dipilih.",
    canExport,
    userRole,
  };
}
