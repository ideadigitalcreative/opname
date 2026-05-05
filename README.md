# Manajemen Stok Gudang Web

Aplikasi manajemen stok gudang berbasis **Next.js App Router**, **TypeScript**, dan dipersiapkan untuk **Supabase** sebagai authentication, PostgreSQL, RLS, storage, serta proses stok yang aman dari double count.

Fondasi saat ini sudah mencakup:

- Shell dashboard responsif
- Sidebar desktop untuk admin dan petugas gudang
- Mobile navigation untuk penggunaan di HP
- Pembeda role `admin`, `petugas_gudang`, dan `user`
- Halaman utama untuk dashboard, master data, stok per lokasi, stok masuk, ambil barang, mutasi stok, stock opname, laporan, user, audit log, dan pengaturan
- SQL migration Supabase lengkap
- Seed data awal untuk kategori, satuan, lokasi, dan barang

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Supabase SSR + Supabase JS
- Zod
- Lucide React
- ExcelJS / jsPDF untuk fondasi export

## Struktur Folder

```text
src/
  app/
    (auth)/
      login/
    (dashboard)/
      dashboard/
      products/
      categories/
      units/
      locations/
      product-stocks/
      stock-in/
      stock-out/
      movements/
      opname/
        sessions/
        input/
        review/
      adjustments/
      reports/
      users/
      audit-logs/
      settings/
  components/
    layout/
    ui/
    opname/
  lib/
    services/
    supabase/
    utils/
  types/
    app/
supabase/
  migrations/
  seed/
```

## Setup Lokal

1. Install dependency

```bash
npm install
```

2. Copy env file

```bash
copy .env.example .env.local
```

3. Isi environment Supabase di `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

4. Jalankan development server

```bash
npm run dev
```

5. Buka aplikasi di:

```text
http://localhost:3000
```

## Login Demo Lokal

Jika env Supabase belum diisi, aplikasi tetap bisa diuji dalam mode lokal:

1. Buka `/login`
2. Isi nama pengguna
3. Pilih role:
   - `admin`
   - `petugas_gudang`
   - `user`
4. Sistem menyimpan role ke cookie lokal dan menampilkan menu sesuai role

## Setup Supabase

1. Buat project baru di Supabase
2. Jalankan migration SQL dari:

```text
supabase/migrations/202604290001_init_stock_opname.sql
```

3. Jalankan seed data awal dari:

```text
supabase/seed/seed.sql
```

4. Pastikan bucket storage `opname-photos` tersedia

Migration saat ini sudah mencakup:

- Enum role, jenis stok masuk, status transaksi keluar, status sesi opname, hasil opname, jenis mutasi, sumber mutasi, dan mode issue
- Tabel:
  - `profiles`
  - `categories`
  - `units`
  - `locations`
  - `products`
  - `product_stocks`
  - `stock_in_transactions`
  - `stock_in_items`
  - `stock_out_transactions`
  - `stock_out_items`
  - `stock_movements`
  - `opname_sessions`
  - `opname_items`
  - `audit_logs`
  - `app_settings`
- Trigger `updated_at`
- Trigger auto-create profile dari `auth.users`
- Trigger sinkronisasi `selisih` dan `status_hasil` opname
- RPC `apply_stock_in()`
- RPC `apply_stock_out()`
- RPC `apply_opname_correction()`
- RLS policy dasar
- Storage bucket policy untuk `opname-photos`

## Perintah Penting

Lint:

```bash
npm run lint
```

Build produksi:

```bash
npm run build
```

## Route Utama

- `/login`
- `/dashboard`
- `/products`
- `/categories`
- `/units`
- `/locations`
- `/product-stocks`
- `/stock-in`
- `/stock-out`
- `/movements`
- `/opname/sessions`
- `/opname/input`
- `/opname/review`
- `/adjustments`
- `/reports`
- `/users`
- `/audit-logs`
- `/settings`

## Status Implementasi Saat Ini

Sudah tersedia:

- Shell dashboard responsif
- Role-based navigation
- Proxy proteksi route
- Master data page skeleton
- Stok per lokasi page skeleton
- Stok masuk page skeleton
- Ambil barang mobile-friendly page skeleton
- Mutasi stok page skeleton
- Sesi opname page skeleton
- Input opname mobile-friendly skeleton
- Review hasil opname
- Halaman koreksi stok
- Halaman laporan
- SQL migration dan seed

Masih akan dilanjutkan:

- Integrasi penuh Supabase Auth
- CRUD nyata ke database
- Upload foto ke storage
- Scan barcode browser
- Approval aksi server
- Export CSV/PDF/Excel nyata
- Audit log otomatis dari aksi server

## Deploy

Deploy-ready untuk Vercel dengan catatan:

- Tambahkan env Supabase di project Vercel
- Pastikan migration dan storage policy sudah diterapkan di Supabase
- Gunakan domain production Supabase yang benar
