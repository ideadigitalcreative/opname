import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Boxes, MapPin, TrendingDown, TrendingUp } from "lucide-react";

import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProductDetail, getStockInFormOptions } from "@/lib/services/master-data";
import { setInitialStockAction } from "../actions";
import { SetInitialStockForm } from "./set-initial-stock-form";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const flashStatus = getSearchValue(resolvedSearchParams.statusType);
  const flashMessage = getSearchValue(resolvedSearchParams.message);

  const [result, stockInOptions] = await Promise.all([getProductDetail(id), getStockInFormOptions()]);

  if (!result.product) {
    notFound();
  }

  const product = result.product;
  const locations = stockInOptions.locations;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <PageHeader
            eyebrow="Detail Barang"
            title={product.namaProduk}
            description={`${product.sku} | ${product.kategori} | ${product.satuan}`}
          />
        </div>
        <Link
          href={`/products?edit=${product.id}#form-barang`}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:h-10 sm:px-4"
        >
          Edit Barang
        </Link>
      </div>

      {flashMessage ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm sm:rounded-2xl ${
            flashStatus === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {flashMessage}
        </div>
      ) : null}

      {result.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {result.note}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="shrink-0 rounded-lg bg-indigo-50 p-2">
            <Boxes className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Stok</p>
            <p className="text-xl font-semibold text-slate-900">
              {product.totalStok.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="shrink-0 rounded-lg bg-amber-50 p-2">
            <MapPin className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Lokasi</p>
            <p className="text-xl font-semibold text-slate-900">
              {product.stocks.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="shrink-0 rounded-lg bg-rose-50 p-2">
            <TrendingDown className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Min Stok</p>
            <p className="text-xl font-semibold text-slate-900">
              {product.minimumStok.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="shrink-0 rounded-lg bg-emerald-50 p-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <p className="text-xl font-semibold">
              <StatusBadge
                label={product.statusAktif ? "Aktif" : "Nonaktif"}
                tone={product.statusAktif ? "green" : "red"}
              />
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Set Stok Awal</h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Set qty stok per lokasi secara langsung. Perubahan dicatat sebagai koreksi (bukan transaksi stok masuk).
        </p>

        <SetInitialStockForm
          productId={product.id}
          locations={locations}
          currentStocks={product.stocks.map((s) => ({ locationId: s.locationId, qty: s.qty }))}
          action={setInitialStockAction}
        />
      </section>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1fr_1.5fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Stok Per Lokasi</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Jumlah stok produk tersebar di setiap lokasi penyimpanan.
          </p>

          {product.stocks.length > 0 ? (
            <div className="mt-4 space-y-2">
              {product.stocks.map((stock) => (
                <div
                  key={stock.locationName}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{stock.locationName}</p>
                    <p className="truncate text-xs text-slate-400">{stock.barcode}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                      stock.qty > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {stock.qty.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Belum ada stok"
                description="Produk ini belum tercatat di lokasi manapun."
              />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Riwayat Mutasi</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            50 mutasi terakhir yang melibatkan produk ini.
          </p>

          {product.movements.length > 0 ? (
            <div className="mt-4">
              <DataTable
                columns={[
                  { label: "Tanggal" },
                  { label: "Tipe" },
                  { label: "Sumber" },
                  { label: "Qty" },
                  { label: "Qty Akhir" },
                  { label: "Lokasi", hideOnMobile: true },
                ]}
                rows={product.movements.map((m) => [
                  new Date(m.createdAt).toLocaleDateString("id-ID"),
                  <span
                    key={`type-${m.id}`}
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      m.qtyChange > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {m.qtyChange > 0 ? "+" : ""}
                    {m.qtyChange.toLocaleString("id-ID")}
                  </span>,
                  m.sourceType.replaceAll("_", " "),
                  m.qtyChange,
                  m.qtyAfter,
                  m.locationName,
                ])}
              />
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Belum ada mutasi"
                description="Riwayat mutasi akan muncul setelah ada transaksi stok masuk atau keluar."
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
