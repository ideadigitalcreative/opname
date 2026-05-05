import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get("type") ?? "products";

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase tidak tersedia" }, { status: 500 });
  }

  let headers: string[][] = [];
  let body: (string | number)[][] = [];
  let title = "Laporan";

  switch (reportType) {
    case "products": {
      title = "Laporan Data Produk";
      const { data } = await supabase
        .from("products")
        .select("sku, nama_produk, categories(nama_kategori), units(nama_satuan), stok_minimum, status_aktif")
        .order("created_at", { ascending: false });

      headers = [["SKU", "Nama Produk", "Kategori", "Satuan", "Stok Min", "Status"]];
      body = (data ?? []).map((item) => {
        const cat = getRelationField(item.categories, "nama_kategori");
        const unit = getRelationField(item.units, "nama_satuan");
        return [
          item.sku,
          item.nama_produk,
          safeStr(cat),
          safeStr(unit),
          item.stok_minimum,
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

      headers = [["SKU", "Nama Produk", "Lokasi", "Qty"]];
      body = (data ?? []).map((item) => {
        const product = item.products && typeof item.products === "object" && !Array.isArray(item.products)
          ? (item.products as Record<string, unknown>) : {};
        const location = item.locations && typeof item.locations === "object" && !Array.isArray(item.locations)
          ? (item.locations as Record<string, unknown>) : {};
        return [
          safeStr(product.sku),
          safeStr(product.nama_produk),
          `${safeStr(location.kode_lokasi)} - ${safeStr(location.nama_lokasi)}`,
          item.qty,
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

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("Laporan Lengkap Stok Gudang", 14, 18);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        doc.text(`Digenerate pada ${new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}`, 14, 26);
        doc.setTextColor(0);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Ringkasan", 14, 36);

        autoTable(doc, {
          startY: 40,
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
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 80 },
            1: { halign: "right" },
          },
        });

        const ringkasanEndY = (doc as unknown as Record<string, { previous?: { finalY?: number } }>).lastAutoTable?.previous?.finalY ?? 40;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Detail Per Produk", 14, ringkasanEndY + 10);

        headers = [["No", "SKU", "Nama Produk", "Kategori", "Satuan", "Qty Masuk", "Qty Keluar", "Sisa Stok", "Stok Min", "Status"]];
        body = (products ?? []).map((item, index) => {
          const cat = getRelationField(item.categories, "nama_kategori");
          const unit = getRelationField(item.units, "nama_satuan");
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
            safeStr(unit),
            masuk,
            keluar,
            sisa,
            minStok,
            statusStok,
          ];
        });

        autoTable(doc, {
          startY: ringkasanEndY + 14,
          head: headers,
          body: body,
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: [79, 70, 229] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { halign: "center", cellWidth: 10 },
            5: { halign: "right" },
            6: { halign: "right" },
            7: { halign: "right" },
            8: { halign: "right" },
          },
          didParseCell(data) {
            if (data.section === "body" && data.column.index === 9) {
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
        });

        const detailEndY = (doc as unknown as Record<string, { previous?: { finalY?: number } }>).lastAutoTable?.previous?.finalY ?? 40;
        const pageHeight = doc.internal.pageSize.getHeight();

        if (detailEndY + 20 < pageHeight) {
          doc.setFontSize(8);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(150);
          doc.text(
            "Dokumen ini digenerate otomatis oleh Sistem Manajemen Stok Gudang.",
            14,
            detailEndY + 10,
          );
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

    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Digenerate pada ${new Date().toLocaleString("id-ID")}`, 14, 22);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 28,
      head: headers,
      body: body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

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
