import { NextResponse } from "next/server";
import path from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const LOGO_PATH = path.join(process.cwd(), "public", "Logo-labkes.svg");
let logoDataUrlPromise: Promise<string> | null = null;

async function getLogoPngDataUrl(): Promise<string> {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = (async () => {
      const svg = await readFile(LOGO_PATH);
      const png = await sharp(svg)
        .resize(360, 140, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
      return `data:image/png;base64,${png.toString("base64")}`;
    })();
  }
  return logoDataUrlPromise;
}

function safeStr(val: unknown): string {
  return val === null || val === undefined ? "-" : String(val);
}

function safeNum(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function getRelationField(row: unknown, field: string): unknown {
  if (row && typeof row === "object" && !Array.isArray(row)) {
    return (row as Record<string, unknown>)[field];
  }
  return undefined;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get("type") ?? "products";
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const month = searchParams.get("month") ?? "";

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase tidak tersedia" }, { status: 500 });
  }

  const logoDataUrl = await getLogoPngDataUrl();
  const resolvedRange = resolveDateRange(month, startDate, endDate);

  let headers: string[][] = [];
  let body: (string | number)[][] = [];
  let title = "Laporan";

  switch (reportType) {
    case "products": {
      title = "Laporan Data Produk";
      const { data } = await supabase
        .from("products")
        .select("sku, nama_produk, categories(nama_kategori), units(nama_satuan), minimum_stok, status_aktif")
        .order("created_at", { ascending: false });

      headers = [["No", "SKU", "Nama Produk", "Kategori", "Satuan", "Stok Min", "Status"]];
      body = (data ?? []).map((item, index) => {
        const cat = getRelationField(item.categories, "nama_kategori");
        const unit = getRelationField(item.units, "nama_satuan");
        return [
          index + 1,
          item.sku,
          item.nama_produk,
          safeStr(cat),
          safeStr(unit),
          safeNum(item.minimum_stok),
          item.status_aktif ? "Aktif" : "Nonaktif",
        ];
      });
      break;
    }
    case "stocks": {
      title = "Laporan Posisi Stok";
      const { data } = await supabase
        .from("product_stocks")
        .select("products(sku, nama_produk), locations(kode_lokasi, nama_lokasi), qty")
        .order("updated_at", { ascending: false });

      headers = [["No", "SKU", "Nama Produk", "Lokasi", "Qty"]];
      body = (data ?? []).map((item, index) => {
        const product = item.products && typeof item.products === "object" && !Array.isArray(item.products)
          ? (item.products as Record<string, unknown>) : {};
        const location = item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? (item.locations as Record<string, unknown>) : {};
        return [
          index + 1,
          safeStr(product.sku),
          safeStr(product.nama_produk),
          `${safeStr(location.kode_lokasi)} - ${safeStr(location.nama_lokasi)}`,
          safeNum(item.qty),
        ];
      });
      break;
    }
    case "stock-out": {
      title = "Laporan Barang Keluar";
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

      headers = [[
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
      ]];

      body = (itemRows ?? []).map((row, index) => {
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
        const locationLabel = `${safeStr(location.kode_lokasi)} - ${safeStr(location.nama_lokasi)}`;

        return [
          index + 1,
          safeStr(tx?.tanggal),
          locationLabel,
          safeStr(product.sku),
          safeStr(product.nama_produk),
          safeNum(row.qty),
          safeStr(units.nama_satuan),
          requesterName,
          safeStr(tx?.status),
          safeStr(tx?.keperluan),
          safeStr(tx?.catatan),
        ];
      });

      break;
    }
    case "full-report": {
      title = "Laporan Lengkap Stok Gudang";

      const [
        { data: products },
        { data: stocks },
        { data: movements },
        { count: totalLokasi },
        { count: totalTransaksiMasuk },
        { count: totalTransaksiKeluar },
      ] = await Promise.all([
        supabase
          .from("products")
          .select("id, sku, nama_produk, categories(nama_kategori), units(nama_satuan), minimum_stok, status_aktif")
          .eq("status_aktif", true)
          .order("sku"),
        supabase
          .from("product_stocks")
          .select("product_id, qty"),
        supabase
          .from("stock_movements")
          .select("product_id, movement_type, qty_change"),
        supabase
          .from("locations")
          .select("id", { count: "exact", head: true })
          .eq("status_aktif", true),
        supabase
          .from("stock_in_transactions")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("stock_out_transactions")
          .select("id", { count: "exact", head: true }),
      ]);

      const sisaStokMap = new Map<string, number>();
      for (const s of stocks ?? []) {
        const prev = sisaStokMap.get(s.product_id) ?? 0;
        sisaStokMap.set(s.product_id, prev + safeNum(s.qty));
      }

      const masukMap = new Map<string, number>();
      const keluarMap = new Map<string, number>();
      for (const m of movements ?? []) {
        const qty = safeNum(m.qty_change);
        if (m.movement_type === "IN") {
          masukMap.set(m.product_id, (masukMap.get(m.product_id) ?? 0) + qty);
        } else if (m.movement_type === "OUT") {
          keluarMap.set(m.product_id, (keluarMap.get(m.product_id) ?? 0) + Math.abs(qty));
        }
      }

      const totalProduk = (products ?? []).length;
      const totalStokSemua = Array.from(sisaStokMap.values()).reduce((a, b) => a + b, 0);
      const totalMasuk = Array.from(masukMap.values()).reduce((a, b) => a + b, 0);
      const totalKeluar = Array.from(keluarMap.values()).reduce((a, b) => a + b, 0);

      try {
        const { jsPDF } = await import("jspdf");
        const autoTable = (await import("jspdf-autotable")).default;

        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const generatedAt = new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" });

        function drawPageHeader(d: InstanceType<typeof jsPDF>) {
          d.addImage(logoDataUrl, "PNG", 14, 10, 36, 14);
          d.setFontSize(16);
          d.setFont("helvetica", "bold");
          d.text("Laporan Lengkap Stok Gudang", 54, 15);
          d.setFontSize(8);
          d.setFont("helvetica", "normal");
          d.setTextColor(100);
          d.text(`Digenerate pada ${generatedAt}`, 54, 21);
          d.setTextColor(0);
        }

        function drawPageFooter(d: InstanceType<typeof jsPDF>, pageNum: number, totalPagesCount: number) {
          d.setFontSize(7);
          d.setFont("helvetica", "normal");
          d.setTextColor(150);
          d.text("Sistem Manajemen Stok ", 14, pageHeight - 8);
          d.text(`Halaman ${pageNum} dari ${totalPagesCount}`, pageWidth - 14, pageHeight - 8, { align: "right" });
          d.setDrawColor(200);
          d.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
          d.setTextColor(0);
        }

        drawPageHeader(doc);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Ringkasan", 14, 30);

        autoTable(doc, {
          startY: 34,
          head: [["Metrik", "Nilai"]],
          body: [
            ["Total Produk Aktif", String(totalProduk)],
            ["Total Lokasi Aktif", String(totalLokasi ?? 0)],
            ["Total Transaksi Stok Masuk", String(totalTransaksiMasuk ?? 0)],
            ["Total Transaksi Pengambilan", String(totalTransaksiKeluar ?? 0)],
            ["Total Qty Masuk", String(totalMasuk)],
            ["Total Qty Keluar", String(totalKeluar)],
            ["Total Sisa Stok", String(totalStokSemua)],
          ],
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [79, 70, 229] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 14, right: 14, top: 25, bottom: 16 },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 80 },
            1: { halign: "right" },
          },
        });

        const detailRows = (products ?? []).map((item, index) => {
          const cat = getRelationField(item.categories, "nama_kategori");
          const masuk = masukMap.get(item.id) ?? 0;
          const keluar = keluarMap.get(item.id) ?? 0;
          const sisa = sisaStokMap.get(item.id) ?? 0;
          const minStok = safeNum(item.minimum_stok);
          const statusStok = sisa === 0 ? "HABIS" : sisa <= minStok ? "RENDAH" : "AMAN";

          return [
            index + 1,
            item.sku,
            item.nama_produk,
            safeStr(cat),
            masuk,
            keluar,
            sisa,
            minStok,
            statusStok,
          ];
        });

        doc.addPage();
        drawPageHeader(doc);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Detail Per Produk", 14, 30);

        autoTable(doc, {
          startY: 34,
          head: [["No", "SKU", "Nama Produk", "Kategori", "Masuk", "Keluar", "Sisa", "Min", "Status"]],
          body: detailRows,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [79, 70, 229], fontSize: 8 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 14, right: 14, top: 25, bottom: 16 },
          columnStyles: {
            0: { halign: "center", cellWidth: 12 },
            1: { cellWidth: 28 },
            2: { cellWidth: 65 },
            3: { cellWidth: 40 },
            4: { halign: "right", cellWidth: 22 },
            5: { halign: "right", cellWidth: 22 },
            6: { halign: "right", cellWidth: 22 },
            7: { halign: "right", cellWidth: 20 },
            8: { halign: "center", cellWidth: 22 },
          },
          didParseCell(data) {
            if (data.section === "body" && data.column.index === 8) {
              const val = String(data.cell.raw);
              if (val === "HABIS") {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = "bold";
              } else if (val === "RENDAH") {
                data.cell.styles.textColor = [217, 119, 6];
                data.cell.styles.fontStyle = "bold";
              } else {
                data.cell.styles.textColor = [5, 150, 105];
              }
            }
          },
          didDrawPage(data) {
            drawPageHeader(data.doc);
            drawPageFooter(data.doc, data.pageNumber, (data.doc as InstanceType<typeof jsPDF>).getNumberOfPages());
          },
        });

        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          drawPageFooter(doc, i, totalPages);
        }

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="laporan-lengkap-${new Date().toISOString().split("T")[0]}.pdf"`,
          },
        });
      } catch (err) {
        return NextResponse.json(
          { error: `Gagal generate PDF: ${String(err)}` },
          { status: 500 },
        );
      }
    }
    default:
      return NextResponse.json({ error: "Tipe PDF tidak valid" }, { status: 400 });
  }

  try {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const generatedAt = new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" });
    const tableFontSize = reportType === "stock-out" ? 6 : 8;
    const periodLabel = resolvedRange.label;

    function drawHeader(d: InstanceType<typeof jsPDF>) {
      d.addImage(logoDataUrl, "PNG", 14, 10, 36, 14);
      d.setFontSize(16);
      d.setFont("helvetica", "bold");
      d.text(title, 54, 15);
      d.setFontSize(8);
      d.setFont("helvetica", "normal");
      d.setTextColor(100);
      d.text(`Digenerate pada ${generatedAt}`, 54, 21);
      d.text(`Periode : ${periodLabel}`, 54, 25);
      d.setTextColor(0);
    }

    function drawFooter(d: InstanceType<typeof jsPDF>, pageNum: number, totalPagesCount: number) {
      d.setFontSize(7);
      d.setFont("helvetica", "normal");
      d.setTextColor(150);
      d.text("Sistem Manajemen Stok ", 14, pageHeight - 8);
      d.text(`Halaman ${pageNum} dari ${totalPagesCount}`, pageWidth - 14, pageHeight - 8, { align: "right" });
      d.setDrawColor(200);
      d.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
      d.setTextColor(0);
    }

    drawHeader(doc);

    autoTable(doc, {
      startY: 30,
      head: headers,
      body: body,
      styles: { fontSize: tableFontSize, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], fontSize: tableFontSize },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14, top: 25, bottom: 16 },
      didDrawPage(data) {
        drawHeader(data.doc);
        drawFooter(data.doc, data.pageNumber, (data.doc as InstanceType<typeof jsPDF>).getNumberOfPages());
      },
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawFooter(doc, i, totalPages);
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laporan-${reportType}-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Gagal generate PDF: ${String(err)}` },
      { status: 500 },
    );
  }
}
