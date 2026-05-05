-- ============================================================
-- SEEDER DATA PRODUK LABORATORIUM
-- Kategori: BMHP, REAGEN kit
-- Satuan: Box, Pack, Pcs, Botol
-- 30 Produk + stok di Penyimpanan LAB-Mikro
-- Aman dijalankan berulang kali (tidak akan duplikat).
-- ============================================================

-- KATEGORI
INSERT INTO public.categories (nama_kategori, deskripsi, status_aktif)
SELECT v.nama, v.desk, true
FROM (VALUES
  ('BMHP', 'Bahan Medis Habis Pakai'),
  ('REAGEN kit', 'Reagen dan Kit Laboratorium')
) AS v(nama, desk)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c WHERE lower(c.nama_kategori) = lower(v.nama)
);

-- SATUAN
INSERT INTO public.units (nama_satuan, simbol, deskripsi, status_aktif)
SELECT v.nama, v.simbol, v.desk, true
FROM (VALUES
  ('Box', 'box', 'Kardus / box'),
  ('Pack', 'pack', 'Pak / bungkus'),
  ('Pcs', 'pcs', 'Pieces / satuan'),
  ('Botol', 'botol', 'Botol')
) AS v(nama, simbol, desk)
WHERE NOT EXISTS (
  SELECT 1 FROM public.units u WHERE lower(u.nama_satuan) = lower(v.nama)
);

-- LOKASI
INSERT INTO public.locations (kode_lokasi, nama_lokasi, tipe_lokasi, barcode_value, deskripsi, status_aktif)
SELECT v.kode, v.nama, v.tipe, v.barcode, v.desk, true
FROM (VALUES
  ('LMR-01', 'Penyimpanan LAB-Mikro', 'Lemari', 'LMR-01-Lab-Mikro', '')
) AS v(kode, nama, tipe, barcode, desk)
WHERE NOT EXISTS (
  SELECT 1 FROM public.locations l WHERE lower(l.kode_lokasi) = lower(v.kode)
);

-- PRODUK (insert baru)
INSERT INTO public.products (sku, nama_produk, kategori_id, satuan_id, minimum_stok, status_aktif)
SELECT v.sku, v.nama_produk, c.id, u.id, v.minimum_stok, true
FROM (VALUES
  ('PRD-001', 'Masker Hijab',                                            'BMHP',       'Box',    21),
  ('PRD-002', 'Masker Non Hijab',                                        'BMHP',       'Box',     0),
  ('PRD-003', 'Masker Bedah Tali',                                       'BMHP',       'Box',    11),
  ('PRD-004', 'Hanscoond L',                                             'BMHP',       'Box',     2),
  ('PRD-005', 'Hanscoon M',                                              'BMHP',       'Box',    28),
  ('PRD-006', 'Hanscoon S',                                              'BMHP',       'Box',    27),
  ('PRD-007', 'Ose 1 Mikron',                                            'BMHP',       'Pack',    2),
  ('PRD-008', 'Ose 10 Mikron (10)',                                      'BMHP',       'Pack',   25),
  ('PRD-009', 'Disposible spreader (10)',                                 'BMHP',       'Pcs',     5),
  ('PRD-010', 'Membrane Filter',                                         'BMHP',       'Pcs',   150),
  ('PRD-011', 'Sampel tube 5 ml (50)',                                    'BMHP',       'Pcs',     3),
  ('PRD-012', 'Thermo Sensititre GPID',                                  'BMHP',       'Pcs',     5),
  ('PRD-013', 'Thermo Sensititre Dosing Heads (10)',                      'BMHP',       'Pcs',     8),
  ('PRD-014', 'DNA - RNA Extraction Kit : 2 box',                         'REAGEN kit', 'Box',     2),
  ('PRD-015', 'NS1 Dengue Ag Test : 10 box (25 test)',                    'REAGEN kit', 'Box',    10),
  ('PRD-016', 'Wiasure RT-PCR Dengue Serotyping : 2 box',                 'REAGEN kit', 'Box',     2),
  ('PRD-017', 'Wiasure RT-PCR Dengue, Zika, dan Chikungunya',             'REAGEN kit', 'Box',     1),
  ('PRD-018', 'Amies Collecting Swab : 90 pcs',                           'BMHP',       'Pcs',    90),
  ('PRD-019', 'Transport tube + sterile swab : 6 box (50 pcs)',           'BMHP',       'Box',     6),
  ('PRD-020', 'Mini Spin Column : 10 pack (10 pcs)',                      'BMHP',       'Pack',   10),
  ('PRD-021', 'Tube 2 ml : 7 pack (50)',                                  'BMHP',       'Pack',    7),
  ('PRD-022', 'Ethanol : 15 botol',                                      'REAGEN kit', 'Botol',  15),
  ('PRD-023', 'Alkohol 70% : 6 botol (1 liter)',                          'REAGEN kit', 'Botol',   6),
  ('PRD-024', 'Water Bioperformance : 10 botol (100 ml)',                  'REAGEN kit', 'Botol',  10),
  ('PRD-025', 'Water One : 5 botol (1 liter)',                            'REAGEN kit', 'Botol',   5),
  ('PRD-026', 'RNase Zap : 11 botol (250 ml)',                            'REAGEN kit', 'Botol',  11),
  ('PRD-027', 'Nuclease-Free Water : 1 botol (1000 µl)',                  'REAGEN kit', 'Botol',   1),
  ('PRD-028', 'Tpis 10 Mikron',                                          'BMHP',       'Pcs',    96),
  ('PRD-029', 'Rotor Adapter Holder',                                    'BMHP',       'Pcs',     1),
  ('PRD-030', 'Tips 100 mikron',                                         'BMHP',       'Pcs',   300)
) AS v(sku, nama_produk, kategori_nama, satuan_nama, minimum_stok)
JOIN public.categories c ON lower(c.nama_kategori) = lower(v.kategori_nama)
JOIN public.units u ON lower(u.nama_satuan) = lower(v.satuan_nama)
WHERE NOT EXISTS (
  SELECT 1 FROM public.products p WHERE lower(p.sku) = lower(v.sku)
);

-- UPDATE nama & minimum_stok produk yang sudah ada
UPDATE public.products p
SET nama_produk = v.nama_produk,
    minimum_stok = v.minimum_stok,
    updated_at = timezone('utc', now())
FROM (VALUES
  ('PRD-001', 'Masker Hijab',                                            21),
  ('PRD-002', 'Masker Non Hijab',                                         0),
  ('PRD-003', 'Masker Bedah Tali',                                       11),
  ('PRD-004', 'Hanscoond L',                                              2),
  ('PRD-005', 'Hanscoon M',                                              28),
  ('PRD-006', 'Hanscoon S',                                              27),
  ('PRD-007', 'Ose 1 Mikron',                                             2),
  ('PRD-008', 'Ose 10 Mikron (10)',                                      25),
  ('PRD-009', 'Disposible spreader (10)',                                  5),
  ('PRD-010', 'Membrane Filter',                                        150),
  ('PRD-011', 'Sampel tube 5 ml (50)',                                     3),
  ('PRD-012', 'Thermo Sensititre GPID',                                   5),
  ('PRD-013', 'Thermo Sensititre Dosing Heads (10)',                       8),
  ('PRD-014', 'DNA - RNA Extraction Kit : 2 box',                          2),
  ('PRD-015', 'NS1 Dengue Ag Test : 10 box (25 test)',                    10),
  ('PRD-016', 'Wiasure RT-PCR Dengue Serotyping : 2 box',                  2),
  ('PRD-017', 'Wiasure RT-PCR Dengue, Zika, dan Chikungunya',              1),
  ('PRD-018', 'Amies Collecting Swab : 90 pcs',                           90),
  ('PRD-019', 'Transport tube + sterile swab : 6 box (50 pcs)',            6),
  ('PRD-020', 'Mini Spin Column : 10 pack (10 pcs)',                      10),
  ('PRD-021', 'Tube 2 ml : 7 pack (50)',                                   7),
  ('PRD-022', 'Ethanol : 15 botol',                                      15),
  ('PRD-023', 'Alkohol 70% : 6 botol (1 liter)',                           6),
  ('PRD-024', 'Water Bioperformance : 10 botol (100 ml)',                  10),
  ('PRD-025', 'Water One : 5 botol (1 liter)',                             5),
  ('PRD-026', 'RNase Zap : 11 botol (250 ml)',                            11),
  ('PRD-027', 'Nuclease-Free Water : 1 botol (1000 µl)',                   1),
  ('PRD-028', 'Tpis 10 Mikron',                                           96),
  ('PRD-029', 'Rotor Adapter Holder',                                      1),
  ('PRD-030', 'Tips 100 mikron',                                         300)
) AS v(sku, nama_produk, minimum_stok)
WHERE lower(p.sku) = lower(v.sku)
  AND (p.nama_produk != v.nama_produk OR p.minimum_stok != v.minimum_stok);

-- STOK AWAL di Penyimpanan LAB-Mikro (LMR-01)
INSERT INTO public.product_stocks (product_id, location_id, qty)
SELECT
  p.id,
  loc.id,
  v.qty
FROM (VALUES
  ('PRD-001', 21),
  ('PRD-002', 0),
  ('PRD-003', 11),
  ('PRD-004', 2),
  ('PRD-005', 28),
  ('PRD-006', 27),
  ('PRD-007', 2),
  ('PRD-008', 25),
  ('PRD-009', 5),
  ('PRD-010', 150),
  ('PRD-011', 3),
  ('PRD-012', 5),
  ('PRD-013', 8),
  ('PRD-014', 2),
  ('PRD-015', 10),
  ('PRD-016', 2),
  ('PRD-017', 1),
  ('PRD-018', 90),
  ('PRD-019', 6),
  ('PRD-020', 10),
  ('PRD-021', 7),
  ('PRD-022', 15),
  ('PRD-023', 6),
  ('PRD-024', 10),
  ('PRD-025', 5),
  ('PRD-026', 11),
  ('PRD-027', 1),
  ('PRD-028', 96),
  ('PRD-029', 1),
  ('PRD-030', 300)
) AS v(sku, qty)
JOIN public.products p ON lower(p.sku) = lower(v.sku)
CROSS JOIN (SELECT id FROM public.locations WHERE kode_lokasi = 'LMR-01') loc
ON CONFLICT (product_id, location_id) DO UPDATE SET
  qty = EXCLUDED.qty,
  updated_at = timezone('utc', now());

-- ============================================================
-- SELESAI. Jalankan di Supabase SQL Editor.
-- Produk + stok di Penyimpanan LAB-Mikro akan langsung terisi.
-- ============================================================
