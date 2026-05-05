insert into public.categories (id, nama_kategori, deskripsi, status_aktif)
values
  ('11111111-1111-1111-1111-111111111111', 'Jaringan', 'Perangkat jaringan dan aksesorinya', true),
  ('11111111-1111-1111-1111-111111111112', 'Elektronik', 'Perangkat elektronik operasional', true),
  ('11111111-1111-1111-1111-111111111113', 'ATK', 'Alat tulis kantor dan label', true)
on conflict do nothing;

insert into public.units (id, nama_satuan, simbol, deskripsi, status_aktif)
values
  ('22222222-2222-2222-2222-222222222221', 'Pieces', 'pcs', 'Satuan per item', true),
  ('22222222-2222-2222-2222-222222222222', 'Box', 'box', 'Satuan per box', true),
  ('22222222-2222-2222-2222-222222222223', 'Roll', 'roll', 'Satuan gulungan', true)
on conflict do nothing;

insert into public.locations (id, kode_lokasi, nama_lokasi, tipe_lokasi, barcode_value, deskripsi, status_aktif)
values
  ('33333333-3333-3333-3333-333333333331', 'GUDANG-UTM', 'Gudang Utama', 'Gudang', 'LOC-GUDANG-UTM-2026', 'Gudang pusat operasional', true),
  ('33333333-3333-3333-3333-333333333332', 'GUDANG-CBG-A', 'Gudang Cabang A', 'Cabang', 'LOC-GUDANG-CBG-A-2026', 'Gudang cabang wilayah barat', true),
  ('33333333-3333-3333-3333-333333333333', 'RAK-TRANSIT', 'Rak Transit', 'Rak', 'LOC-RAK-TRANSIT-2026', 'Area transit barang keluar masuk', true)
on conflict do nothing;

insert into public.products (
  id,
  sku,
  barcode_produk,
  nama_produk,
  kategori_id,
  satuan_id,
  deskripsi,
  minimum_stok,
  status_aktif
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

insert into public.product_stocks (product_id, location_id, qty)
values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 24),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333332', 3),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333333', 6)
on conflict (product_id, location_id) do nothing;
