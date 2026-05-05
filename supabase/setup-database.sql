-- ============================================================
-- SISTEM MANAJEMEN STOK GUDANG
-- Script Setup Database Supabase Lengkap
-- Jalankan seluruh script ini di Supabase SQL Editor
-- ============================================================

-- ============================================================
-- BAGIAN 1: EXTENSIONS & ENUM TYPES
-- ============================================================

create extension if not exists "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'petugas_gudang', 'user');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_in_type') THEN
    CREATE TYPE public.stock_in_type AS ENUM ('pembelian', 'drop_barang');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_out_status') THEN
    CREATE TYPE public.stock_out_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'session_status') THEN
    CREATE TYPE public.session_status AS ENUM (
      'draft',
      'aktif',
      'menunggu_approval',
      'disetujui',
      'ditolak',
      'selesai',
      'dibatalkan'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_result_status') THEN
    CREATE TYPE public.item_result_status AS ENUM (
      'belum_dicek',
      'cocok',
      'lebih',
      'kurang',
      'tidak_ditemukan',
      'rusak'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_type') THEN
    CREATE TYPE public.movement_type AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'OPNAME');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_source_type') THEN
    CREATE TYPE public.movement_source_type AS ENUM ('pembelian', 'drop_barang', 'pengambilan', 'koreksi', 'opname');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_mode') THEN
    CREATE TYPE public.issue_mode AS ENUM ('direct_issue', 'approval_issue');
  END IF;
END
$$;

-- ============================================================
-- BAGIAN 2: HELPER FUNCTIONS (TRIGGERS)
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    status_aktif
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'user'),
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ============================================================
-- BAGIAN 3: TABLES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role public.app_role not null default 'user',
  avatar_url text,
  phone text,
  status_aktif boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  nama_kategori text not null,
  deskripsi text,
  status_aktif boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  nama_satuan text not null,
  simbol text not null,
  deskripsi text,
  status_aktif boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  kode_lokasi text not null,
  nama_lokasi text not null,
  tipe_lokasi text not null,
  barcode_value text not null,
  deskripsi text,
  status_aktif boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint locations_kode_not_blank check (length(trim(kode_lokasi)) > 0),
  constraint locations_name_not_blank check (length(trim(nama_lokasi)) > 0),
  constraint locations_barcode_not_blank check (length(trim(barcode_value)) > 0)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  barcode_produk text,
  nama_produk text not null,
  kategori_id uuid not null references public.categories(id) on delete restrict,
  satuan_id uuid not null references public.units(id) on delete restrict,
  deskripsi text,
  minimum_stok numeric(14,2) not null default 0,
  status_aktif boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint products_sku_not_blank check (length(trim(sku)) > 0),
  constraint products_name_not_blank check (length(trim(nama_produk)) > 0),
  constraint products_minimum_stock_non_negative check (minimum_stok >= 0)
);

create table if not exists public.product_stocks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  qty numeric(14,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint product_stocks_qty_non_negative check (qty >= 0),
  constraint product_stocks_unique_product_location unique (product_id, location_id)
);

create table if not exists public.stock_in_transactions (
  id uuid primary key default gen_random_uuid(),
  kode_transaksi text not null unique,
  tipe_masuk public.stock_in_type not null,
  tanggal date not null,
  supplier text,
  sumber_drop text,
  catatan text,
  dibuat_oleh uuid references public.profiles(id) on delete set null,
  applied_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stock_in_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.stock_in_transactions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  qty numeric(14,2) not null,
  harga_beli numeric(14,2) not null default 0,
  catatan text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint stock_in_items_qty_positive check (qty > 0),
  constraint stock_in_items_purchase_non_negative check (harga_beli >= 0)
);

create table if not exists public.stock_out_transactions (
  id uuid primary key default gen_random_uuid(),
  kode_transaksi text not null unique,
  tanggal date not null,
  location_id uuid not null references public.locations(id) on delete restrict,
  diambil_oleh uuid not null references public.profiles(id) on delete restrict,
  keperluan text,
  catatan text,
  status public.stock_out_status not null default 'draft',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stock_out_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.stock_out_transactions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  qty numeric(14,2) not null,
  stok_sebelum numeric(14,2),
  stok_sesudah numeric(14,2),
  catatan text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint stock_out_items_qty_positive check (qty > 0)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  movement_type public.movement_type not null,
  source_type public.movement_source_type not null,
  source_id uuid,
  qty_change numeric(14,2) not null,
  qty_before numeric(14,2) not null,
  qty_after numeric(14,2) not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint stock_movements_non_zero_change check (qty_change <> 0),
  constraint stock_movements_non_negative_balance check (qty_before >= 0 and qty_after >= 0)
);

create table if not exists public.opname_sessions (
  id uuid primary key default gen_random_uuid(),
  kode_sesi text not null unique,
  nama_sesi text not null,
  location_id uuid not null references public.locations(id) on delete restrict,
  tanggal_mulai date not null,
  tanggal_selesai date,
  status public.session_status not null default 'draft',
  dibuat_oleh uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  correction_applied_at timestamptz,
  catatan text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint opname_sessions_name_not_blank check (length(trim(nama_sesi)) > 0),
  constraint opname_sessions_date_order check (tanggal_selesai is null or tanggal_selesai >= tanggal_mulai)
);

create table if not exists public.opname_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.opname_sessions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  stok_sistem_snapshot numeric(14,2) not null default 0,
  stok_fisik numeric(14,2),
  selisih numeric(14,2),
  status_hasil public.item_result_status not null default 'belum_dicek',
  catatan text,
  dihitung_oleh uuid references public.profiles(id) on delete set null,
  dihitung_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint opname_items_unique_row unique (session_id, product_id, location_id),
  constraint opname_items_snapshot_non_negative check (stok_sistem_snapshot >= 0),
  constraint opname_items_physical_non_negative check (stok_fisik is null or stok_fisik >= 0)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_settings (
  setting_key text primary key,
  setting_value jsonb not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ============================================================
-- BAGIAN 4: UNIQUE INDEXES
-- ============================================================

create unique index if not exists categories_nama_kategori_key on public.categories (lower(nama_kategori));
create unique index if not exists units_nama_satuan_key on public.units (lower(nama_satuan));
create unique index if not exists units_simbol_key on public.units (lower(simbol));
create unique index if not exists locations_kode_lokasi_key on public.locations (lower(kode_lokasi));
create unique index if not exists locations_barcode_key on public.locations (lower(barcode_value));
create unique index if not exists products_sku_key on public.products (lower(sku));
create unique index if not exists products_barcode_key on public.products (lower(barcode_produk)) where barcode_produk is not null;

-- ============================================================
-- BAGIAN 5: PERFORMANCE INDEXES
-- ============================================================

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_products_nama on public.products (nama_produk);
create index if not exists idx_products_kategori on public.products (kategori_id);
create index if not exists idx_product_stocks_product on public.product_stocks (product_id);
create index if not exists idx_product_stocks_location on public.product_stocks (location_id);
create index if not exists idx_stock_in_transactions_date on public.stock_in_transactions (tanggal);
create index if not exists idx_stock_out_transactions_date on public.stock_out_transactions (tanggal);
create index if not exists idx_stock_out_transactions_user on public.stock_out_transactions (diambil_oleh);
create index if not exists idx_stock_movements_product on public.stock_movements (product_id);
create index if not exists idx_stock_movements_location on public.stock_movements (location_id);
create index if not exists idx_stock_movements_created_at on public.stock_movements (created_at desc);
create index if not exists idx_opname_sessions_location on public.opname_sessions (location_id);
create index if not exists idx_opname_sessions_status on public.opname_sessions (status);
create index if not exists idx_opname_items_session on public.opname_items (session_id);
create index if not exists idx_audit_logs_user on public.audit_logs (user_id);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);

-- ============================================================
-- BAGIAN 6: UPDATED_AT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS set_units_updated_at ON public.units;
create trigger set_units_updated_at before update on public.units for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS set_locations_updated_at ON public.locations;
create trigger set_locations_updated_at before update on public.locations for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
create trigger set_products_updated_at before update on public.products for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS set_product_stocks_updated_at ON public.product_stocks;
create trigger set_product_stocks_updated_at before update on public.product_stocks for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS set_stock_in_transactions_updated_at ON public.stock_in_transactions;
create trigger set_stock_in_transactions_updated_at before update on public.stock_in_transactions for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS set_stock_out_transactions_updated_at ON public.stock_out_transactions;
create trigger set_stock_out_transactions_updated_at before update on public.stock_out_transactions for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS set_opname_sessions_updated_at ON public.opname_sessions;
create trigger set_opname_sessions_updated_at before update on public.opname_sessions for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS set_opname_items_updated_at ON public.opname_items;
create trigger set_opname_items_updated_at before update on public.opname_items for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS set_app_settings_updated_at ON public.app_settings;
create trigger set_app_settings_updated_at before update on public.app_settings for each row execute function public.set_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user_profile();

-- ============================================================
-- BAGIAN 7: OPNAME AUTO-SYNC TRIGGER
-- ============================================================

create or replace function public.sync_opname_item_fields()
returns trigger
language plpgsql
as $$
begin
  if new.stok_fisik is null then
    new.selisih = null;
    new.status_hasil = 'belum_dicek';
    return new;
  end if;

  new.selisih = new.stok_fisik - new.stok_sistem_snapshot;

  if new.selisih = 0 then
    new.status_hasil = 'cocok';
  elsif new.selisih > 0 then
    new.status_hasil = 'lebih';
  else
    new.status_hasil = 'kurang';
  end if;

  return new;
end;
$$;

DROP TRIGGER IF EXISTS trg_sync_opname_item_fields ON public.opname_items;
create trigger trg_sync_opname_item_fields before insert or update on public.opname_items for each row execute function public.sync_opname_item_fields();

-- ============================================================
-- BAGIAN 8: ROLE HELPER FUNCTIONS
-- ============================================================

create or replace function public.get_my_role()
returns public.app_role
language sql
stable
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.get_my_role() = 'admin', false)
$$;

create or replace function public.is_admin_or_petugas()
returns boolean
language sql
stable
as $$
  select coalesce(public.get_my_role() in ('admin', 'petugas_gudang'), false)
$$;

create or replace function public.get_issue_mode()
returns public.issue_mode
language sql
stable
as $$
  select coalesce(
    (
      select (setting_value ->> 'mode')::public.issue_mode
      from public.app_settings
      where setting_key = 'stock_out_mode'
      limit 1
    ),
    'direct_issue'::public.issue_mode
  )
$$;

-- ============================================================
-- BAGIAN 9: RPC - APPLY STOCK IN
-- ============================================================

create or replace function public.apply_stock_in(p_transaction_id uuid, p_actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.stock_in_transactions%rowtype;
  v_item record;
  v_before numeric(14,2);
  v_after numeric(14,2);
  v_source_type public.movement_source_type;
begin
  select *
  into v_transaction
  from public.stock_in_transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaksi stok masuk tidak ditemukan';
  end if;

  if v_transaction.applied_at is not null then
    raise exception 'Transaksi stok masuk sudah pernah diaplikasikan';
  end if;

  if v_transaction.tipe_masuk = 'pembelian' then
    v_source_type := 'pembelian';
  else
    v_source_type := 'drop_barang';
  end if;

  for v_item in
    select *
    from public.stock_in_items
    where transaction_id = p_transaction_id
  loop
    insert into public.product_stocks (product_id, location_id, qty)
    values (v_item.product_id, v_item.location_id, 0)
    on conflict (product_id, location_id) do nothing;

    select qty
    into v_before
    from public.product_stocks
    where product_id = v_item.product_id and location_id = v_item.location_id
    for update;

    v_after := v_before + v_item.qty;

    update public.product_stocks
    set qty = v_after
    where product_id = v_item.product_id and location_id = v_item.location_id;

    insert into public.stock_movements (
      product_id,
      location_id,
      movement_type,
      source_type,
      source_id,
      qty_change,
      qty_before,
      qty_after,
      description,
      created_by
    )
    values (
      v_item.product_id,
      v_item.location_id,
      'IN',
      v_source_type,
      v_transaction.id,
      v_item.qty,
      v_before,
      v_after,
      concat('Stok masuk ', v_transaction.tipe_masuk::text, ' - ', v_transaction.kode_transaksi),
      coalesce(p_actor, v_transaction.dibuat_oleh)
    );
  end loop;

  update public.stock_in_transactions
  set applied_at = timezone('utc', now())
  where id = p_transaction_id;
end;
$$;

-- ============================================================
-- BAGIAN 10: RPC - APPLY STOCK OUT
-- ============================================================

create or replace function public.apply_stock_out(p_transaction_id uuid, p_actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.stock_out_transactions%rowtype;
  v_item record;
  v_issue_mode public.issue_mode;
  v_before numeric(14,2);
  v_after numeric(14,2);
begin
  select *
  into v_transaction
  from public.stock_out_transactions
  where id = p_transaction_id
  for update;

  if not found then
    raise exception 'Transaksi pengambilan tidak ditemukan';
  end if;

  if v_transaction.applied_at is not null then
    raise exception 'Transaksi pengambilan sudah pernah diaplikasikan';
  end if;

  if v_transaction.status in ('rejected', 'cancelled') then
    raise exception 'Transaksi tidak dapat dijalankan karena status %', v_transaction.status;
  end if;

  v_issue_mode := public.get_issue_mode();

  if v_issue_mode = 'approval_issue' and v_transaction.status <> 'approved' then
    raise exception 'Mode approval aktif. Transaksi harus approved sebelum stok berkurang';
  end if;

  if v_issue_mode = 'direct_issue' and v_transaction.status not in ('submitted', 'approved') then
    raise exception 'Transaksi harus submitted sebelum stok dapat dikurangi';
  end if;

  for v_item in
    select *
    from public.stock_out_items
    where transaction_id = p_transaction_id
  loop
    select qty
    into v_before
    from public.product_stocks
    where product_id = v_item.product_id and location_id = v_transaction.location_id
    for update;

    if v_before is null then
      raise exception 'Stok produk tidak ditemukan pada lokasi transaksi';
    end if;

    if v_before < v_item.qty then
      raise exception 'Stok tidak cukup untuk produk % pada lokasi transaksi', v_item.product_id;
    end if;

    v_after := v_before - v_item.qty;

    update public.product_stocks
    set qty = v_after
    where product_id = v_item.product_id and location_id = v_transaction.location_id;

    update public.stock_out_items
    set stok_sebelum = v_before, stok_sesudah = v_after
    where id = v_item.id;

    insert into public.stock_movements (
      product_id,
      location_id,
      movement_type,
      source_type,
      source_id,
      qty_change,
      qty_before,
      qty_after,
      description,
      created_by
    )
    values (
      v_item.product_id,
      v_transaction.location_id,
      'OUT',
      'pengambilan',
      v_transaction.id,
      0 - v_item.qty,
      v_before,
      v_after,
      concat('Pengambilan barang - ', v_transaction.kode_transaksi),
      coalesce(p_actor, v_transaction.diambil_oleh)
    );
  end loop;

  update public.stock_out_transactions
  set
    applied_at = timezone('utc', now()),
    status = case
      when v_issue_mode = 'approval_issue' then 'approved'::public.stock_out_status
      else 'submitted'::public.stock_out_status
    end
  where id = p_transaction_id;
end;
$$;

-- ============================================================
-- BAGIAN 11: RPC - APPLY OPNAME CORRECTION
-- ============================================================

create or replace function public.apply_opname_correction(p_session_id uuid, p_actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.opname_sessions%rowtype;
  v_item record;
  v_before numeric(14,2);
  v_after numeric(14,2);
  v_change numeric(14,2);
begin
  select *
  into v_session
  from public.opname_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Sesi opname tidak ditemukan';
  end if;

  if v_session.status <> 'disetujui' then
    raise exception 'Koreksi opname hanya boleh dijalankan untuk sesi yang disetujui';
  end if;

  if v_session.correction_applied_at is not null then
    raise exception 'Koreksi opname sudah pernah dijalankan';
  end if;

  for v_item in
    select *
    from public.opname_items
    where session_id = p_session_id
      and stok_fisik is not null
  loop
    insert into public.product_stocks (product_id, location_id, qty)
    values (v_item.product_id, v_item.location_id, 0)
    on conflict (product_id, location_id) do nothing;

    select qty
    into v_before
    from public.product_stocks
    where product_id = v_item.product_id and location_id = v_item.location_id
    for update;

    v_after := v_item.stok_fisik;
    v_change := v_after - v_before;

    update public.product_stocks
    set qty = v_after
    where product_id = v_item.product_id and location_id = v_item.location_id;

    if v_change <> 0 then
      insert into public.stock_movements (
        product_id,
        location_id,
        movement_type,
        source_type,
        source_id,
        qty_change,
        qty_before,
        qty_after,
        description,
        created_by
      )
      values (
        v_item.product_id,
        v_item.location_id,
        'OPNAME',
        'opname',
        v_session.id,
        v_change,
        v_before,
        v_after,
        concat('Koreksi hasil opname - ', v_session.kode_sesi),
        coalesce(p_actor, v_session.approved_by)
      );
    end if;
  end loop;

  update public.opname_sessions
  set
    correction_applied_at = timezone('utc', now()),
    status = 'selesai'
  where id = p_session_id;
end;
$$;

-- ============================================================
-- BAGIAN 12: ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.units enable row level security;
alter table public.locations enable row level security;
alter table public.products enable row level security;
alter table public.product_stocks enable row level security;
alter table public.stock_in_transactions enable row level security;
alter table public.stock_in_items enable row level security;
alter table public.stock_out_transactions enable row level security;
alter table public.stock_out_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.opname_sessions enable row level security;
alter table public.opname_items enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

-- PROFILES
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles for update to authenticated using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_admin_insert" on public.profiles;
create policy "profiles_admin_insert" on public.profiles for insert to authenticated with check (public.is_admin());

drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles for delete to authenticated using (public.is_admin());

-- CATEGORIES
drop policy if exists "categories_read_authenticated" on public.categories;
create policy "categories_read_authenticated" on public.categories for select to authenticated using (true);
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select to anon using (true);

drop policy if exists "categories_admin_manage" on public.categories;
create policy "categories_admin_manage" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- UNITS
drop policy if exists "units_read_authenticated" on public.units;
create policy "units_read_authenticated" on public.units for select to authenticated using (true);
drop policy if exists "units_public_read" on public.units;
create policy "units_public_read" on public.units for select to anon using (true);

drop policy if exists "units_admin_manage" on public.units;
create policy "units_admin_manage" on public.units for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- LOCATIONS
drop policy if exists "locations_read_authenticated" on public.locations;
create policy "locations_read_authenticated" on public.locations for select to authenticated using (true);
drop policy if exists "locations_public_read" on public.locations;
create policy "locations_public_read" on public.locations for select to anon using (true);

drop policy if exists "locations_admin_petugas_manage" on public.locations;
create policy "locations_admin_petugas_manage" on public.locations for all to authenticated using (public.is_admin_or_petugas()) with check (public.is_admin_or_petugas());

-- PRODUCTS
drop policy if exists "products_read_authenticated" on public.products;
create policy "products_read_authenticated" on public.products for select to authenticated using (true);
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon using (true);

drop policy if exists "products_admin_manage" on public.products;
create policy "products_admin_manage" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- PRODUCT STOCKS
drop policy if exists "product_stocks_read_authenticated" on public.product_stocks;
create policy "product_stocks_read_authenticated" on public.product_stocks for select to authenticated using (true);

drop policy if exists "product_stocks_public_read" on public.product_stocks;
create policy "product_stocks_public_read" on public.product_stocks for select to anon using (true);

drop policy if exists "product_stocks_admin_manage" on public.product_stocks;
create policy "product_stocks_admin_manage" on public.product_stocks for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- STOCK IN TRANSACTIONS
drop policy if exists "stock_in_transactions_read_admin_petugas" on public.stock_in_transactions;
create policy "stock_in_transactions_read_admin_petugas" on public.stock_in_transactions for select to authenticated using (public.is_admin_or_petugas());

drop policy if exists "stock_in_transactions_manage_admin_petugas" on public.stock_in_transactions;
create policy "stock_in_transactions_manage_admin_petugas" on public.stock_in_transactions for all to authenticated using (public.is_admin_or_petugas()) with check (public.is_admin_or_petugas());

-- STOCK IN ITEMS
drop policy if exists "stock_in_items_read_admin_petugas" on public.stock_in_items;
create policy "stock_in_items_read_admin_petugas" on public.stock_in_items for select to authenticated using (public.is_admin_or_petugas());

drop policy if exists "stock_in_items_manage_admin_petugas" on public.stock_in_items;
create policy "stock_in_items_manage_admin_petugas" on public.stock_in_items for all to authenticated using (public.is_admin_or_petugas()) with check (public.is_admin_or_petugas());

-- STOCK OUT TRANSACTIONS
drop policy if exists "stock_out_transactions_read_policy" on public.stock_out_transactions;
create policy "stock_out_transactions_read_policy" on public.stock_out_transactions for select to authenticated using (public.is_admin_or_petugas() or diambil_oleh = auth.uid());

drop policy if exists "stock_out_transactions_insert_policy" on public.stock_out_transactions;
create policy "stock_out_transactions_insert_policy" on public.stock_out_transactions for insert to authenticated with check (public.is_admin_or_petugas() or diambil_oleh = auth.uid());

drop policy if exists "stock_out_transactions_update_policy" on public.stock_out_transactions;
create policy "stock_out_transactions_update_policy" on public.stock_out_transactions for update to authenticated using (public.is_admin_or_petugas() or diambil_oleh = auth.uid()) with check (public.is_admin_or_petugas() or diambil_oleh = auth.uid());

-- STOCK OUT ITEMS
drop policy if exists "stock_out_items_read_policy" on public.stock_out_items;
create policy "stock_out_items_read_policy" on public.stock_out_items for select to authenticated using (
  public.is_admin_or_petugas()
);

drop policy if exists "stock_out_items_manage_policy" on public.stock_out_items;
create policy "stock_out_items_manage_policy" on public.stock_out_items for all to authenticated using (
  public.is_admin_or_petugas()
) with check (
  public.is_admin_or_petugas()
);

-- STOCK MOVEMENTS
drop policy if exists "stock_movements_read_admin_petugas" on public.stock_movements;
create policy "stock_movements_read_admin_petugas" on public.stock_movements for select to authenticated using (public.is_admin_or_petugas());

drop policy if exists "stock_movements_public_read" on public.stock_movements;
create policy "stock_movements_public_read" on public.stock_movements for select to anon using (true);

--- OPNAME SESSIONS
drop policy if exists "opname_sessions_read_admin_petugas" on public.opname_sessions;
create policy "opname_sessions_read_admin_petugas" on public.opname_sessions for select to authenticated using (public.is_admin_or_petugas());

drop policy if exists "opname_sessions_manage_admin_petugas" on public.opname_sessions;
create policy "opname_sessions_manage_admin_petugas" on public.opname_sessions for all to authenticated using (public.is_admin_or_petugas()) with check (public.is_admin_or_petugas());

-- OPNAME ITEMS
drop policy if exists "opname_items_read_admin_petugas" on public.opname_items;
create policy "opname_items_read_admin_petugas" on public.opname_items for select to authenticated using (public.is_admin_or_petugas());

drop policy if exists "opname_items_manage_admin_petugas" on public.opname_items;
create policy "opname_items_manage_admin_petugas" on public.opname_items for all to authenticated using (public.is_admin_or_petugas()) with check (public.is_admin_or_petugas());

-- AUDIT LOGS
drop policy if exists "audit_logs_read_admin" on public.audit_logs;
create policy "audit_logs_read_admin" on public.audit_logs for select to authenticated using (public.is_admin());

drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;
create policy "audit_logs_insert_authenticated" on public.audit_logs for insert to authenticated with check (auth.uid() is not null);

-- APP SETTINGS
drop policy if exists "app_settings_read_authenticated" on public.app_settings;
create policy "app_settings_read_authenticated" on public.app_settings for select to authenticated using (true);

drop policy if exists "app_settings_admin_manage" on public.app_settings;
create policy "app_settings_admin_manage" on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- BAGIAN 13: STORAGE BUCKET & POLICIES
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'opname-photos',
  'opname-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "opname_photos_read_authenticated" on storage.objects;
create policy "opname_photos_read_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'opname-photos');

drop policy if exists "opname_photos_insert_admin_petugas" on storage.objects;
create policy "opname_photos_insert_admin_petugas"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'opname-photos'
  and public.get_my_role() in ('admin', 'petugas_gudang')
);

drop policy if exists "opname_photos_update_admin_petugas" on storage.objects;
create policy "opname_photos_update_admin_petugas"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'opname-photos'
  and public.get_my_role() in ('admin', 'petugas_gudang')
)
with check (
  bucket_id = 'opname-photos'
  and public.get_my_role() in ('admin', 'petugas_gudang')
);

-- ============================================================
-- BAGIAN 14: DEFAULT APP SETTINGS
-- ============================================================

insert into public.app_settings (setting_key, setting_value, description)
values (
  'stock_out_mode',
  jsonb_build_object('mode', 'direct_issue'),
  'Mode default pengambilan barang. direct_issue atau approval_issue.'
)
on conflict (setting_key) do nothing;

-- ============================================================
-- BAGIAN 15: SEED DATA (SESUAI SCHEMA APLIKASI)
-- ============================================================

-- Kategori
insert into public.categories (id, nama_kategori, deskripsi, status_aktif)
values
  ('11111111-1111-1111-1111-111111111111', 'Jaringan', 'Perangkat jaringan dan aksesorinya', true),
  ('11111111-1111-1111-1111-111111111112', 'Elektronik', 'Perangkat elektronik operasional', true),
  ('11111111-1111-1111-1111-111111111113', 'ATK', 'Alat tulis kantor dan label', true)
on conflict do nothing;

-- Satuan
insert into public.units (id, nama_satuan, simbol, deskripsi, status_aktif)
values
  ('22222222-2222-2222-2222-222222222221', 'Pieces', 'pcs', 'Satuan per item', true),
  ('22222222-2222-2222-2222-222222222222', 'Box', 'box', 'Satuan per box', true),
  ('22222222-2222-2222-2222-222222222223', 'Roll', 'roll', 'Satuan gulungan', true)
on conflict do nothing;

-- Lokasi
insert into public.locations (id, kode_lokasi, nama_lokasi, tipe_lokasi, barcode_value, deskripsi, status_aktif)
values
  ('33333333-3333-3333-3333-333333333331', 'GUDANG-UTM', 'Gudang Utama', 'Gudang', 'LOC-GUDANG-UTM-2026', 'Gudang pusat operasional', true),
  ('33333333-3333-3333-3333-333333333332', 'GUDANG-CBG-A', 'Gudang Cabang A', 'Cabang', 'LOC-GUDANG-CBG-A-2026', 'Gudang cabang wilayah barat', true),
  ('33333333-3333-3333-3333-333333333333', 'RAK-TRANSIT', 'Rak Transit', 'Rak', 'LOC-RAK-TRANSIT-2026', 'Area transit barang keluar masuk', true)
on conflict do nothing;

-- Produk
insert into public.products (
  id, sku, barcode_produk, nama_produk, kategori_id, satuan_id, deskripsi, minimum_stok, status_aktif
)
values
  (
    '44444444-4444-4444-4444-444444444441',
    'SKU-001',
    '899100100001',
    'Kabel LAN Cat6',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    'Kabel jaringan Cat6 100m',
    10,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    'SKU-002',
    '899100100002',
    'Patch Panel 24 Port',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'Patch panel rackmount 24 port',
    5,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444443',
    'SKU-003',
    '899100100003',
    'Label Rak 10x5',
    '11111111-1111-1111-1111-111111111113',
    '22222222-2222-2222-2222-222222222222',
    'Label untuk rak gudang',
    8,
    true
  )
on conflict do nothing;

-- Stok awal per lokasi
insert into public.product_stocks (product_id, location_id, qty)
values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 24),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332', 3),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 6)
on conflict (product_id, location_id) do nothing;

-- ============================================================
-- SELESAI. Database siap digunakan.
-- ============================================================
