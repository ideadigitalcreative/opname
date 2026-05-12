import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AppUser,
  AuditLogItem,
  Category,
  Location,
  OpnameInputItem,
  OpnameSession,
  Product,
  ProductStock,
  StockInTransaction,
  Unit,
} from "@/types/app";
import {
  mockAuditLogs,
  mockCategories,
  mockInputItems,
  mockLocations,
  mockProducts,
  mockProductStocks,
  mockSessions,
  mockStockInTransactions,
  mockStockOutHistory,
  mockUnits,
} from "./mock-data";

type DataSource = "supabase" | "mock";

interface CollectionResult<T> {
  items: T[];
  source: DataSource;
  note?: string;
}

interface SelectOption {
  id: string;
  label: string;
}

interface ProductFormOptionsResult {
  categories: SelectOption[];
  units: SelectOption[];
  source: DataSource;
  note?: string;
}

export interface ProductFormProduct {
  id: string;
  sku: string;
  barcodeProduk: string;
  namaProduk: string;
  kategoriId: string;
  satuanId: string;
  minimumStok: number;
  statusAktif: boolean;
}

export interface ProductFormProductResult {
  source: DataSource;
  note?: string;
  product: ProductFormProduct | null;
}

interface StockInFormOptionsResult {
  products: SelectOption[];
  locations: SelectOption[];
  source: DataSource;
  note?: string;
}

interface LandingProductRow {
  id: string;
  sku: string;
  namaProduk: string;
  minimumStok: number;
  totalStok: number;
}

interface LandingMovementRow {
  id: string;
  createdAt: string;
  movementType: string;
  sourceType: string;
  qtyChange: number;
  qtyAfter: number;
  productName: string;
  locationName: string;
}

interface LandingOverviewResult {
  source: DataSource;
  note?: string;
  totalProduk: number;
  totalLokasi: number;
  totalStok: number;
  stokRendahCount: number;
  stokHabisCount: number;
  topProductsByStock: LandingProductRow[];
  lowStockProducts: LandingProductRow[];
  recentMovements: LandingMovementRow[];
}

interface StockOutLocationResult {
  source: DataSource;
  note?: string;
  location:
    | {
        id: string;
        namaLokasi: string;
        barcodeValue: string;
      }
    | null;
}

interface StockOutAvailableItem {
  productId: string;
  sku: string;
  namaProduk: string;
  satuan: string;
  qtyTersedia: number;
}

interface StockOutAvailableItemsResult {
  source: DataSource;
  note?: string;
  items: StockOutAvailableItem[];
}

export async function getStockOutLocationByBarcode(
  barcodeValue: string,
): Promise<StockOutLocationResult> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    const fallback = mockLocations.find(
      (item) => item.barcodeValue.toLowerCase() === barcodeValue.toLowerCase(),
    );

    return {
      source: "mock",
      note: getFallbackNote(),
      location: fallback
        ? { id: fallback.id, namaLokasi: fallback.namaLokasi, barcodeValue: fallback.barcodeValue }
        : null,
    };
  }

  const { data, error } = await session.supabase
    .from("locations")
    .select("id, nama_lokasi, barcode_value, status_aktif")
    .eq("barcode_value", barcodeValue)
    .maybeSingle();

  if (error) {
    return {
      source: "supabase",
      note: `Gagal membaca lokasi: ${error.message}`,
      location: null,
    };
  }

  if (!data || !data.status_aktif) {
    return { source: "supabase", location: null };
  }

  return {
    source: "supabase",
    location: {
      id: data.id,
      namaLokasi: data.nama_lokasi,
      barcodeValue: data.barcode_value,
    },
  };
}

export async function getStockOutAvailableItems(
  locationId: string,
): Promise<StockOutAvailableItemsResult> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    const items = mockProductStocks
      .filter((item) => item.qty > 0)
      .map((item) => {
        const product = mockProducts.find((productItem) => productItem.namaProduk === item.productName);
        return {
          productId: product?.id ?? item.id,
          sku: product?.sku ?? "-",
          namaProduk: item.productName,
          satuan: product?.satuan ?? "-",
          qtyTersedia: item.qty,
        };
      });

    return { source: "mock", note: getFallbackNote(), items };
  }

  const { data, error } = await session.supabase
    .from("product_stocks")
    .select(
      "product_id, qty, products(sku, nama_produk, status_aktif, units(nama_satuan))",
    )
    .eq("location_id", locationId)
    .gt("qty", 0)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return {
      source: "supabase",
      note: `Gagal membaca stok: ${error?.message ?? "unknown"}`,
      items: [],
    };
  }

  const items = data
    .filter((row) => {
      const product =
        row.products && typeof row.products === "object" && !Array.isArray(row.products)
          ? (row.products as Record<string, unknown>)
          : null;
      return Boolean(product && product.status_aktif);
    })
    .map((row) => {
      const product =
        row.products && typeof row.products === "object" && !Array.isArray(row.products)
          ? (row.products as Record<string, unknown>)
          : {};

      const sku = typeof product.sku === "string" ? product.sku : "-";
      const namaProduk = typeof product.nama_produk === "string" ? product.nama_produk : "-";
      const units =
        product.units && typeof product.units === "object" && !Array.isArray(product.units)
          ? (product.units as Record<string, unknown>)
          : {};
      const satuan = typeof units.nama_satuan === "string" ? units.nama_satuan : "-";

      return {
        productId: row.product_id,
        sku,
        namaProduk,
        satuan,
        qtyTersedia: Number(row.qty ?? 0),
      };
    })
    .sort((a, b) => a.namaProduk.localeCompare(b.namaProduk, "id-ID"));

  return { source: "supabase", items };
}

export async function getStockOutHistoryCollection() {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      source: "mock" as const,
      note: getFallbackNote(),
      items: mockStockOutHistory,
    };
  }

  const { data: transactions, error: txError } = await session.supabase
    .from("stock_out_transactions")
    .select("id, kode_transaksi, tanggal, status, diambil_oleh, locations(nama_lokasi)")
    .order("created_at", { ascending: false })
    .limit(20);

  if (txError || !transactions) {
    return {
      source: "supabase" as const,
      note: `Gagal membaca riwayat pengambilan: ${txError?.message ?? "unknown"}`,
      items: [],
    };
  }

  const txIds = transactions.map((r) => r.id);

  const [itemsResult, profilesResult] = await Promise.all([
    txIds.length > 0
      ? session.supabase
          .from("stock_out_items")
          .select("transaction_id, qty, products(nama_produk)")
          .in("transaction_id", txIds)
      : Promise.resolve({ data: [], error: null }),
    (() => {
      const userIds = [...new Set(transactions.map((r) => r.diambil_oleh).filter(Boolean))] as string[];
      if (userIds.length === 0) return Promise.resolve({ data: [], error: null });
      return session.supabase.from("profiles").select("id, full_name").in("id", userIds);
    })(),
  ]);

  const itemsByTx = new Map<string, Array<{ qty: number; productName: string }>>();
  for (const item of itemsResult.data ?? []) {
    const list = itemsByTx.get(item.transaction_id) ?? [];
    const productName =
      item.products && typeof item.products === "object" && !Array.isArray(item.products)
        ? ((item.products as Record<string, unknown>).nama_produk as string) ?? "-"
        : "-";
    list.push({ qty: Number(item.qty ?? 0), productName });
    itemsByTx.set(item.transaction_id, list);
  }

  const nameMap = new Map<string, string>();
  for (const p of profilesResult.data ?? []) {
    nameMap.set(p.id, p.full_name ?? "User");
  }

  const items = transactions.map((row) => {
    const locationName =
      row.locations &&
      typeof row.locations === "object" &&
      !Array.isArray(row.locations) &&
      typeof (row.locations as Record<string, unknown>).nama_lokasi === "string"
        ? ((row.locations as Record<string, unknown>).nama_lokasi as string)
        : "-";

    const requesterName = nameMap.get(row.diambil_oleh) ?? "User";

    const itemsRow = itemsByTx.get(row.id) ?? [];
    const totalQty = itemsRow.reduce((acc, item) => acc + item.qty, 0);
    const productName =
      itemsRow.length > 1
        ? `Multi item (${itemsRow.length})`
        : itemsRow.length === 1
          ? itemsRow[0].productName
          : "-";

    return {
      id: row.id,
      kodeTransaksi: row.kode_transaksi,
      tanggal: row.tanggal,
      lokasi: locationName,
      productName,
      qty: totalQty,
      status: row.status,
      requestedBy: requesterName,
    };
  });

  return { source: "supabase" as const, items };
}

function getFallbackNote() {
  if (!hasSupabaseEnv()) {
    return "Mode demo aktif karena environment Supabase belum lengkap.";
  }

  return "Mode demo aktif karena session Supabase belum login atau akses tabel belum tersedia.";
}

async function getPublicSupabase() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  return supabase;
}

async function getAuthenticatedSupabase() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return { supabase, user };
}

function getRelationName(
  relation: unknown,
  key: "nama_kategori" | "nama_satuan",
): string {
  if (relation && typeof relation === "object" && !Array.isArray(relation)) {
    const value = relation as Record<string, unknown>;
    return typeof value[key] === "string" ? value[key] : "-";
  }

  if (Array.isArray(relation) && relation[0] && typeof relation[0] === "object") {
    const value = relation[0] as Record<string, unknown>;
    return typeof value[key] === "string" ? value[key] : "-";
  }

  return "-";
}

export async function getProductFormOptions(options?: {
  includeCategoryId?: string;
  includeUnitId?: string;
}): Promise<ProductFormOptionsResult> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      categories: mockCategories.map((item) => ({ id: item.id, label: item.namaKategori })),
      units: mockUnits.map((item) => ({ id: item.id, label: item.namaSatuan })),
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const [{ data: categories, error: categoryError }, { data: units, error: unitError }] =
    await Promise.all([
      session.supabase
        .from("categories")
        .select("id, nama_kategori")
        .eq("status_aktif", true)
        .order("nama_kategori"),
      session.supabase
        .from("units")
        .select("id, nama_satuan")
        .eq("status_aktif", true)
        .order("nama_satuan"),
    ]);

  if (categoryError || unitError || !categories || !units) {
    return {
      categories: [],
      units: [],
      source: "supabase",
      note: `Gagal membaca data form: ${categoryError?.message ?? unitError?.message ?? "unknown"}`,
    };
  }

  const mergedCategories = categories.slice();
  const mergedUnits = units.slice();

  const includeCategoryId = options?.includeCategoryId;
  if (includeCategoryId && !mergedCategories.some((item) => item.id === includeCategoryId)) {
    const { data: extraCategory } = await session.supabase
      .from("categories")
      .select("id, nama_kategori")
      .eq("id", includeCategoryId)
      .maybeSingle();

    if (extraCategory) {
      mergedCategories.push(extraCategory);
    }
  }

  const includeUnitId = options?.includeUnitId;
  if (includeUnitId && !mergedUnits.some((item) => item.id === includeUnitId)) {
    const { data: extraUnit } = await session.supabase
      .from("units")
      .select("id, nama_satuan")
      .eq("id", includeUnitId)
      .maybeSingle();

    if (extraUnit) {
      mergedUnits.push(extraUnit);
    }
  }

  return {
    categories: mergedCategories
      .map((item) => ({ id: item.id, label: item.nama_kategori }))
      .sort((a, b) => a.label.localeCompare(b.label, "id-ID")),
    units: mergedUnits
      .map((item) => ({ id: item.id, label: item.nama_satuan }))
      .sort((a, b) => a.label.localeCompare(b.label, "id-ID")),
    source: "supabase",
  };
}

export async function getProductFormProduct(productId: string): Promise<ProductFormProductResult> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    const mockProduct = mockProducts.find((p) => p.id === productId);
    if (!mockProduct) return { source: "mock", note: getFallbackNote(), product: null };

    const kategoriId =
      mockCategories.find((c) => c.namaKategori === mockProduct.kategori)?.id ?? "";
    const satuanId = mockUnits.find((u) => u.namaSatuan === mockProduct.satuan)?.id ?? "";

    return {
      source: "mock",
      note: getFallbackNote(),
      product: {
        id: mockProduct.id,
        sku: mockProduct.sku,
        barcodeProduk: mockProduct.barcodeProduk ?? "",
        namaProduk: mockProduct.namaProduk,
        kategoriId,
        satuanId,
        minimumStok: mockProduct.minimumStok,
        statusAktif: mockProduct.statusAktif,
      },
    };
  }

  const { data, error } = await session.supabase
    .from("products")
    .select("id, sku, barcode_produk, nama_produk, kategori_id, satuan_id, minimum_stok, status_aktif")
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    return {
      source: "supabase",
      note: `Gagal membaca detail produk: ${error?.message ?? "Produk tidak ditemukan"}`,
      product: null,
    };
  }

  return {
    source: "supabase",
    product: {
      id: data.id,
      sku: data.sku,
      barcodeProduk: data.barcode_produk ?? "",
      namaProduk: data.nama_produk ?? "-",
      kategoriId: data.kategori_id ?? "",
      satuanId: data.satuan_id ?? "",
      minimumStok: Number(data.minimum_stok ?? 0),
      statusAktif: Boolean(data.status_aktif),
    },
  };
}

export async function getProductsCollection(): Promise<CollectionResult<Product>> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: mockProducts,
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const [{ data: products, error: productError }, { data: stocks, error: stockError }] =
    await Promise.all([
      session.supabase
        .from("products")
        .select(
          "id, sku, barcode_produk, nama_produk, kategori_id, satuan_id, minimum_stok, status_aktif, updated_at, categories(nama_kategori), units(nama_satuan)",
        )
        .order("updated_at", { ascending: false }),
      session.supabase.from("product_stocks").select("product_id, qty"),
    ]);

  if (productError || stockError || !products || !stocks) {
    return {
      items: [],
      source: "supabase",
      note: `Gagal membaca data produk: ${productError?.message ?? stockError?.message ?? "unknown"}`,
    };
  }

  const stockMap = new Map<string, number>();

  for (const stock of stocks) {
    const previousQty = stockMap.get(stock.product_id) ?? 0;
    stockMap.set(stock.product_id, previousQty + Number(stock.qty ?? 0));
  }

  return {
    source: "supabase",
    items: products.map((item) => ({
      id: item.id,
      sku: item.sku,
      barcodeProduk: item.barcode_produk ?? "-",
      namaProduk: item.nama_produk ?? "-",
      kategoriId: item.kategori_id ?? "",
      kategori: getRelationName(item.categories, "nama_kategori"),
      satuanId: item.satuan_id ?? "",
      satuan: getRelationName(item.units, "nama_satuan"),
      totalStok: stockMap.get(item.id) ?? 0,
      minimumStok: Number(item.minimum_stok ?? 0),
      statusAktif: item.status_aktif,
      updatedAt: item.updated_at,
    })),
  };
}

export interface ProductDetailStock {
  locationId: string;
  locationName: string;
  barcode: string;
  qty: number;
}

export interface ProductDetailMovement {
  id: string;
  createdAt: string;
  movementType: string;
  sourceType: string;
  qtyChange: number;
  qtyAfter: number;
  locationName: string;
}

export interface ProductDetail {
  id: string;
  sku: string;
  barcodeProduk: string;
  namaProduk: string;
  kategori: string;
  satuan: string;
  minimumStok: number;
  totalStok: number;
  statusAktif: boolean;
  stocks: ProductDetailStock[];
  movements: ProductDetailMovement[];
}

export interface ProductDetailResult {
  source: DataSource;
  note?: string;
  product: ProductDetail | null;
}

export async function getProductDetail(productId: string): Promise<ProductDetailResult> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    const mockProduct = mockProducts.find((p) => p.id === productId);
    if (!mockProduct) return { source: "mock", product: null };

    const mockStocks = mockProductStocks
      .filter((s) => s.productName === mockProduct.namaProduk)
      .map((s) => ({ locationId: "", locationName: s.locationName, barcode: s.barcodeLocation, qty: s.qty }));

    return {
      source: "mock",
      note: getFallbackNote(),
      product: {
        id: mockProduct.id,
        sku: mockProduct.sku,
        barcodeProduk: mockProduct.barcodeProduk,
        namaProduk: mockProduct.namaProduk,
        kategori: mockProduct.kategori,
        satuan: mockProduct.satuan,
        minimumStok: mockProduct.minimumStok,
        totalStok: mockProduct.totalStok,
        statusAktif: mockProduct.statusAktif,
        stocks: mockStocks,
        movements: [],
      },
    };
  }

  const [
    { data: product, error: productError },
    { data: stocks },
    { data: movements },
  ] = await Promise.all([
    session.supabase
      .from("products")
      .select("id, sku, barcode_produk, nama_produk, minimum_stok, status_aktif, categories(nama_kategori), units(nama_satuan)")
      .eq("id", productId)
      .maybeSingle(),
    session.supabase
      .from("product_stocks")
      .select("qty, location_id, locations(nama_lokasi, barcode_value)")
      .eq("product_id", productId),
    session.supabase
      .from("stock_movements")
      .select("id, created_at, movement_type, source_type, qty_change, qty_after, locations(nama_lokasi)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (productError || !product) {
    return { source: "supabase", note: `Gagal memuat detail produk: ${productError?.message ?? "unknown"}`, product: null };
  }

  const productStocks: ProductDetailStock[] = (stocks ?? [])
    .map((row) => {
      const loc =
        row.locations && typeof row.locations === "object" && !Array.isArray(row.locations)
          ? (row.locations as Record<string, unknown>)
          : {};
      return {
        locationId: row.location_id ?? "",
        locationName: typeof loc.nama_lokasi === "string" ? loc.nama_lokasi : "-",
        barcode: typeof loc.barcode_value === "string" ? loc.barcode_value : "-",
        qty: Number(row.qty ?? 0),
      };
    })
    .sort((a, b) => a.locationName.localeCompare(b.locationName, "id-ID"));

  const totalStok = productStocks.reduce((acc, s) => acc + s.qty, 0);

  const productMovements: ProductDetailMovement[] = (movements ?? []).map((row) => {
    const loc =
      row.locations && typeof row.locations === "object" && !Array.isArray(row.locations)
        ? (row.locations as Record<string, unknown>)
        : {};
    return {
      id: row.id,
      createdAt: row.created_at,
      movementType: row.movement_type,
      sourceType: row.source_type,
      qtyChange: Number(row.qty_change ?? 0),
      qtyAfter: Number(row.qty_after ?? 0),
      locationName: typeof loc.nama_lokasi === "string" ? loc.nama_lokasi : "-",
    };
  });

  return {
    source: "supabase",
    product: {
      id: product.id,
      sku: product.sku,
      barcodeProduk: product.barcode_produk ?? "-",
      namaProduk: product.nama_produk,
      kategori: getRelationName(product.categories, "nama_kategori"),
      satuan: getRelationName(product.units, "nama_satuan"),
      minimumStok: Number(product.minimum_stok ?? 0),
      totalStok,
      statusAktif: product.status_aktif,
      stocks: productStocks,
      movements: productMovements,
    },
  };
}

export async function getLocationsCollection(): Promise<CollectionResult<Location>> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: mockLocations,
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const [{ data: locations, error: locationError }, { data: stocks, error: stockError }] =
    await Promise.all([
      session.supabase
        .from("locations")
        .select(
          "id, kode_lokasi, nama_lokasi, tipe_lokasi, barcode_value, deskripsi, status_aktif, updated_at",
        )
        .order("updated_at", { ascending: false }),
      session.supabase.from("product_stocks").select("location_id, product_id"),
    ]);

  if (locationError || stockError || !locations || !stocks) {
    return {
      items: [],
      source: "supabase",
      note: `Gagal membaca data lokasi: ${locationError?.message ?? stockError?.message ?? "unknown"}`,
    };
  }

  const stockCountMap = new Map<string, number>();

  for (const stock of stocks) {
    const previousCount = stockCountMap.get(stock.location_id) ?? 0;
    stockCountMap.set(stock.location_id, previousCount + 1);
  }

  return {
    source: "supabase",
    items: locations.map((item) => ({
      id: item.id,
      kodeLokasi: item.kode_lokasi,
      namaLokasi: item.nama_lokasi,
      tipeLokasi: item.tipe_lokasi,
      barcodeValue: item.barcode_value,
      deskripsi: item.deskripsi ?? "-",
      statusAktif: item.status_aktif,
      totalBarang: stockCountMap.get(item.id) ?? 0,
      updatedAt: item.updated_at,
    })),
  };
}

export async function getCategoriesCollection(): Promise<CollectionResult<Category>> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: mockCategories,
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const [{ data: categories, error: categoryError }, { data: products, error: productError }] =
    await Promise.all([
      session.supabase
        .from("categories")
        .select("id, nama_kategori, deskripsi, status_aktif, updated_at")
        .order("nama_kategori"),
      session.supabase.from("products").select("kategori_id"),
    ]);

  if (categoryError || productError || !categories || !products) {
    return {
      items: [],
      source: "supabase",
      note: `Gagal membaca data kategori: ${categoryError?.message ?? productError?.message ?? "unknown"}`,
    };
  }

  const totals = new Map<string, number>();

  for (const product of products) {
    const previousCount = totals.get(product.kategori_id) ?? 0;
    totals.set(product.kategori_id, previousCount + 1);
  }

  return {
    source: "supabase",
    items: categories.map((item) => ({
      id: item.id,
      namaKategori: item.nama_kategori,
      deskripsi: item.deskripsi ?? "-",
      statusAktif: item.status_aktif,
      totalBarang: totals.get(item.id) ?? 0,
      updatedAt: item.updated_at,
    })),
  };
}

export async function getUnitsCollection(): Promise<CollectionResult<Unit>> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: mockUnits,
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const { data: units, error } = await session.supabase
    .from("units")
    .select("id, nama_satuan, simbol, deskripsi, status_aktif, updated_at")
    .order("nama_satuan");

  if (error || !units) {
    return {
      items: [],
      source: "supabase",
      note: `Gagal membaca data satuan: ${error?.message ?? "unknown"}`,
    };
  }

  return {
    source: "supabase",
    items: units.map((item) => ({
      id: item.id,
      namaSatuan: item.nama_satuan,
      simbol: item.simbol,
      deskripsi: item.deskripsi ?? "-",
      statusAktif: item.status_aktif,
      updatedAt: item.updated_at,
    })),
  };
}

export async function getStockInFormOptions(): Promise<StockInFormOptionsResult> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      products: mockProducts.map((item) => ({ id: item.id, label: `${item.sku} - ${item.namaProduk}` })),
      locations: mockLocations.map((item) => ({
        id: item.id,
        label: `${item.kodeLokasi} - ${item.namaLokasi}`,
      })),
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const [{ data: products, error: productError }, { data: locations, error: locationError }] =
    await Promise.all([
      session.supabase
        .from("products")
        .select("id, sku, nama_produk")
        .eq("status_aktif", true)
        .order("nama_produk"),
      session.supabase
        .from("locations")
        .select("id, kode_lokasi, nama_lokasi")
        .eq("status_aktif", true)
        .order("nama_lokasi"),
    ]);

  if (productError || locationError || !products || !locations) {
    return {
      products: [],
      locations: [],
      source: "supabase",
      note: `Gagal membaca data form: ${productError?.message ?? locationError?.message ?? "unknown"}`,
    };
  }

  return {
    source: "supabase",
    products: products.map((item) => ({ id: item.id, label: `${item.sku} - ${item.nama_produk}` })),
    locations: locations.map((item) => ({
      id: item.id,
      label: `${item.kode_lokasi} - ${item.nama_lokasi}`,
    })),
  };
}

export async function getStockInCollection(): Promise<CollectionResult<StockInTransaction>> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: mockStockInTransactions,
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const { data, error } = await session.supabase
    .from("stock_in_transactions")
    .select(
      "id, kode_transaksi, tipe_masuk, tanggal, supplier, sumber_drop, applied_at, profiles!stock_in_transactions_dibuat_oleh_fkey(full_name), stock_in_items(qty, location_id, locations(nama_lokasi))",
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      items: [],
      source: "supabase",
      note: `Gagal membaca transaksi stok masuk: ${error?.message ?? "unknown"}`,
    };
  }

  return {
    source: "supabase",
    items: data.map((item) => {
      const stockItems = Array.isArray(item.stock_in_items) ? item.stock_in_items : [];
      const firstLocation = stockItems[0];
      const totalQty = stockItems.reduce(
        (accumulator, current) => accumulator + Number(current.qty ?? 0),
        0,
      );
      const firstLocationName =
        firstLocation &&
        typeof firstLocation === "object" &&
        firstLocation.locations &&
        typeof firstLocation.locations === "object" &&
        !Array.isArray(firstLocation.locations) &&
        typeof (firstLocation.locations as Record<string, unknown>).nama_lokasi === "string"
          ? ((firstLocation.locations as Record<string, unknown>).nama_lokasi as string)
          : "-";

      const createdBy =
        item.profiles &&
        typeof item.profiles === "object" &&
        !Array.isArray(item.profiles) &&
        typeof (item.profiles as Record<string, unknown>).full_name === "string"
          ? ((item.profiles as Record<string, unknown>).full_name as string)
          : "System";

      return {
        id: item.id,
        kodeTransaksi: item.kode_transaksi,
        tipeMasuk: item.tipe_masuk,
        tanggal: item.tanggal,
        supplier: item.supplier ?? undefined,
        sumberDrop: item.sumber_drop ?? undefined,
        lokasiTujuan: firstLocationName,
        totalItem: stockItems.length,
        totalQty,
        dibuatOleh: createdBy,
        appliedAt: item.applied_at ?? undefined,
      };
    }),
  };
}

export async function getProductStocksCollection(): Promise<CollectionResult<ProductStock>> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: mockProductStocks,
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const { data, error } = await session.supabase
    .from("product_stocks")
    .select(
      "id, qty, products(nama_produk), locations(nama_lokasi, barcode_value)",
    )
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return {
      items: [],
      source: "supabase",
      note: `Gagal membaca stok per lokasi: ${error?.message ?? "unknown"}`,
    };
  }

  return {
    source: "supabase",
    items: data.map((item) => {
      const productName =
        item.products &&
        typeof item.products === "object" &&
        !Array.isArray(item.products) &&
        typeof (item.products as Record<string, unknown>).nama_produk === "string"
          ? ((item.products as Record<string, unknown>).nama_produk as string)
          : "-";

      const locationName =
        item.locations &&
        typeof item.locations === "object" &&
        !Array.isArray(item.locations) &&
        typeof (item.locations as Record<string, unknown>).nama_lokasi === "string"
          ? ((item.locations as Record<string, unknown>).nama_lokasi as string)
          : "-";

      const barcodeLocation =
        item.locations &&
        typeof item.locations === "object" &&
        !Array.isArray(item.locations) &&
        typeof (item.locations as Record<string, unknown>).barcode_value === "string"
          ? ((item.locations as Record<string, unknown>).barcode_value as string)
          : "-";

      return {
        id: item.id,
        productName,
        locationName,
        qty: Number(item.qty ?? 0),
        barcodeLocation,
      };
    }),
  };
}

export async function getLandingOverview(): Promise<LandingOverviewResult> {
  const supabase = await getPublicSupabase();

  if (!supabase) {
    const totalStok = mockProductStocks.reduce((acc, item) => acc + item.qty, 0);
    const totalProduk = mockProducts.length;
    const totalLokasi = mockLocations.length;

    const byName = new Map<string, LandingProductRow>();
    for (const product of mockProducts) {
      byName.set(product.id, {
        id: product.id,
        sku: product.sku,
        namaProduk: product.namaProduk,
        minimumStok: product.minimumStok,
        totalStok: 0,
      });
    }

    for (const stock of mockProductStocks) {
      const product = mockProducts.find((item) => item.namaProduk === stock.productName);
      if (!product) continue;
      const row = byName.get(product.id);
      if (!row) continue;
      row.totalStok += stock.qty;
    }

    const products = Array.from(byName.values());
    const lowStock = products
      .filter((item) => item.totalStok <= item.minimumStok)
      .sort((a, b) => a.totalStok - b.totalStok)
      .slice(0, 8);

    const stokHabisCount = products.filter((item) => item.totalStok === 0).length;
    const stokRendahCount = products.filter((item) => item.totalStok > 0 && item.totalStok <= item.minimumStok).length;

    return {
      source: "mock",
      note: getFallbackNote(),
      totalProduk,
      totalLokasi,
      totalStok,
      stokRendahCount,
      stokHabisCount,
      topProductsByStock: products
        .slice()
        .sort((a, b) => b.totalStok - a.totalStok)
        .slice(0, 8),
      lowStockProducts: lowStock,
      recentMovements: [
        {
          id: "mov-001",
          createdAt: "2026-04-29T10:00:00+07:00",
          movementType: "IN",
          sourceType: "pembelian",
          qtyChange: 12,
          qtyAfter: 24,
          productName: "Kabel LAN Cat6",
          locationName: "Gudang Utama",
        },
        {
          id: "mov-002",
          createdAt: "2026-04-29T11:30:00+07:00",
          movementType: "OUT",
          sourceType: "pengambilan",
          qtyChange: -1,
          qtyAfter: 2,
          productName: "Patch Panel 24 Port",
          locationName: "Gudang Cabang A",
        },
        {
          id: "mov-003",
          createdAt: "2026-04-29T14:20:00+07:00",
          movementType: "IN",
          sourceType: "drop_barang",
          qtyChange: 6,
          qtyAfter: 6,
          productName: "Label Rak 10x5",
          locationName: "Rak Transit",
        },
      ],
    };
  }

  const [{ data: products, error: productError }, { data: stocks, error: stockError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, sku, nama_produk, minimum_stok, status_aktif")
        .eq("status_aktif", true),
      supabase.from("product_stocks").select("product_id, qty"),
    ]);

  if (productError || stockError || !products || !stocks) {
    return {
      source: "supabase",
      note: `Gagal membaca ringkasan stok: ${productError?.message ?? stockError?.message ?? "unknown"}`,
      totalProduk: 0,
      totalLokasi: 0,
      totalStok: 0,
      stokRendahCount: 0,
      stokHabisCount: 0,
      topProductsByStock: [],
      lowStockProducts: [],
      recentMovements: [],
    };
  }

  const stockMap = new Map<string, number>();
  for (const stock of stocks) {
    const prev = stockMap.get(stock.product_id) ?? 0;
    stockMap.set(stock.product_id, prev + Number(stock.qty ?? 0));
  }

  const mappedProducts: LandingProductRow[] = products.map((item) => ({
    id: item.id,
    sku: item.sku,
    namaProduk: item.nama_produk,
    minimumStok: Number(item.minimum_stok ?? 0),
    totalStok: stockMap.get(item.id) ?? 0,
  }));

  const totalProduk = mappedProducts.length;
  const totalStok = mappedProducts.reduce((acc, item) => acc + item.totalStok, 0);

  const { count: totalLokasi } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("status_aktif", true);

  const stokHabisCount = mappedProducts.filter((item) => item.totalStok === 0).length;
  const stokRendahCount = mappedProducts.filter(
    (item) => item.totalStok > 0 && item.totalStok <= item.minimumStok,
  ).length;

  const topProductsByStock = mappedProducts
    .slice()
    .sort((a, b) => b.totalStok - a.totalStok)
    .slice(0, 8);

  const lowStockProducts = mappedProducts
    .filter((item) => item.totalStok <= item.minimumStok)
    .slice()
    .sort((a, b) => a.totalStok - b.totalStok)
    .slice(0, 8);

  const { data: movements } = await supabase
    .from("stock_movements")
    .select(
      "id, created_at, movement_type, source_type, qty_change, qty_after, products(nama_produk), locations(nama_lokasi)",
    )
    .order("created_at", { ascending: false })
    .limit(8);

  const recentMovements: LandingMovementRow[] = (movements ?? []).map((item) => {
    const productName =
      item.products &&
      typeof item.products === "object" &&
      !Array.isArray(item.products) &&
      typeof (item.products as Record<string, unknown>).nama_produk === "string"
        ? ((item.products as Record<string, unknown>).nama_produk as string)
        : "-";

    const locationName =
      item.locations &&
      typeof item.locations === "object" &&
      !Array.isArray(item.locations) &&
      typeof (item.locations as Record<string, unknown>).nama_lokasi === "string"
        ? ((item.locations as Record<string, unknown>).nama_lokasi as string)
        : "-";

    return {
      id: item.id,
      createdAt: item.created_at,
      movementType: item.movement_type,
      sourceType: item.source_type,
      qtyChange: Number(item.qty_change ?? 0),
      qtyAfter: Number(item.qty_after ?? 0),
      productName,
      locationName,
    };
  });

  return {
    source: "supabase",
    totalProduk,
    totalLokasi: totalLokasi ?? 0,
    totalStok,
    stokRendahCount,
    stokHabisCount,
    topProductsByStock,
    lowStockProducts,
    recentMovements,
  };
}

export interface DashboardStatRow {
  label: string;
  value: string;
  hint: string;
  numericValue: number;
}

export interface DashboardActivityRow {
  id: string;
  time: string;
  type: string;
  description: string;
}

export interface DashboardLowStockRow {
  id: string;
  sku: string;
  namaProduk: string;
  totalStok: number;
  minimumStok: number;
}

export interface DashboardResult {
  source: DataSource;
  note?: string;
  stats: DashboardStatRow[];
  recentActivities: DashboardActivityRow[];
  lowStockCount: number;
  stokHabisCount: number;
  lowStockProducts: DashboardLowStockRow[];
  totalProduk: number;
  totalLokasi: number;
  totalStok: number;
  stokMasukCount: number;
  pengambilanCount: number;
}

export async function getDashboardOverview(): Promise<DashboardResult> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    const totalStok = mockProductStocks.reduce((acc, item) => acc + item.qty, 0);
    const byId = new Map<string, number>();
    for (const s of mockProductStocks) {
      const product = mockProducts.find((p) => p.namaProduk === s.productName);
      if (product) byId.set(product.id, (byId.get(product.id) ?? 0) + s.qty);
    }
    const lowStockProducts = mockProducts
      .filter((p) => (byId.get(p.id) ?? 0) <= p.minimumStok)
      .map((p) => ({ id: p.id, sku: p.sku, namaProduk: p.namaProduk, totalStok: byId.get(p.id) ?? 0, minimumStok: p.minimumStok }));
    const lowStockCount = lowStockProducts.length;
    const stokHabisCount = mockProducts.filter((p) => (byId.get(p.id) ?? 0) === 0).length;

    return {
      source: "mock",
      note: getFallbackNote(),
      stats: [
        { label: "Total Produk", value: String(mockProducts.length), hint: "Produk aktif terdaftar", numericValue: mockProducts.length },
        { label: "Total Stok", value: String(totalStok), hint: "Akumulasi qty semua lokasi", numericValue: totalStok },
        { label: "Total Lokasi", value: String(mockLocations.length), hint: "Gudang, rak, cabang", numericValue: mockLocations.length },
        { label: "Stok Masuk", value: "3", hint: "Transaksi stok masuk", numericValue: 3 },
        { label: "Pengambilan", value: "0", hint: "Barang keluar", numericValue: 0 },
        { label: "Stok Rendah", value: String(lowStockCount), hint: "Perlu perhatian", numericValue: lowStockCount },
      ],
      recentActivities: [
        { id: "act-1", time: "Baru saja", type: "IN", description: "Stok masuk: Kabel LAN Cat6 +12 ke Gudang Utama" },
        { id: "act-2", time: "Baru saja", type: "OUT", description: "Pengambilan: Patch Panel 24 Port -1 dari Gudang Cabang A" },
        { id: "act-3", time: "Baru saja", type: "IN", description: "Stok masuk: Label Rak 10x5 +6 ke Rak Transit" },
      ],
      lowStockCount,
      stokHabisCount,
      lowStockProducts,
      totalProduk: mockProducts.length,
      totalLokasi: mockLocations.length,
      totalStok,
      stokMasukCount: 3,
      pengambilanCount: 0,
    };
  }

  const [
    { data: products, error: productError },
    { data: stocks, error: stockError },
    locationResult,
    stockInResult,
    stockOutResult,
    { data: movements },
  ] = await Promise.all([
    session.supabase
      .from("products")
      .select("id, sku, nama_produk, minimum_stok")
      .eq("status_aktif", true),
    session.supabase.from("product_stocks").select("product_id, qty"),
    session.supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("status_aktif", true),
    session.supabase
      .from("stock_in_transactions")
      .select("id", { count: "exact", head: true }),
    session.supabase
      .from("stock_out_transactions")
      .select("id", { count: "exact", head: true }),
    session.supabase
      .from("stock_movements")
      .select(
        "id, created_at, movement_type, source_type, qty_change, products(nama_produk), locations(nama_lokasi)",
      )
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (productError || stockError || !products || !stocks) {
    return {
      source: "supabase",
      note: `Gagal membaca data dashboard: ${productError?.message ?? stockError?.message ?? "unknown"}`,
      stats: [
        { label: "Total Produk", value: "-", hint: "Gagal memuat", numericValue: 0 },
        { label: "Total Stok", value: "-", hint: "Gagal memuat", numericValue: 0 },
        { label: "Total Lokasi", value: "-", hint: "Gagal memuat", numericValue: 0 },
        { label: "Stok Masuk", value: "-", hint: "Gagal memuat", numericValue: 0 },
        { label: "Pengambilan", value: "-", hint: "Gagal memuat", numericValue: 0 },
        { label: "Stok Rendah", value: "-", hint: "Gagal memuat", numericValue: 0 },
      ],
      recentActivities: [],
      lowStockCount: 0,
      stokHabisCount: 0,
      lowStockProducts: [],
      totalProduk: 0,
      totalLokasi: 0,
      totalStok: 0,
      stokMasukCount: 0,
      pengambilanCount: 0,
    };
  }

  const stockMap = new Map<string, number>();
  for (const s of stocks) {
    stockMap.set(s.product_id, (stockMap.get(s.product_id) ?? 0) + Number(s.qty ?? 0));
  }

  const totalProduk = products.length;
  const totalStok = products.reduce((acc, p) => acc + (stockMap.get(p.id) ?? 0), 0);
  const totalLokasi = locationResult.count ?? 0;
  const stokMasukCount = stockInResult.count ?? 0;
  const pengambilanCount = stockOutResult.count ?? 0;

  const lowStockCount = products.filter(
    (p) => (stockMap.get(p.id) ?? 0) <= Number(p.minimum_stok ?? 0),
  ).length;

  const stokHabisCount = products.filter(
    (p) => (stockMap.get(p.id) ?? 0) === 0,
  ).length;

  const lowStockProducts: DashboardLowStockRow[] = products
    .filter((p) => (stockMap.get(p.id) ?? 0) <= Number(p.minimum_stok ?? 0))
    .map((p) => ({
      id: p.id,
      sku: p.sku,
      namaProduk: p.nama_produk,
      totalStok: stockMap.get(p.id) ?? 0,
      minimumStok: Number(p.minimum_stok ?? 0),
    }))
    .sort((a, b) => a.totalStok - b.totalStok)
    .slice(0, 10);

  const recentActivities: DashboardActivityRow[] = (movements ?? []).map((item) => {
    const productName =
      item.products && typeof item.products === "object" && !Array.isArray(item.products)
        ? ((item.products as Record<string, unknown>).nama_produk as string) ?? "-"
        : "-";
    const locationName =
      item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
        ? ((item.locations as Record<string, unknown>).nama_lokasi as string) ?? "-"
        : "-";
    const qtyChange = Number(item.qty_change ?? 0);
    const arrow = qtyChange > 0 ? "+" : "";
    const tipe = item.movement_type === "IN" ? "Masuk" : item.movement_type === "OUT" ? "Keluar" : item.movement_type === "OPNAME" ? "Opname" : "Koreksi";

    return {
      id: item.id,
      time: item.created_at ?? "",
      type: item.movement_type,
      description: `${tipe}: ${productName} ${arrow}${qtyChange} di ${locationName}`,
    };
  });

  return {
    source: "supabase",
    stats: [
      { label: "Total Produk", value: String(totalProduk), hint: "Produk aktif terdaftar", numericValue: totalProduk },
      { label: "Total Stok", value: String(totalStok), hint: "Akumulasi qty semua lokasi", numericValue: totalStok },
      { label: "Total Lokasi", value: String(totalLokasi), hint: "Gudang, rak, cabang", numericValue: totalLokasi },
      { label: "Stok Masuk", value: String(stokMasukCount), hint: "Total transaksi stok masuk", numericValue: stokMasukCount },
      { label: "Pengambilan", value: String(pengambilanCount), hint: "Total pengambilan barang", numericValue: pengambilanCount },
      { label: "Stok Rendah", value: String(lowStockCount), hint: "Perlu perhatian", numericValue: lowStockCount },
    ],
    recentActivities,
    lowStockCount,
    stokHabisCount,
    lowStockProducts,
    totalProduk,
    totalLokasi,
    totalStok,
    stokMasukCount,
    pengambilanCount,
  };
}

export async function getUsersCollection(): Promise<CollectionResult<AppUser>> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: [
        { id: "u-001", fullName: "Admin Gudang", email: "admin@opname.local", role: "admin", locationName: "Gudang Utama", statusAktif: true, createdAt: "2026-01-01T00:00:00+07:00" },
        { id: "u-002", fullName: "Petugas Gudang", email: "petugas.gudang@opname.local", role: "petugas_gudang", locationName: "Gudang Cabang A", statusAktif: true, createdAt: "2026-01-15T00:00:00+07:00" },
        { id: "u-003", fullName: "Budi Pengambil", email: "budi@opname.local", role: "user", locationName: "Site Teknisi", statusAktif: true, createdAt: "2026-02-01T00:00:00+07:00" },
      ],
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const { data, error } = await session.supabase
    .from("profiles")
    .select("id, full_name, email, role, status_aktif, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return {
      items: [],
      source: "supabase",
      note: `Gagal membaca data user: ${error?.message ?? "unknown"}`,
    };
  }

  return {
    source: "supabase",
    items: data.map((item) => ({
      id: item.id,
      fullName: item.full_name ?? "-",
      email: item.email ?? "-",
      role: item.role,
      locationName: "-",
      statusAktif: item.status_aktif !== false,
      createdAt: item.created_at,
    })),
  };
}

export async function getAuditLogsCollection(): Promise<CollectionResult<AuditLogItem>> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: mockAuditLogs,
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const { data, error } = await session.supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, actor_name, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return {
      items: [],
      source: "supabase",
      note: `Gagal membaca audit log: ${error?.message ?? "unknown"}`,
    };
  }

  return {
    source: "supabase",
    items: data.map((item) => ({
      id: item.id,
      action: item.action,
      entityType: item.entity_type,
      entityId: item.entity_id ?? "-",
      actor: item.actor_name ?? "-",
      createdAt: item.created_at,
    })),
  };
}

export async function getMovementsCollection(): Promise<CollectionResult<AuditLogItem & { productName: string; locationName: string; movementType: string; sourceType: string; qtyChange: number; qtyAfter: number }>> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: [
        { id: "mov-001", action: "IN", entityType: "pembelian", entityId: "-", actor: "Admin Gudang", createdAt: "2026-04-29T10:00:00+07:00", productName: "Kabel LAN Cat6", locationName: "Gudang Utama", movementType: "IN", sourceType: "pembelian", qtyChange: 12, qtyAfter: 24 },
        { id: "mov-002", action: "OUT", entityType: "pengambilan", entityId: "-", actor: "Budi Pengambil", createdAt: "2026-04-29T11:30:00+07:00", productName: "Patch Panel 24 Port", locationName: "Gudang Cabang A", movementType: "OUT", sourceType: "pengambilan", qtyChange: -1, qtyAfter: 2 },
        { id: "mov-003", action: "IN", entityType: "drop_barang", entityId: "-", actor: "Petugas Gudang", createdAt: "2026-04-29T14:20:00+07:00", productName: "Label Rak 10x5", locationName: "Rak Transit", movementType: "IN", sourceType: "drop_barang", qtyChange: 6, qtyAfter: 6 },
      ],
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const { data, error } = await session.supabase
    .from("stock_movements")
    .select(
      "id, created_at, movement_type, source_type, qty_change, qty_after, products(nama_produk), locations(nama_lokasi)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return {
      items: [],
      source: "supabase",
      note: `Gagal membaca data mutasi stok: ${error?.message ?? "unknown"}`,
    };
  }

  return {
    source: "supabase",
    items: data.map((item) => {
      const productName =
        item.products && typeof item.products === "object" && !Array.isArray(item.products)
          ? ((item.products as Record<string, unknown>).nama_produk as string) ?? "-"
          : "-";
      const locationName =
        item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? ((item.locations as Record<string, unknown>).nama_lokasi as string) ?? "-"
          : "-";

      return {
        id: item.id,
        action: item.movement_type,
        entityType: item.source_type,
        entityId: "-",
        actor: "-",
        createdAt: item.created_at,
        productName,
        locationName,
        movementType: item.movement_type,
        sourceType: item.source_type,
        qtyChange: Number(item.qty_change ?? 0),
        qtyAfter: Number(item.qty_after ?? 0),
      };
    }),
  };
}

export async function getOpnameSessionsCollection(): Promise<CollectionResult<OpnameSession>> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: mockSessions,
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const [{ data, error }, { data: items }] = await Promise.all([
    session.supabase
      .from("opname_sessions")
      .select(
        "id, kode_sesi, nama_sesi, tanggal_mulai, tanggal_selesai, status, dibuat_oleh, locations(nama_lokasi)",
      )
      .order("created_at", { ascending: false }),
    session.supabase
      .from("opname_items")
      .select("session_id, status_hasil, stok_fisik"),
  ]);

  if (error || !data) {
    return {
      items: [],
      source: "supabase",
      note: `Gagal membaca sesi opname: ${error?.message ?? "unknown"}`,
    };
  }

  const userIds = [...new Set(data.map((r) => r.dibuat_oleh).filter(Boolean))] as string[];
  const nameMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await session.supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      nameMap.set(p.id, p.full_name ?? "User");
    }
  }

  const statsMap = new Map<string, { total: number; checked: number; selisih: number }>();
  for (const item of items ?? []) {
    const prev = statsMap.get(item.session_id) ?? { total: 0, checked: 0, selisih: 0 };
    prev.total++;
    if (item.stok_fisik !== null) prev.checked++;
    if (item.status_hasil === "lebih" || item.status_hasil === "kurang") prev.selisih++;
    statsMap.set(item.session_id, prev);
  }

  return {
    source: "supabase",
    items: data.map((item) => {
      const locationName =
        item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? ((item.locations as Record<string, unknown>).nama_lokasi as string) ?? "-"
          : "-";
      const createdBy = nameMap.get(item.dibuat_oleh) ?? "-";
      const stats = statsMap.get(item.id) ?? { total: 0, checked: 0, selisih: 0 };
      const progressPercent = stats.total > 0 ? Math.round((stats.checked / stats.total) * 100) : 0;

      return {
        id: item.id,
        kodeSesi: item.kode_sesi,
        namaSesi: item.nama_sesi,
        tanggalMulai: item.tanggal_mulai,
        tanggalSelesai: item.tanggal_selesai ?? "",
        lokasi: locationName,
        status: item.status,
        progressPercent,
        totalItem: stats.total,
        sudahDicek: stats.checked,
        selisihItem: stats.selisih,
        dibuatOleh: createdBy,
      };
    }),
  };
}

interface OpnameSessionDetailResult {
  source: DataSource;
  note?: string;
  session: OpnameSession | null;
  items: OpnameInputItem[];
}

export async function getOpnameSessionDetail(sessionId: string): Promise<OpnameSessionDetailResult> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    const mockSession = mockSessions.find((s) => s.id === sessionId);
    return {
      source: "mock",
      note: getFallbackNote(),
      session: mockSession ?? null,
      items: mockInputItems,
    };
  }

  const [{ data: sessionData, error: sessionError }, { data: itemsData, error: itemsError }] =
    await Promise.all([
      session.supabase
        .from("opname_sessions")
        .select(
          "id, kode_sesi, nama_sesi, tanggal_mulai, tanggal_selesai, status, location_id, locations(nama_lokasi), profiles!opname_sessions_dibuat_oleh_fkey(full_name)",
        )
        .eq("id", sessionId)
        .maybeSingle(),
      session.supabase
        .from("opname_items")
        .select(
          "id, session_id, stok_sistem_snapshot, stok_fisik, selisih, status_hasil, catatan, dihitung_at, products(sku, barcode_produk, nama_produk, categories(nama_kategori), units(nama_satuan)), locations(nama_lokasi), profiles!opname_items_dihitung_oleh_fkey(full_name)",
        )
        .eq("session_id", sessionId)
        .order("created_at"),
    ]);

  if (sessionError || !sessionData) {
    return {
      source: "mock",
      note: "Gagal membaca detail sesi opname dari Supabase.",
      session: null,
      items: [],
    };
  }

  const locationName =
    sessionData.locations && typeof sessionData.locations === "object" && !Array.isArray(sessionData.locations)
      ? ((sessionData.locations as Record<string, unknown>).nama_lokasi as string) ?? "-"
      : "-";
  const createdBy =
    sessionData.profiles && typeof sessionData.profiles === "object" && !Array.isArray(sessionData.profiles)
      ? ((sessionData.profiles as Record<string, unknown>).full_name as string) ?? "-"
      : "-";

  const allItems = itemsData ?? [];
  const totalItem = allItems.length;
  const sudahDicek = allItems.filter((i) => i.stok_fisik !== null).length;
  const selisihItem = allItems.filter((i) => i.status_hasil === "lebih" || i.status_hasil === "kurang").length;
  const progressPercent = totalItem > 0 ? Math.round((sudahDicek / totalItem) * 100) : 0;

  const opnameSession: OpnameSession = {
    id: sessionData.id,
    kodeSesi: sessionData.kode_sesi,
    namaSesi: sessionData.nama_sesi,
    tanggalMulai: sessionData.tanggal_mulai,
    tanggalSelesai: sessionData.tanggal_selesai ?? "",
    lokasi: locationName,
    status: sessionData.status,
    progressPercent,
    totalItem,
    sudahDicek,
    selisihItem,
    dibuatOleh: createdBy,
  };

  if (itemsError) {
    return {
      source: "supabase",
      note: "Gagal membaca item opname dari Supabase.",
      session: opnameSession,
      items: [],
    };
  }

  const items: OpnameInputItem[] = allItems.map((item) => {
    const product =
      item.products && typeof item.products === "object" && !Array.isArray(item.products)
        ? (item.products as Record<string, unknown>)
        : {};
    const sku = typeof product.sku === "string" ? product.sku : "-";
    const barcode = typeof product.barcode_produk === "string" ? product.barcode_produk : "";
    const namaProduk = typeof product.nama_produk === "string" ? product.nama_produk : "-";
    const categories =
      product.categories && typeof product.categories === "object" && !Array.isArray(product.categories)
        ? (product.categories as Record<string, unknown>)
        : null;
    const kategori = categories && typeof categories.nama_kategori === "string" ? categories.nama_kategori : "-";
    const units =
      product.units && typeof product.units === "object" && !Array.isArray(product.units)
        ? (product.units as Record<string, unknown>)
        : null;
    const satuan = units && typeof units.nama_satuan === "string" ? units.nama_satuan : "-";
    const itemLocationName =
      item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
        ? ((item.locations as Record<string, unknown>).nama_lokasi as string) ?? "-"
        : "-";
    const countedBy =
      item.profiles && typeof item.profiles === "object" && !Array.isArray(item.profiles)
        ? ((item.profiles as Record<string, unknown>).full_name as string) ?? "-"
        : undefined;

    const stokSistem = Number(item.stok_sistem_snapshot ?? 0);
    const stokFisik = item.stok_fisik !== null ? Number(item.stok_fisik) : null;
    const selisihVal = item.selisih !== null ? Number(item.selisih) : null;

    return {
      id: item.id,
      sku,
      barcode,
      namaProduk,
      kategori,
      satuan,
      lokasi: itemLocationName,
      stokSistem,
      stokFisik,
      selisih: selisihVal,
      nilaiSelisih: selisihVal !== null ? selisihVal * 50000 : null,
      statusHasil: item.status_hasil as OpnameInputItem["statusHasil"],
      catatan: item.catatan ?? undefined,
      petugas: countedBy,
      dihitungAt: item.dihitung_at ?? undefined,
    };
  });

  return {
    source: "supabase",
    session: opnameSession,
    items,
  };
}

export async function getOpnameFormOptions() {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      locations: mockLocations.map((item) => ({ id: item.id, label: `${item.kodeLokasi} - ${item.namaLokasi}` })),
      products: mockProducts.map((item) => ({ id: item.id, label: `${item.sku} - ${item.namaProduk}` })),
      source: "mock" as DataSource,
      note: getFallbackNote(),
    };
  }

  const [{ data: locations, error: locError }, { data: products, error: prodError }] = await Promise.all([
    session.supabase
      .from("locations")
      .select("id, kode_lokasi, nama_lokasi")
      .eq("status_aktif", true)
      .order("nama_lokasi"),
    session.supabase
      .from("products")
      .select("id, sku, nama_produk")
      .eq("status_aktif", true)
      .order("nama_produk"),
  ]);

  if (locError || prodError) {
    return {
      locations: mockLocations.map((item) => ({ id: item.id, label: `${item.kodeLokasi} - ${item.namaLokasi}` })),
      products: mockProducts.map((item) => ({ id: item.id, label: `${item.sku} - ${item.namaProduk}` })),
      source: "mock" as DataSource,
      note: "Gagal membaca data dari Supabase.",
    };
  }

  return {
    locations: (locations ?? []).map((item) => ({ id: item.id, label: `${item.kode_lokasi} - ${item.nama_lokasi}` })),
    products: (products ?? []).map((item) => ({ id: item.id, label: `${item.sku} - ${item.nama_produk}` })),
    source: "supabase" as DataSource,
  };
}

export interface AdjustmentItem {
  id: string;
  sessionId: string;
  kodeSesi: string;
  namaProduk: string;
  sku: string;
  stokAwal: number;
  stokAkhir: number;
  perubahan: number;
  alasan: string;
  appliedAt: string;
  locationName: string;
}

interface AdjustmentsResult {
  items: AdjustmentItem[];
  source: DataSource;
  note?: string;
}

export async function getAdjustmentsCollection(): Promise<AdjustmentsResult> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return {
      items: [],
      source: "mock",
      note: getFallbackNote(),
    };
  }

  const { data, error } = await session.supabase
    .from("opname_items")
    .select(
      "id, stok_sistem_snapshot, stok_fisik, selisih, status_hasil, dihitung_at, session_id, opname_sessions(kode_sesi, status), products(sku, nama_produk), locations(nama_lokasi)",
    )
    .not("stok_fisik", "is", null)
    .not("selisih", "eq", 0)
    .order("dihitung_at", { ascending: false });

  if (error || !data) {
    return {
      items: [],
      source: "mock",
      note: "Gagal membaca data koreksi dari Supabase.",
    };
  }

  return {
    source: "supabase",
    items: data.map((item) => {
      const session =
        item.opname_sessions && typeof item.opname_sessions === "object" && !Array.isArray(item.opname_sessions)
          ? (item.opname_sessions as Record<string, unknown>)
          : {};
      const product =
        item.products && typeof item.products === "object" && !Array.isArray(item.products)
          ? (item.products as Record<string, unknown>)
          : {};
      const location =
        item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? (item.locations as Record<string, unknown>)
          : {};

      const stokAwal = Number(item.stok_sistem_snapshot ?? 0);
      const stokFisik = Number(item.stok_fisik ?? 0);
      const selisih = Number(item.selisih ?? 0);

      return {
        id: item.id,
        sessionId: item.session_id,
        kodeSesi: typeof session.kode_sesi === "string" ? session.kode_sesi : "-",
        namaProduk: typeof product.nama_produk === "string" ? product.nama_produk : "-",
        sku: typeof product.sku === "string" ? product.sku : "-",
        stokAwal,
        stokAkhir: stokFisik,
        perubahan: selisih,
        alasan: item.status_hasil === "lebih"
          ? "Stok fisik lebih dari sistem"
          : item.status_hasil === "kurang"
            ? "Stok fisik kurang dari sistem"
            : "Koreksi opname",
        appliedAt: item.dihitung_at ?? "-",
        locationName: typeof location.nama_lokasi === "string" ? location.nama_lokasi : "-",
      };
    }),
  };
}

export interface StockOutProductDetail {
  productName: string;
  qty: number;
}

export interface UserStockOutHistoryItem {
  id: string;
  kodeTransaksi: string;
  tanggal: string;
  lokasi: string;
  productName: string;
  qty: number;
  status: string;
  keperluan: string;
  productDetails: StockOutProductDetail[];
}

export interface UserStockOutHistoryResult {
  source: DataSource;
  note?: string;
  items: UserStockOutHistoryItem[];
}

export async function getUserStockOutHistory(userId: string): Promise<UserStockOutHistoryResult> {
  const session = await getAuthenticatedSupabase();

  if (!session) {
    return { source: "mock", note: getFallbackNote(), items: [] };
  }

  const { data: transactions, error: txError } = await session.supabase
    .from("stock_out_transactions")
    .select("id, kode_transaksi, tanggal, status, keperluan, locations(nama_lokasi)")
    .eq("diambil_oleh", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (txError || !transactions) {
    return {
      source: "supabase",
      note: `Gagal membaca riwayat pengambilan: ${txError?.message ?? "unknown"}`,
      items: [],
    };
  }

  const txIds = transactions.map((r) => r.id);

  const { data: itemRows } = txIds.length > 0
    ? await session.supabase
        .from("stock_out_items")
        .select("transaction_id, qty, products(nama_produk)")
        .in("transaction_id", txIds)
    : { data: [] };

  const itemsByTx = new Map<string, Array<{ qty: number; productName: string }>>();
  for (const item of itemRows ?? []) {
    const list = itemsByTx.get(item.transaction_id) ?? [];
    const productName =
      item.products && typeof item.products === "object" && !Array.isArray(item.products)
        ? ((item.products as Record<string, unknown>).nama_produk as string) ?? "-"
        : "-";
    list.push({ qty: Number(item.qty ?? 0), productName });
    itemsByTx.set(item.transaction_id, list);
  }

  const items: UserStockOutHistoryItem[] = transactions.map((row) => {
    const locationName =
      row.locations &&
      typeof row.locations === "object" &&
      !Array.isArray(row.locations) &&
      typeof (row.locations as Record<string, unknown>).nama_lokasi === "string"
        ? ((row.locations as Record<string, unknown>).nama_lokasi as string)
        : "-";

    const itemsRow = itemsByTx.get(row.id) ?? [];
    const totalQty = itemsRow.reduce((acc, item) => acc + item.qty, 0);
    const productName =
      itemsRow.length > 1
        ? `Multi item (${itemsRow.length})`
        : itemsRow.length === 1
          ? itemsRow[0].productName
          : "-";

    return {
      id: row.id,
      kodeTransaksi: row.kode_transaksi,
      tanggal: row.tanggal,
      lokasi: locationName,
      productName,
      qty: totalQty,
      status: row.status,
      keperluan: row.keperluan ?? "-",
      productDetails: itemsRow.map((item) => ({
        productName: item.productName,
        qty: item.qty,
      })),
    };
  });

  return { source: "supabase", items };
}
