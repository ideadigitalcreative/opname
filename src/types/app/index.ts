import type { LucideIcon } from "lucide-react";

export type AppRole = "admin" | "petugas_gudang" | "user";

export type SessionStatus =
  | "draft"
  | "aktif"
  | "menunggu_approval"
  | "disetujui"
  | "ditolak"
  | "selesai"
  | "dibatalkan";

export type ItemResultStatus =
  | "belum_dicek"
  | "sesuai"
  | "lebih"
  | "kurang"
  | "barang_rusak"
  | "tidak_ditemukan";

export type ItemCondition = "baik" | "rusak" | "expired" | "hilang" | "salah_lokasi";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  avatarFallback: string;
  locationName?: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  hint: string;
}

export interface NavigationItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: AppRole[];
  children?: Array<{
    title: string;
    href: string;
    roles: AppRole[];
  }>;
}

export interface Category {
  id: string;
  namaKategori: string;
  deskripsi: string;
  statusAktif: boolean;
  totalBarang: number;
  updatedAt: string;
}

export interface Unit {
  id: string;
  namaSatuan: string;
  simbol: string;
  deskripsi: string;
  statusAktif: boolean;
  updatedAt: string;
}

export interface Location {
  id: string;
  kodeLokasi: string;
  namaLokasi: string;
  tipeLokasi: string;
  barcodeValue: string;
  deskripsi: string;
  statusAktif: boolean;
  totalBarang: number;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcodeProduk: string;
  namaProduk: string;
  kategoriId: string;
  kategori: string;
  satuanId: string;
  satuan: string;
  totalStok: number;
  minimumStok: number;
  statusAktif: boolean;
  updatedAt: string;
}

export interface ProductStock {
  id: string;
  productName: string;
  locationName: string;
  qty: number;
  barcodeLocation: string;
}

export interface StockInTransaction {
  id: string;
  kodeTransaksi: string;
  tipeMasuk: "pembelian" | "drop_barang";
  tanggal: string;
  supplier?: string;
  sumberDrop?: string;
  lokasiTujuan: string;
  totalItem: number;
  totalQty: number;
  dibuatOleh: string;
  appliedAt?: string;
}

export interface StockOutHistoryItem {
  id: string;
  kodeTransaksi: string;
  tanggal: string;
  lokasi: string;
  productName: string;
  qty: number;
  status: "draft" | "submitted" | "approved" | "rejected" | "cancelled";
  requestedBy: string;
}

export interface OpnameSession {
  id: string;
  kodeSesi: string;
  namaSesi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi: string;
  status: SessionStatus;
  progressPercent: number;
  totalItem: number;
  sudahDicek: number;
  selisihItem: number;
  dibuatOleh: string;
  petugas?: string;
}

export interface OpnameInputItem {
  id: string;
  sku: string;
  barcode: string;
  namaProduk: string;
  kategori: string;
  satuan: string;
  lokasi: string;
  stokSistem: number;
  stokFisik: number | null;
  selisih: number | null;
  nilaiSelisih: number | null;
  statusHasil: ItemResultStatus;
  kondisiBarang?: ItemCondition;
  catatan?: string;
  petugas?: string;
  dihitungAt?: string;
}

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: AppRole;
  locationName: string;
  statusAktif: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  createdAt: string;
}

export interface ReportOverviewItem {
  title: string;
  description: string;
  totalRows: number;
  lastExportAt: string;
}
