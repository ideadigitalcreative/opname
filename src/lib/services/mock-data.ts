import {
  Archive,
  Boxes,
  ChartColumn,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  ScanBarcode,
  Settings,
  Tags,
  Users,
  Warehouse,
} from "lucide-react";

import type {
  AppRole,
  AuditLogItem,
  Category,
  DashboardStat,
  Location,
  NavigationItem,
  OpnameInputItem,
  OpnameSession,
  Product,
  ProductStock,
  ReportOverviewItem,
  StockInTransaction,
  StockOutHistoryItem,
  Unit,
  UserProfile,
} from "@/types/app";

const MOCK_USERS: Record<AppRole, UserProfile> = {
  admin: {
    id: "usr-admin-001",
    fullName: "Admin Gudang",
    email: "admin@opname.local",
    role: "admin",
    avatarFallback: "AG",
    locationName: "Gudang Utama",
  },
  petugas_gudang: {
    id: "usr-petugas-001",
    fullName: "Petugas Gudang",
    email: "petugas.gudang@opname.local",
    role: "petugas_gudang",
    avatarFallback: "PG",
    locationName: "Gudang Cabang A",
  },
  user: {
    id: "usr-user-001",
    fullName: "Budi Pengambil",
    email: "budi@opname.local",
    role: "user",
    avatarFallback: "BP",
    locationName: "Site Teknisi",
  },
};

export const APP_NAVIGATION: NavigationItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "petugas_gudang"] },
  { title: "Barang", href: "/products", icon: Boxes, roles: ["admin"] },
  { title: "Kategori", href: "/categories", icon: Tags, roles: ["admin"] },
  { title: "Satuan", href: "/units", icon: Archive, roles: ["admin"] },
  { title: "Lokasi", href: "/locations", icon: MapPin, roles: ["admin"] },
  { title: "Stok Per Lokasi", href: "/product-stocks", icon: Warehouse, roles: ["admin", "petugas_gudang"] },
  { title: "Stok Masuk", href: "/stock-in", icon: LogIn, roles: ["admin", "petugas_gudang"] },
  { title: "Ambil Barang", href: "/stock-out", icon: ScanBarcode, roles: ["admin", "petugas_gudang", "user"] },
  { title: "Mutasi Stok", href: "/movements", icon: LogOut, roles: ["admin", "petugas_gudang"] },
  { title: "Stock Opname", href: "/opname/sessions", icon: ClipboardList, roles: ["admin", "petugas_gudang"] },
  { title: "Laporan", href: "/reports", icon: ChartColumn, roles: ["admin", "petugas_gudang"] },
  { title: "User & Role", href: "/users", icon: Users, roles: ["admin"] },
  { title: "Audit Log", href: "/audit-logs", icon: FileClock, roles: ["admin"] },
  { title: "Pengaturan", href: "/settings", icon: Settings, roles: ["admin", "petugas_gudang"] },
];

export function getMockUser(role: AppRole): UserProfile {
  return MOCK_USERS[role];
}

export function getNavigationByRole(role: AppRole) {
  return APP_NAVIGATION.filter((item) => item.roles.includes(role));
}

export function getDashboardStats(role: AppRole): DashboardStat[] {
  if (role === "user") {
    return [
      { label: "Pengambilan Bulan Ini", value: "12", hint: "Riwayat pengambilan milik Anda" },
      { label: "Lokasi Terakhir", value: "Rak A1", hint: "Lokasi terakhir yang discan" },
      { label: "Item Diambil", value: "34", hint: "Total qty barang yang sudah diambil" },
      { label: "Status Terakhir", value: "Submitted", hint: "Transaksi terbaru berhasil diproses" },
    ];
  }

  return [
    { label: "Total Produk", value: "1.284", hint: "Produk aktif di seluruh gudang" },
    { label: "Total Stok", value: "8.942", hint: "Akumulasi qty dari seluruh lokasi aktif" },
    { label: "Total Lokasi", value: "36", hint: "Gudang, rak, lemari, box teknisi, etalase" },
    { label: "Stok Masuk Bulan Ini", value: "428", hint: "Gabungan pembelian dan drop barang" },
    { label: "Pengambilan Bulan Ini", value: "163", hint: "Barang keluar oleh user/pengambil" },
    { label: "Produk Stok Rendah", value: "14", hint: "Perlu pembelian ulang atau redistribusi" },
  ];
}

export const mockCategories: Category[] = [
  {
    id: "cat-001",
    namaKategori: "Jaringan",
    deskripsi: "Perangkat jaringan dan aksesorinya",
    statusAktif: true,
    totalBarang: 242,
    updatedAt: "2026-04-29T09:00:00+07:00",
  },
  {
    id: "cat-002",
    namaKategori: "Elektronik",
    deskripsi: "Perangkat elektronik operasional",
    statusAktif: true,
    totalBarang: 118,
    updatedAt: "2026-04-28T10:30:00+07:00",
  },
  {
    id: "cat-003",
    namaKategori: "ATK",
    deskripsi: "Alat tulis kantor dan label",
    statusAktif: true,
    totalBarang: 86,
    updatedAt: "2026-04-27T14:00:00+07:00",
  },
];

export const mockUnits: Unit[] = [
  {
    id: "unit-001",
    namaSatuan: "Pieces",
    simbol: "pcs",
    deskripsi: "Satuan per item",
    statusAktif: true,
    updatedAt: "2026-04-27T08:00:00+07:00",
  },
  {
    id: "unit-002",
    namaSatuan: "Box",
    simbol: "box",
    deskripsi: "Satuan per box",
    statusAktif: true,
    updatedAt: "2026-04-27T08:15:00+07:00",
  },
  {
    id: "unit-003",
    namaSatuan: "Kilogram",
    simbol: "kg",
    deskripsi: "Satuan berat",
    statusAktif: true,
    updatedAt: "2026-04-27T08:30:00+07:00",
  },
];

export const mockLocations: Location[] = [
  {
    id: "loc-001",
    kodeLokasi: "RAK-A1",
    namaLokasi: "Gudang Utama",
    tipeLokasi: "Gudang",
    barcodeValue: "LOC-RAK-A1-2026",
    deskripsi: "Lokasi utama pusat distribusi",
    statusAktif: true,
    totalBarang: 658,
    updatedAt: "2026-04-29T07:00:00+07:00",
  },
  {
    id: "loc-002",
    kodeLokasi: "RAK-A2",
    namaLokasi: "Gudang Cabang A",
    tipeLokasi: "Cabang",
    barcodeValue: "LOC-RAK-A2-2026",
    deskripsi: "Gudang cabang wilayah barat",
    statusAktif: true,
    totalBarang: 418,
    updatedAt: "2026-04-28T13:20:00+07:00",
  },
  {
    id: "loc-003",
    kodeLokasi: "LEM-B1",
    namaLokasi: "Rak Transit",
    tipeLokasi: "Rak",
    barcodeValue: "LOC-LEM-B1-2026",
    deskripsi: "Area transit barang keluar masuk",
    statusAktif: true,
    totalBarang: 48,
    updatedAt: "2026-04-28T16:40:00+07:00",
  },
];

export const mockProducts: Product[] = [
  {
    id: "prd-001",
    sku: "SKU-001",
    barcodeProduk: "899100100001",
    namaProduk: "Kabel LAN Cat6",
    kategoriId: "cat-001",
    kategori: "Jaringan",
    satuanId: "unit-001",
    satuan: "Roll",
    totalStok: 24,
    minimumStok: 10,
    statusAktif: true,
    updatedAt: "2026-04-29T09:10:00+07:00",
  },
  {
    id: "prd-002",
    sku: "SKU-002",
    barcodeProduk: "899100100002",
    namaProduk: "Patch Panel 24 Port",
    kategoriId: "cat-001",
    kategori: "Jaringan",
    satuanId: "unit-001",
    satuan: "pcs",
    totalStok: 3,
    minimumStok: 5,
    statusAktif: true,
    updatedAt: "2026-04-28T11:45:00+07:00",
  },
  {
    id: "prd-003",
    sku: "SKU-003",
    barcodeProduk: "899100100003",
    namaProduk: "Label Rak 10x5",
    kategoriId: "cat-003",
    kategori: "ATK",
    satuanId: "unit-002",
    satuan: "pack",
    totalStok: 6,
    minimumStok: 8,
    statusAktif: true,
    updatedAt: "2026-04-27T15:20:00+07:00",
  },
];

export const mockProductStocks: ProductStock[] = [
  {
    id: "pst-001",
    productName: "Kabel LAN Cat6",
    locationName: "Gudang Utama",
    qty: 24,
    barcodeLocation: "LOC-RAK-A1-2026",
  },
  {
    id: "pst-002",
    productName: "Patch Panel 24 Port",
    locationName: "Gudang Cabang A",
    qty: 3,
    barcodeLocation: "LOC-RAK-A2-2026",
  },
  {
    id: "pst-003",
    productName: "Label Rak 10x5",
    locationName: "Rak Transit",
    qty: 6,
    barcodeLocation: "LOC-LEM-B1-2026",
  },
];

export const mockStockInTransactions: StockInTransaction[] = [
  {
    id: "sin-001",
    kodeTransaksi: "IN-2026-001",
    tipeMasuk: "pembelian",
    tanggal: "2026-04-28",
    supplier: "PT Sumber Kabel",
    lokasiTujuan: "Gudang Utama",
    totalItem: 2,
    totalQty: 17,
    dibuatOleh: "Admin Gudang",
    appliedAt: "2026-04-28T10:00:00+07:00",
  },
  {
    id: "sin-002",
    kodeTransaksi: "IN-2026-002",
    tipeMasuk: "drop_barang",
    tanggal: "2026-04-29",
    sumberDrop: "Site Proyek Timur",
    lokasiTujuan: "Rak Transit",
    totalItem: 1,
    totalQty: 6,
    dibuatOleh: "Petugas Gudang",
    appliedAt: "2026-04-29T14:15:00+07:00",
  },
];

export const mockStockOutHistory: StockOutHistoryItem[] = [
  {
    id: "sout-001",
    kodeTransaksi: "OUT-2026-011",
    tanggal: "2026-04-29",
    lokasi: "Gudang Utama",
    productName: "Kabel LAN Cat6",
    qty: 2,
    status: "submitted",
    requestedBy: "Budi Pengambil",
  },
  {
    id: "sout-002",
    kodeTransaksi: "OUT-2026-012",
    tanggal: "2026-04-29",
    lokasi: "Gudang Cabang A",
    productName: "Patch Panel 24 Port",
    qty: 1,
    status: "submitted",
    requestedBy: "Budi Pengambil",
  },
];

export const mockSessions: OpnameSession[] = [
  {
    id: "ses-001",
    kodeSesi: "OPN-APR-UTM",
    namaSesi: "Opname Akhir April Gudang Utama",
    tanggalMulai: "2026-04-25",
    tanggalSelesai: "2026-04-29",
    lokasi: "Gudang Utama",
    status: "aktif",
    progressPercent: 72,
    totalItem: 320,
    sudahDicek: 231,
    selisihItem: 14,
    dibuatOleh: "Admin Gudang",
    petugas: "Petugas Gudang",
  },
  {
    id: "ses-002",
    kodeSesi: "OPN-APR-CBG-A",
    namaSesi: "Opname Mingguan Cabang A",
    tanggalMulai: "2026-04-26",
    tanggalSelesai: "2026-04-30",
    lokasi: "Gudang Cabang A",
    status: "menunggu_approval",
    progressPercent: 100,
    totalItem: 128,
    sudahDicek: 128,
    selisihItem: 7,
    dibuatOleh: "Admin Gudang",
    petugas: "Petugas Gudang",
  },
  {
    id: "ses-003",
    kodeSesi: "OPN-MAY-TRS",
    namaSesi: "Opname Transit Awal Mei",
    tanggalMulai: "2026-05-02",
    tanggalSelesai: "2026-05-02",
    lokasi: "Rak Transit",
    status: "draft",
    progressPercent: 0,
    totalItem: 42,
    sudahDicek: 0,
    selisihItem: 0,
    dibuatOleh: "Admin Gudang",
  },
];

export const mockInputItems: OpnameInputItem[] = [
  {
    id: "itm-001",
    sku: "SKU-001",
    barcode: "899100100001",
    namaProduk: "Kabel LAN Cat6",
    kategori: "Jaringan",
    satuan: "Roll",
    lokasi: "Gudang Utama",
    stokSistem: 24,
    stokFisik: 24,
    selisih: 0,
    nilaiSelisih: 0,
    statusHasil: "sesuai",
    kondisiBarang: "baik",
    catatan: "Sesuai rak utama",
    petugas: "Petugas Gudang",
    dihitungAt: "2026-04-29T08:15:00+07:00",
  },
  {
    id: "itm-002",
    sku: "SKU-002",
    barcode: "899100100002",
    namaProduk: "Patch Panel 24 Port",
    kategori: "Jaringan",
    satuan: "pcs",
    lokasi: "Gudang Cabang A",
    stokSistem: 3,
    stokFisik: 4,
    selisih: 1,
    nilaiSelisih: 450000,
    statusHasil: "lebih",
    kondisiBarang: "baik",
    catatan: "Ada unit cadangan di rak belakang",
    petugas: "Petugas Gudang",
    dihitungAt: "2026-04-29T09:05:00+07:00",
  },
  {
    id: "itm-003",
    sku: "SKU-003",
    barcode: "899100100003",
    namaProduk: "Label Rak 10x5",
    kategori: "ATK",
    satuan: "pack",
    lokasi: "Rak Transit",
    stokSistem: 3,
    stokFisik: null,
    selisih: null,
    nilaiSelisih: null,
    statusHasil: "belum_dicek",
  },
];

export const mockAuditLogs: AuditLogItem[] = [
  {
    id: "aud-001",
    action: "APPROVE_SESSION",
    entityType: "opname_sessions",
    entityId: "ses-002",
    actor: "Supervisor Operasional",
    createdAt: "2026-04-29T13:10:00+07:00",
  },
  {
    id: "aud-002",
    action: "UPDATE_PRODUCT",
    entityType: "products",
    entityId: "prd-001",
    actor: "Admin Gudang",
    createdAt: "2026-04-29T10:20:00+07:00",
  },
  {
    id: "aud-003",
    action: "INPUT_OPNAME",
    entityType: "opname_items",
    entityId: "itm-002",
    actor: "Petugas Gudang",
    createdAt: "2026-04-29T09:05:00+07:00",
  },
];

export const mockReportOverview: ReportOverviewItem[] = [
  {
    title: "Laporan Stok Saat Ini",
    description: "Posisi stok aktif seluruh produk berdasarkan lokasi aktif.",
    totalRows: 58,
    lastExportAt: "2026-04-29T12:00:00+07:00",
  },
  {
    title: "Laporan Mutasi Stok",
    description: "Riwayat pergerakan stok masuk, keluar, koreksi, dan opname.",
    totalRows: 48,
    lastExportAt: "2026-04-29T12:10:00+07:00",
  },
  {
    title: "Laporan Pengambilan Barang",
    description: "Riwayat barang keluar berdasarkan lokasi dan user pengambil.",
    totalRows: 18,
    lastExportAt: "2026-04-29T12:20:00+07:00",
  },
];
