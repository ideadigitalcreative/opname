import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function escapeCsv(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(cells: unknown[]): string {
  return cells.map(escapeCsv).join(",");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get("type") ?? "products";

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase tidak tersedia" }, { status: 500 });
  }

  let headers: string[] = [];
  let rows: string[][] = [];

  switch (reportType) {
    case "products": {
      const { data } = await supabase
        .from("products")
        .select("sku, barcode_produk, nama_produk, categories(nama_kategori), units(nama_satuan), stok_minimum, status_aktif")
        .order("created_at", { ascending: false });

      headers = ["SKU", "Barcode", "Nama Produk", "Kategori", "Satuan", "Stok Minimum", "Status"];
      rows = (data ?? []).map((item) => {
        const cat = item.categories && typeof item.categories === "object" && !Array.isArray(item.categories)
          ? (item.categories as Record<string, unknown>).nama_kategori as string : "-";
        const unit = item.units && typeof item.units === "object" && !Array.isArray(item.units)
          ? (item.units as Record<string, unknown>).nama_satuan as string : "-";
        return [
          item.sku,
          item.barcode_produk ?? "",
          item.nama_produk,
          cat,
          unit,
          item.stok_minimum,
          item.status_aktif ? "Aktif" : "Nonaktif",
        ];
      });
      break;
    }
    case "stocks": {
      const { data } = await supabase
        .from("product_stocks")
        .select("products(sku, nama_produk), locations(kode_lokasi, nama_lokasi), qty, updated_at")
        .order("updated_at", { ascending: false });

      headers = ["SKU", "Nama Produk", "Kode Lokasi", "Nama Lokasi", "Qty", "Terakhir Diupdate"];
      rows = (data ?? []).map((item) => {
        const product = item.products && typeof item.products === "object" && !Array.isArray(item.products)
          ? (item.products as Record<string, unknown>) : {};
        const location = item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? (item.locations as Record<string, unknown>) : {};
        return [
          product.sku ?? "-",
          product.nama_produk ?? "-",
          location.kode_lokasi ?? "-",
          location.nama_lokasi ?? "-",
          item.qty,
          item.updated_at,
        ];
      });
      break;
    }
    case "movements": {
      const { data } = await supabase
        .from("stock_movements")
        .select("id, products(sku, nama_produk), locations(kode_lokasi, nama_lokasi), tipe_mutasi, qty, referensi_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);

      headers = ["ID", "SKU", "Nama Produk", "Lokasi", "Tipe Mutasi", "Qty", "Referensi", "Waktu"];
      rows = (data ?? []).map((item) => {
        const product = item.products && typeof item.products === "object" && !Array.isArray(item.products)
          ? (item.products as Record<string, unknown>) : {};
        const location = item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? (item.locations as Record<string, unknown>) : {};
        return [
          item.id,
          product.sku ?? "-",
          product.nama_produk ?? "-",
          location.kode_lokasi ?? "-",
          item.tipe_mutasi,
          item.qty,
          item.referensi_id ?? "",
          item.created_at,
        ];
      });
      break;
    }
    case "opname": {
      const { data } = await supabase
        .from("opname_items")
        .select(
          "products(sku, nama_produk), locations(nama_lokasi), stok_sistem_snapshot, stok_fisik, selisih, status_hasil, opname_sessions(kode_sesi, status), dihitung_at",
        )
        .order("dihitung_at", { ascending: false });

      headers = ["SKU", "Nama Produk", "Lokasi", "Sistem", "Fisik", "Selisih", "Status", "Sesi", "Waktu"];
      rows = (data ?? []).map((item) => {
        const product = item.products && typeof item.products === "object" && !Array.isArray(item.products)
          ? (item.products as Record<string, unknown>) : {};
        const location = item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? (item.locations as Record<string, unknown>) : {};
        const session = item.opname_sessions && typeof item.opname_sessions === "object" && !Array.isArray(item.opname_sessions)
          ? (item.opname_sessions as Record<string, unknown>) : {};
        return [
          product.sku ?? "-",
          product.nama_produk ?? "-",
          location.nama_lokasi ?? "-",
          item.stok_sistem_snapshot,
          item.stok_fisik ?? "-",
          item.selisih ?? "-",
          item.status_hasil,
          session.kode_sesi ?? "-",
          item.dihitung_at ?? "-",
        ];
      });
      break;
    }
    case "stock-out": {
      const { data: transactions, error: txError } = await supabase
        .from("stock_out_transactions")
        .select("id, kode_transaksi, tanggal, status, keperluan, catatan, diambil_oleh, locations(kode_lokasi, nama_lokasi)")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (txError) {
        return NextResponse.json({ error: `Gagal membaca transaksi barang keluar: ${txError.message}` }, { status: 500 });
      }

      const txIds = (transactions ?? []).map((row) => row.id);

      const [{ data: itemRows, error: itemError }, { data: profiles, error: profileError }] = await Promise.all([
        txIds.length > 0
          ? supabase
              .from("stock_out_items")
              .select("transaction_id, qty, products(sku, nama_produk, units(nama_satuan))")
              .in("transaction_id", txIds)
          : Promise.resolve({ data: [], error: null }),
        (() => {
          const userIds = [...new Set((transactions ?? []).map((row) => row.diambil_oleh).filter(Boolean))] as string[];
          if (userIds.length === 0) return Promise.resolve({ data: [], error: null });
          return supabase.from("profiles").select("id, full_name").in("id", userIds);
        })(),
      ]);

      if (itemError) {
        return NextResponse.json({ error: `Gagal membaca item barang keluar: ${itemError.message}` }, { status: 500 });
      }

      if (profileError) {
        return NextResponse.json({ error: `Gagal membaca data pengambil: ${profileError.message}` }, { status: 500 });
      }

      const txMap = new Map<string, (typeof transactions)[number]>();
      for (const tx of transactions ?? []) {
        txMap.set(tx.id, tx);
      }

      const nameMap = new Map<string, string>();
      for (const p of profiles ?? []) {
        nameMap.set(p.id, p.full_name ?? "User");
      }

      headers = [
        "Kode Transaksi",
        "Tanggal",
        "Lokasi",
        "SKU",
        "Nama Produk",
        "Qty",
        "Satuan",
        "Diambil Oleh",
        "Status",
        "Keperluan",
        "Catatan",
      ];

      rows = (itemRows ?? []).map((row) => {
        const tx = txMap.get(row.transaction_id);
        const location = tx?.locations && typeof tx.locations === "object" && !Array.isArray(tx.locations)
          ? (tx.locations as Record<string, unknown>)
          : {};
        const product = row.products && typeof row.products === "object" && !Array.isArray(row.products)
          ? (row.products as Record<string, unknown>)
          : {};
        const units = product.units && typeof product.units === "object" && !Array.isArray(product.units)
          ? (product.units as Record<string, unknown>)
          : {};

        const requesterName = tx?.diambil_oleh ? (nameMap.get(tx.diambil_oleh) ?? "User") : "User";
        const locationLabel = `${location.kode_lokasi ?? "-"} - ${location.nama_lokasi ?? "-"}`;

        return [
          tx?.kode_transaksi ?? "-",
          tx?.tanggal ?? "-",
          locationLabel,
          (product.sku as string) ?? "-",
          (product.nama_produk as string) ?? "-",
          String(row.qty ?? 0),
          (units.nama_satuan as string) ?? "-",
          requesterName,
          tx?.status ?? "-",
          tx?.keperluan ?? "",
          tx?.catatan ?? "",
        ];
      });

      break;
    }
    default:
      return NextResponse.json({ error: "Tipe laporan tidak valid" }, { status: 400 });
  }

  const csvContent = [
    toCsvRow(headers),
    ...rows.map(toCsvRow),
  ].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-${reportType}-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
