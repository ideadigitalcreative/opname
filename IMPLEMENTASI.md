# Rencana Implementasi - Sistem Manajemen Stok 

> File ini digunakan untuk tracking progress pengerjaan aplikasi.
> Update checklist setiap kali ada modul yang selesai dikerjakan.

---

## Info Proyek

| Item | Detail |
|------|--------|
| Nama | Sistem Manajemen Stok  |
| Stack | Next.js 16, TypeScript, Tailwind CSS, Supabase |
| Database | PostgreSQL (Supabase) |
| Script Setup | `supabase/setup-database.sql` (jalankan di SQL Editor) |
| Seed Data | `supabase/seed/seed.sql` |

---

## Progress Keseluruhan

```
[████████████████████] ~98%
```

---

## FASE 1: Fondasi & Infrastruktur

### 1.1 Database & Schema

- [x] Enum types (8 enum)
- [x] Tabel profiles
- [x] Tabel categories
- [x] Tabel units
- [x] Tabel locations
- [x] Tabel products
- [x] Tabel product_stocks
- [x] Tabel stock_in_transactions + stock_in_items
- [x] Tabel stock_out_transactions + stock_out_items
- [x] Tabel stock_movements
- [x] Tabel opname_sessions + opname_items
- [x] Tabel audit_logs
- [x] Tabel app_settings
- [x] Unique indexes
- [x] Performance indexes
- [x] Updated_at triggers (11 tabel)
- [x] Trigger auto-create profile dari auth.users
- [x] Trigger sync opname item fields (selisih + status_hasil)
- [x] RPC apply_stock_in()
- [x] RPC apply_stock_out()
- [x] RPC apply_opname_correction()
- [x] RLS policies (15 tabel)
- [x] Storage bucket opname-photos + policies
- [x] Seed data (kategori, satuan, lokasi, produk, stok awal)
- [x] Script setup-database.sql gabungan

### 1.2 Auth & Role

- [x] Supabase SSR client (server.ts)
- [x] Supabase browser client (client.ts)
- [x] Environment check (env.ts)
- [x] Cookie-based role detection (auth.ts)
- [x] Supabase Auth integration (login/actions.ts)
- [x] Mode demo lokal (tanpa Supabase)
- [x] Role helper functions di database (get_my_role, is_admin, is_admin_or_petugas)
- [x] Login page UI polish
- [x] Logout flow (via profile dropdown di topbar)
- [x] Register / invite user flow (admin invite via Supabase Auth)

### 1.3 Layout & Navigasi

- [x] Root layout (globals.css, fonts)
- [x] Dashboard layout (redirect jika belum login)
- [x] Dashboard shell (sidebar + topbar + content)
- [x] App sidebar (desktop, role-based menu, latar putih, fixed position)
- [x] App topbar (profile dropdown: logout + pengaturan)
- [x] Mobile navigation
- [x] Komponen UI reusable:
  - [x] Button
  - [x] DataTable
  - [x] EmptyState
  - [x] FilterBar
  - [x] PageHeader
  - [x] SearchInput
  - [x] StatCard
  - [x] StatusBadge
  - [x] DeleteButton (konfirmasi hapus)
  - [x] ProfileDropdown (menu user di header)
  - [x] SimpleBarChart
  - [x] Skeleton (skeleton loading components)
  - [x] ErrorDisplay (error boundary UI)
- [x] Utility functions (cn, format-currency, format-date, format-number)
- [x] Sidebar fixed position (tidak ikut scroll)
- [x] ProfileDropdown (menu user di header: logout + pengaturan)

---

## FASE 2: Master Data

### 2.1 Produk (Barang)

- [x] Halaman list produk (page.tsx)
- [x] Search & filter (nama, SKU, barcode, status)
- [x] Form tambah produk
- [x] Server action createProductAction (Zod validation)
- [x] Baca data dari Supabase (dengan fallback mock)
- [x] Hitung total stok dari product_stocks
- [x] Edit produk (inline / modal)
- [x] Delete produk (dengan konfirmasi dialog)
- [x] Detail produk page (info + stok per lokasi + riwayat mutasi)
- [ ] Import CSV

### 2.2 Kategori

- [x] Halaman list kategori (page.tsx)
- [x] Baca data dari Supabase (dengan fallback mock)
- [x] Form tambah kategori
- [x] Server action createCategoryAction
- [x] Edit kategori
- [x] Delete kategori (dengan konfirmasi dialog)

### 2.3 Satuan

- [x] Halaman list satuan (page.tsx)
- [x] Baca data dari Supabase (dengan fallback mock)
- [x] Form tambah satuan
- [x] Server action createUnitAction
- [x] Edit satuan
- [x] Delete satuan (dengan konfirmasi dialog)

### 2.4 Lokasi

- [x] Halaman list lokasi (page.tsx)
- [x] Search & filter (nama, kode, barcode, status)
- [x] Form tambah lokasi
- [x] Server action createLocationAction (Zod validation)
- [x] Baca data dari Supabase (dengan fallback mock)
- [x] Hitung total barang per lokasi
- [x] Edit lokasi
- [x] Delete lokasi (dengan konfirmasi dialog)
- [x] Generate / download QR code per lokasi (PNG + SVG via API route)

---

## FASE 3: Transaksi Stok

### 3.1 Stok Masuk

- [x] Halaman list transaksi stok masuk
- [x] Search & filter (kode, supplier, tipe masuk)
- [x] Form stok masuk (tipe, tanggal, produk, lokasi, qty, harga)
- [x] Server action createStockInAction (Zod validation)
- [x] Auto-apply stok via RPC apply_stock_in()
- [x] Baca data dari Supabase (dengan fallback mock)
- [x] Catat mutasi stok otomatis
- [x] Multi-item per transaksi (StockInMultiForm client component)
- [ ] Detail transaksi page
- [ ] Edit transaksi (sebelum apply)
- [ ] Cancel transaksi

### 3.2 Ambil Barang (Stok Keluar)

- [x] Halaman ambil barang (mobile-friendly)
- [x] Scan / input barcode lokasi
- [x] Tampilkan produk tersedia per lokasi (qty > 0)
- [x] Form ambil barang (qty, keperluan, catatan)
- [x] Server action createStockOutAction (Zod validation)
- [x] Auto-apply stok via RPC apply_stock_out()
- [x] Baca data dari Supabase (dengan fallback mock)
- [x] Riwayat pengambilan
- [ ] Mode approval_issue (butuh approval admin sebelum apply)
- [x] Multi-item per transaksi (StockOutMultiForm client component)
- [ ] Detail transaksi page

### 3.3 Mutasi Stok

- [x] Halaman list mutasi (skeleton UI)
- [x] Filter bar (placeholder)
- [x] Koneksi ke tabel stock_movements dari Supabase
- [x] Filter lokasi, tipe, tanggal yang berfungsi
- [x] Export CSV
- [ ] Detail mutasi

---

## FASE 4: Stock Opname (MODUL INTI)

### 4.1 Sesi Opname

- [x] Halaman list sesi (card layout)
- [x] Status badge per sesi
- [x] Progress bar per sesi
- [x] Baca data dari Supabase (dengan fallback mock)
- [x] Form buat sesi opname baru
- [x] Server action createOpnameSessionAction
- [x] Generate item otomatis dari snapshot stok lokasi
- [x] Ubah status sesi (draft -> aktif -> menunggu_approval -> disetujui/ditolak)
- [x] Detail sesi page (via opname/input dan opname/review)

### 4.2 Input Stok Fisik

- [x] Halaman input (mobile-friendly layout)
- [x] Stat cards (sesi aktif, progress, belum dicek, selisih)
- [x] Filter & search
- [x] OpnameInputCard component
- [x] Baca data dari Supabase (via getOpnameSessionDetail)
- [x] Server action updateOpnameItemAction (input stok_fisik)
- [x] Auto-sync selisih & status_hasil (via trigger database)
- [x] Catatan per item
- [x] Simpan progres (draft)
- [x] Filter berdasarkan status (belum_dicek, sesuai, lebih, kurang)
- [ ] Upload foto bukti ke storage opname-photos

### 4.3 Review & Approval

- [x] Halaman review (tabel selisih)
- [x] Format currency untuk nilai selisih
- [x] Baca data dari Supabase (via getOpnameSessionDetail)
- [x] Server action approveOpnameSessionAction (via updateSessionStatusAction)
- [x] Server action rejectOpnameSessionAction (via updateSessionStatusAction)
- [x] Ringkasan selisih (total item, sudah dicek, item selisih, total nilai)
- [x] Aksi: approve, reject, kembali ke aktif
- [x] Validasi: tolak jika masih ada item belum_dicek

### 4.4 Koreksi Stok (Adjustments)

- [x] Halaman koreksi (skeleton UI)
- [x] Koneksi ke RPC apply_opname_correction()
- [x] Server action applyCorrectionAction (via applyOpnameCorrectionAction)
- [x] Guard: hanya untuk sesi yang disetujui
- [x] Guard: idempotent (tidak bisa double correction)
- [x] Catat perubahan di stock_movements
- [x] Baca data dari Supabase (via getAdjustmentsCollection)
- [x] Update status sesi ke 'selesai'

---

## FASE 5: Laporan & Export

### 5.1 Laporan

- [x] Halaman laporan (skeleton)
- [x] Type definitions (ReportType, ReportPayload, dll)
- [x] Komponen filter:
  - [x] DateRangeFilter
  - [x] LocationFilter
  - [x] ProductFilter
  - [x] StatusFilter
  - [x] UserFilter
  - [x] ReportFilter (gabungan)
- [x] Komponen tampilan:
  - [x] ReportHeader
  - [x] ReportTable
  - [x] ReportSummaryCard
  - [x] EmptyReportState
- [x] Format report data utility
- [x] Report columns definitions
- [x] Koneksi data laporan ke Supabase
- [x] Laporan stok saat ini (via getProductStockReport)
- [x] Laporan stok per lokasi
- [x] Laporan stok masuk
- [x] Laporan pengambilan barang
- [x] Laporan mutasi stok
- [x] Laporan stock opname (via ExportButtons)
- [x] Laporan selisih opname (via adjustments page)
- [x] ExportButtons component (tombol CSV & PDF per tipe)

### 5.2 Export

- [x] ExportExcelButton component
- [x] ExportPdfButton component
- [x] ExcelJS dependency terinstall
- [x] jsPDF + jsPDF-autotable dependency terinstall
- [x] API route CSV export (/api/export/csv) — produk, stok, mutasi, opname
- [x] API route PDF export (/api/export/pdf) — produk, stok
- [x] API route Excel export (/api/export/xlsx) — produk, stok, mutasi
- [x] Format laporan perusahaan (header, logo, tanda tangan)

---

## FASE 6: Admin & Pengaturan

### 6.1 User & Role Management

- [x] Halaman users (tabel statis)
- [x] Type UserProfile
- [x] Baca data dari tabel profiles Supabase
- [x] Form tambah user (invite via Supabase Auth)
- [x] Edit role user (admin only)
- [x] Nonaktifkan user (deactivate)
- [ ] Assign lokasi ke petugas_gudang

### 6.2 Audit Log

- [x] Halaman audit log (tabel mock)
- [x] Type AuditLogItem
- [x] Baca data dari tabel audit_logs Supabase
- [x] Filter berdasarkan action, entity, user (dropdown + text input)
- [x] Tulis audit log otomatis dari setiap transaksi penting
- [ ] Detail log (old_data vs new_data diff)

### 6.3 Pengaturan

- [x] Halaman settings (skeleton)
- [x] Update profile (full_name) via server action
- [x] Update password via server action
- [ ] Konfigurasi app_settings via UI
- [ ] Pengaturan mode stock_out (direct_issue / approval_issue)
- [ ] Konfigurasi nama perusahaan & branding laporan
- [ ] Pengaturan toleransi opname
- [x] Info integrasi Supabase (URL, status koneksi)

---

## FASE 7: Dashboard

### 7.1 Dashboard Statistik

- [x] Stat cards (6 kartu untuk admin/petugas, 4 kartu untuk user)
- [x] Role-based tampilan
- [x] Baca data dari Supabase (getDashboardOverview - data asli)
- [x] Aktivitas terbaru dari stock_movements
- [x] Ringkasan statistik per role
- [x] Responsive layout (mobile-first grid)
- [x] Landing page responsive (sticky nav, grid 2 kolom mobile)
- [ ] Chart aktivitas gudang mingguan
- [x] Low stock alerts (peringatan stok rendah + link ke detail produk)
- [x] Quick actions (Stok Masuk, Ambil Barang, Opname, Laporan)

---

## FASE 8: Polish & Optimasi

### 8.1 UI/UX

- [x] Loading states (skeleton) — loading.tsx untuk semua halaman dashboard
- [x] Error boundary — error.tsx untuk semua halaman dashboard
- [x] Toast notifications (sukses/error) — custom ToastProvider + FlashToast
- [x] Konfirmasi dialog (DeleteButton dengan confirm)
- [x] Responsive testing (mobile/tablet/desktop)
- [x] Sidebar fixed (tidak ikut scroll)
- [ ] Dark mode (opsional)

### 8.2 Keamanan

- [ ] Review RLS policies
- [ ] Input sanitization
- [ ] Rate limiting server actions
- [ ] CSRF protection (built-in Next.js)
- [x] Audit log otomatis untuk semua transaksi penting (writeAuditLog utility)

### 8.3 Performance

- [x] Pagination untuk tabel data besar (PaginatedDataTable component)
- [ ] Infinite scroll untuk mobile
- [ ] Image optimization (opname photos)
- [ ] Cache strategy (revalidatePath sudah dipakai)
- [ ] Database query optimization

### 8.4 Testing

- [ ] Unit test (Zod schemas, utility functions)
- [ ] Integration test (server actions)
- [ ] E2E test (alur stok masuk -> ambil barang -> opname)
- [x] Test build production (`npm run build` — 27 routes, 0 errors)

---

## Catatan Teknis

### Struktur File Penting

```
src/
  app/
    (auth)/login/          -> Login page + server action
    (dashboard)/
      dashboard/           -> Dashboard statistik + loading.tsx + error.tsx
      products/            -> CRUD produk + actions.ts + loading.tsx + error.tsx + [id]/detail
      categories/          -> CRUD kategori + actions.ts + loading.tsx + error.tsx
      units/               -> CRUD satuan + actions.ts + loading.tsx + error.tsx
      locations/           -> CRUD lokasi + actions.ts + loading.tsx + error.tsx
      product-stocks/      -> Stok per lokasi (read-only) + loading.tsx + error.tsx
      stock-in/            -> Transaksi stok masuk + actions.ts + loading.tsx + error.tsx
      stock-out/           -> Ambil barang + actions.ts + loading.tsx + error.tsx
      movements/           -> Mutasi stok + loading.tsx + error.tsx
      opname/
        sessions/          -> List sesi opname + loading.tsx + error.tsx
        input/             -> Input stok fisik + loading.tsx + error.tsx
        review/            -> Review & approval + loading.tsx + error.tsx
        actions.ts         -> Server actions (create session, input stok, status update, koreksi)
      adjustments/         -> Koreksi stok + loading.tsx + error.tsx
      reports/             -> Laporan + loading.tsx + error.tsx
      users/               -> User management + actions.ts + loading.tsx + error.tsx
      audit-logs/          -> Audit trail + loading.tsx + error.tsx
      settings/            -> Pengaturan + loading.tsx + error.tsx
    api/export/
      csv/route.ts         -> Export CSV (produk, stok, mutasi, opname)
      pdf/route.ts         -> Export PDF (produk, stok)
      xlsx/route.ts        -> Export Excel (produk, stok, mutasi)
  components/
    layout/                -> Shell, sidebar, topbar, mobile nav, profile dropdown
    opname/                -> OpnameInputCard
    reports/               -> Filter, export components (ExportButtons)
    ui/                    -> Reusable UI components (Button, DataTable, PaginatedDataTable, EmptyState, FilterBar, PageHeader, SearchInput, StatCard, StatusBadge, DeleteButton, Skeleton, ErrorDisplay, SimpleBarChart, ToastProvider, FlashToast)
    forms/                 -> StockInMultiForm, StockOutMultiForm
  lib/
    services/
      master-data.ts       -> Data fetching (Supabase + mock fallback)
      mock-data.ts         -> Mock data & navigasi
    supabase/
      auth.ts              -> Auth & role helpers
      client.ts            -> Browser Supabase client
      env.ts               -> Environment check
      server.ts            -> Server Supabase client
    reports/               -> Report formatting & columns
    utils/                 -> cn, format-currency, format-date, format-number, audit-log
  types/
    app/index.ts           -> Semua type definitions
    report.ts              -> Report type definitions
supabase/
  setup-database.sql       -> Script setup database lengkap
  migrations/              -> Migration SQL
  seed/seed.sql            -> Seed data awal
```

### Pola yang Dipakai

1. **Server Actions**: Semua mutasi data via `"use server"` actions dengan Zod validation
2. **Mock Fallback**: Jika Supabase belum aktif, data mock otomatis dipakai
3. **Role-Based Access**: Menu dan data difilter berdasarkan role (admin, petugas_gudang, user)
4. **RPC Pattern**: Transaksi kompleks (stok masuk, keluar, opname) via PostgreSQL RPC functions
5. **Idempotent Guards**: RPC dicegah dari double-execution (cek applied_at, correction_applied_at)
6. **Revalidation**: `revalidatePath()` dipanggil setelah setiap mutasi untuk refresh data
7. **Loading States**: `loading.tsx` skeleton di setiap halaman dashboard
8. **Error Boundaries**: `error.tsx` dengan retry button di setiap halaman dashboard
9. **Export Pattern**: API routes `/api/export/csv`, `/api/export/pdf`, `/api/export/xlsx` untuk download file
10. **Audit Logging**: `writeAuditLog()` utility untuk mencatat semua transaksi penting ke tabel audit_logs
11. **Toast Notifications**: Custom `ToastProvider` + `FlashToast` untuk feedback UX yang lebih baik
12. **Multi-Item Forms**: Client component (`StockInMultiForm`, `StockOutMultiForm`) dengan dynamic rows, JSON hidden field untuk kirim data ke server action
13. **Product Detail**: Dynamic route `/products/[id]` dengan stok per lokasi + riwayat mutasi

### Command Penting

```bash
npm run dev        # Development server
npm run build      # Production build (27 routes, 0 errors)
npm run lint       # ESLint
```
