import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const TEMPLATE_PATH = path.join(process.cwd(), "public", "Laporan_Aset_20260512_1354.xlsx");
const LOGO_PATH = path.join(process.cwd(), "public", "Logo-labkes.svg");

let templateBufferPromise: Promise<ArrayBuffer> | null = null;
let logoPngPromise: Promise<ArrayBuffer> | null = null;

function getStringParam(value: string | null): string {
  return value ?? "";
}

function formatPeriodLabel(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return "-";
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  return startDate ? `${startDate} -` : `- ${endDate}`;
}

function resolveDateRange(month: string, startDate: string, endDate: string) {
  if (month) {
    const [yearRaw, monthRaw] = month.split("-");
    const year = Number(yearRaw);
    const monthIndex = Number(monthRaw) - 1;
    if (Number.isFinite(year) && Number.isFinite(monthIndex) && monthIndex >= 0 && monthIndex <= 11) {
      const start = new Date(Date.UTC(year, monthIndex, 1));
      const end = new Date(Date.UTC(year, monthIndex + 1, 0));
      const startLabel = start.toISOString().slice(0, 10);
      const endLabel = end.toISOString().slice(0, 10);
      return { startDate: startLabel, endDate: endLabel, label: `${startLabel} - ${endLabel}` };
    }
  }

  return { startDate, endDate, label: formatPeriodLabel(startDate, endDate) };
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(data.byteLength);
  new Uint8Array(ab).set(data);
  return ab;
}

async function getTemplateBuffer(): Promise<ArrayBuffer> {
  if (!templateBufferPromise) {
    templateBufferPromise = (async () => {
      const buf = await readFile(TEMPLATE_PATH);
      return toArrayBuffer(buf);
    })();
  }
  return templateBufferPromise;
}

async function getLogoPngBuffer(): Promise<ArrayBuffer> {
  if (!logoPngPromise) {
    logoPngPromise = (async () => {
      const svg = await readFile(LOGO_PATH);
      const png = await sharp(svg)
        .resize(160, 50, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
      return toArrayBuffer(png);
    })();
  }
  return logoPngPromise;
}

function getRelationField(row: unknown, field: string): unknown {
  if (row && typeof row === "object" && !Array.isArray(row)) {
    return (row as Record<string, unknown>)[field];
  }
  return undefined;
}

function getReportMeta(reportType: string): { title: string; sheetName: string } {
  switch (reportType) {
    case "products":
      return { title: "Laporan Data Produk", sheetName: "Produk" };
    case "stocks":
      return { title: "Laporan Posisi Stok", sheetName: "Posisi Stok" };
    case "movements":
      return { title: "Laporan Mutasi Stok", sheetName: "Mutasi Stok" };
    case "opname":
      return { title: "Laporan Stock Opname", sheetName: "Opname" };
    case "stock-out":
      return { title: "Laporan Barang Keluar", sheetName: "Barang Keluar" };
    default:
      return { title: "Laporan", sheetName: "Laporan" };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get("type") ?? "products";
  const startDate = getStringParam(searchParams.get("startDate"));
  const endDate = getStringParam(searchParams.get("endDate"));
  const month = getStringParam(searchParams.get("month"));
  const locationLabel = getStringParam(searchParams.get("location"));

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase tidak tersedia" }, { status: 500 });
  }

  const { title, sheetName } = getReportMeta(reportType);
  const resolvedRange = resolveDateRange(month, startDate, endDate);
  let headers: string[] = [];
  let rows: (string | number | boolean)[][] = [];

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
        return [item.sku, item.barcode_produk ?? "", item.nama_produk, cat, unit, item.stok_minimum, item.status_aktif ? "Aktif" : "Nonaktif"];
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

      headers = ["SKU", "Nama Produk", "Lokasi", "Tipe Mutasi", "Qty", "Referensi", "Waktu"];
      rows = (data ?? []).map((item) => {
        const product = item.products && typeof item.products === "object" && !Array.isArray(item.products)
          ? (item.products as Record<string, unknown>) : {};
        const location = item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? (item.locations as Record<string, unknown>) : {};
        return [
          (product.sku as string) ?? "-",
          (product.nama_produk as string) ?? "-",
          `${(location.kode_lokasi as string) ?? "-"} - ${(location.nama_lokasi as string) ?? "-"}`,
          item.tipe_mutasi,
          Number(item.qty),
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
          (product.sku as string) ?? "-",
          (product.nama_produk as string) ?? "-",
          (location.nama_lokasi as string) ?? "-",
          Number(item.stok_sistem_snapshot ?? 0),
          item.stok_fisik ?? "-",
          item.selisih ?? "-",
          item.status_hasil,
          (session.kode_sesi as string) ?? "-",
          item.dihitung_at ?? "-",
        ];
      });
      break;
    }
    case "stock-out": {
      let txQuery = supabase
        .from("stock_out_transactions")
        .select("id, kode_transaksi, tanggal, status, keperluan, catatan, diambil_oleh, locations(kode_lokasi, nama_lokasi)");

      if (resolvedRange.startDate) {
        txQuery = txQuery.gte("tanggal", resolvedRange.startDate);
      }

      if (resolvedRange.endDate) {
        txQuery = txQuery.lte("tanggal", resolvedRange.endDate);
      }

      const { data: transactions, error: txError } = await txQuery
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
        "No",
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

      rows = (itemRows ?? []).map((row, index) => {
        const tx = txMap.get(row.transaction_id);
        const location = tx?.locations && typeof tx.locations === "object" && !Array.isArray(tx.locations)
          ? (tx.locations as Record<string, unknown>)
          : {};
        const product = row.products && typeof row.products === "object" && !Array.isArray(row.products)
          ? (row.products as Record<string, unknown>)
          : {};
        const units = getRelationField(product.units, "nama_satuan");

        const requesterName = tx?.diambil_oleh ? (nameMap.get(tx.diambil_oleh) ?? "User") : "User";
        const locationLabelTx = `${location.kode_lokasi ?? "-"} - ${location.nama_lokasi ?? "-"}`;

        return [
          index + 1,
          tx?.tanggal ?? "-",
          locationLabelTx,
          (product.sku as string) ?? "-",
          (product.nama_produk as string) ?? "-",
          Number(row.qty ?? 0),
          typeof units === "string" ? units : "-",
          requesterName,
          tx?.status ?? "-",
          tx?.keperluan ?? "",
          tx?.catatan ?? "",
        ];
      });

      break;
    }
    default:
      return NextResponse.json({ error: "Tipe export tidak valid" }, { status: 400 });
  }

  try {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await getTemplateBuffer());

    const sheet = workbook.worksheets[0] ?? workbook.addWorksheet(sheetName);
    sheet.name = sheetName;
    sheet.headerFooter = {
      differentFirst: false,
      differentOddEven: false,
      oddHeader: "",
      oddFooter: "",
      evenHeader: "",
      evenFooter: "",
      firstHeader: "",
      firstFooter: "",
    };

    const titleStyle = sheet.getCell(5, 1).style;
    const leftMetaStyle = sheet.getCell(6, 1).style;
    const rightMetaStyle = sheet.getCell(6, 3).style;
    const metaRowStyle = sheet.getCell(7, 1).style;
    const headerStyle = sheet.getCell(9, 1).style;
    const bodyStyle = sheet.getCell(10, 1).style;
    const headerRowHeight = sheet.getRow(9).height;
    const bodyRowHeight = sheet.getRow(10).height;

    const columnCount = Math.max(headers.length, 4);

    if (sheet.rowCount >= 9) {
      sheet.spliceRows(9, sheet.rowCount - 8);
    }

    const safeUnmerge = (address: string) => {
      try {
        sheet.unMergeCells(address);
      } catch {
      }
    };

    const mergeContainer = sheet as unknown as { _merges?: Record<string, unknown> };
    const existingMerges = Object.keys(mergeContainer._merges ?? {});
    for (const address of existingMerges) {
      safeUnmerge(address);
    }

    sheet.mergeCells(5, 1, 5, columnCount);
    const titleCell = sheet.getCell(5, 1);
    titleCell.value = title;
    titleCell.style = titleStyle;

    const leftEndCol = Math.max(2, Math.floor(columnCount / 2));
    const rightStartCol = leftEndCol + 1;

    sheet.mergeCells(6, 1, 6, leftEndCol);
    sheet.mergeCells(6, rightStartCol, 6, columnCount);
    const leftMetaCell = sheet.getCell(6, 1);
    leftMetaCell.value = `Lokasi : ${locationLabel || "Semua"}`;
    leftMetaCell.style = leftMetaStyle;
    const rightMetaCell = sheet.getCell(6, rightStartCol);
    rightMetaCell.value = `Periode : ${resolvedRange.label}`;
    rightMetaCell.style = rightMetaStyle;

    sheet.mergeCells(7, 1, 7, columnCount);
    const metaCell = sheet.getCell(7, 1);
    metaCell.value = `Digenerate : ${new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}`;
    metaCell.style = metaRowStyle;

    const headerRow = sheet.getRow(9);
    if (headerRowHeight) headerRow.height = headerRowHeight;
    for (let col = 1; col <= columnCount; col += 1) {
      const cell = headerRow.getCell(col);
      cell.value = headers[col - 1] ?? "";
      cell.style = headerStyle;
    }

    for (let i = 0; i < rows.length; i += 1) {
      const targetRow = sheet.getRow(10 + i);
      if (bodyRowHeight) targetRow.height = bodyRowHeight;
      const rowValues = rows[i] ?? [];
      for (let col = 1; col <= columnCount; col += 1) {
        const cell = targetRow.getCell(col);
        cell.value = rowValues[col - 1] ?? "";
        cell.style = bodyStyle;
      }
    }

    sheet.autoFilter = {
      from: { row: 9, column: 1 },
      to: { row: 9, column: columnCount },
    };

    for (let col = 1; col <= columnCount; col += 1) {
      let maxLength = Math.max(10, String(headers[col - 1] ?? "").length + 2);
      for (let rowIndex = 10; rowIndex < 10 + Math.min(rows.length, 500); rowIndex += 1) {
        const cellValue = sheet.getCell(rowIndex, col).value;
        const text = cellValue === null || cellValue === undefined ? "" : String(cellValue);
        maxLength = Math.max(maxLength, Math.min(text.length + 2, 60));
      }
      sheet.getColumn(col).width = maxLength;
    }

    const logoPng = await getLogoPngBuffer();
    const media = workbook.model.media;
    if (media && media[0] && media[0].type === "image") {
      media[0].buffer = logoPng;
      media[0].extension = "png";
    } else {
      const imageId = workbook.addImage({ buffer: logoPng, extension: "png" });
      sheet.addImage(imageId, {
        tl: { col: 0.15, row: 0.2 },
        ext: { width: 140, height: 48 },
      });
    }

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
