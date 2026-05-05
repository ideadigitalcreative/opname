import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get("type") ?? "products";

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase tidak tersedia" }, { status: 500 });
  }

  let headers: string[] = [];
  let rows: (string | number | boolean)[][] = [];
  let sheetName = "Laporan";

  switch (reportType) {
    case "products": {
      const { data } = await supabase
        .from("products")
        .select("sku, barcode_produk, nama_produk, categories(nama_kategori), units(nama_satuan), stok_minimum, status_aktif")
        .order("created_at", { ascending: false });

      sheetName = "Produk";
      headers = ["SKU", "Barcode", "Nama Produk", "Kategori", "Satuan", "Stok Minimum", "Status"];
      rows = (data ?? []).map((item) => {
        const cat = item.categories && typeof item.categories === "object" && !Array.isArray(item.categories)
          ? (item.categories as Record<string, unknown>).nama_kategori as string : "-";
        const unit = item.units && typeof item.units === "object" && !Array.isArray(item.units)
          ? (item.units as Record<string, unknown>).nama_satuan as string : "-";
        return [item.sku, item.barcode_produk ?? "", item.nama_produk, cat, unit, item.stok_minimum, item.status_aktif ? "Aktif" : "Nonaktif"];
      });
      break;
    }
    case "stocks": {
      const { data } = await supabase
        .from("product_stocks")
        .select("products(sku, nama_produk), locations(kode_lokasi, nama_lokasi), qty, updated_at")
        .order("updated_at", { ascending: false });

      sheetName = "Posisi Stok";
      headers = ["SKU", "Nama Produk", "Kode Lokasi", "Nama Lokasi", "Qty", "Terakhir Diupdate"];
      rows = (data ?? []).map((item) => {
        const product = item.products && typeof item.products === "object" && !Array.isArray(item.products)
          ? (item.products as Record<string, unknown>) : {};
        const location = item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? (item.locations as Record<string, unknown>) : {};
        return [product.sku as string ?? "-", product.nama_produk as string ?? "-", location.kode_lokasi as string ?? "-", location.nama_lokasi as string ?? "-", Number(item.qty), item.updated_at];
      });
      break;
    }
    case "movements": {
      const { data } = await supabase
        .from("stock_movements")
        .select("products(sku, nama_produk), locations(kode_lokasi, nama_lokasi), tipe_mutasi, qty, referensi_id, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);

      sheetName = "Mutasi Stok";
      headers = ["SKU", "Nama Produk", "Lokasi", "Tipe Mutasi", "Qty", "Referensi", "Waktu"];
      rows = (data ?? []).map((item) => {
        const product = item.products && typeof item.products === "object" && !Array.isArray(item.products)
          ? (item.products as Record<string, unknown>) : {};
        const location = item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? (item.locations as Record<string, unknown>) : {};
        return [product.sku as string ?? "-", product.nama_produk as string ?? "-", location.kode_lokasi as string ?? "-", item.tipe_mutasi, Number(item.qty), item.referensi_id ?? "", item.created_at];
      });
      break;
    }
    default:
      return NextResponse.json({ error: "Tipe export tidak valid" }, { status: 400 });
  }

  try {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistem Manajemen Stok Gudang";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName);

    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    headerRow.alignment = { horizontal: "center" };

    for (const row of rows) {
      sheet.addRow(row);
    }

    sheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const val = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, Math.min(val.length + 2, 50));
      });
      column.width = maxLength;
    });

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="laporan-${reportType}-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Gagal generate Excel: ${String(err)}` },
      { status: 500 },
    );
  }
}
