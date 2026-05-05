import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { StockInMultiForm } from "@/components/forms/stock-in-multi-form";
import { getStockInCollection, getStockInFormOptions } from "@/lib/services/master-data";
import { createStockInAction } from "./actions";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function StockInPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = getSearchValue(resolvedSearchParams.q).toLowerCase();
  const tipeMasuk = getSearchValue(resolvedSearchParams.tipeMasuk);
  const flashStatus = getSearchValue(resolvedSearchParams.statusType);
  const flashMessage = getSearchValue(resolvedSearchParams.message);

  const [transactionsResult, formOptions] = await Promise.all([
    getStockInCollection(),
    getStockInFormOptions(),
  ]);

  const filteredTransactions = transactionsResult.items.filter((item) => {
    const matchesQuery =
      !query ||
      item.kodeTransaksi.toLowerCase().includes(query) ||
      item.lokasiTujuan.toLowerCase().includes(query) ||
      (item.supplier ?? "").toLowerCase().includes(query) ||
      (item.sumberDrop ?? "").toLowerCase().includes(query);

    const matchesType = !tipeMasuk || item.tipeMasuk === tipeMasuk;
    return matchesQuery && matchesType;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Transaksi"
        title="Stok Masuk"
        description="Catat pembelian dan drop barang ke lokasi tujuan. Submit akan menyimpan transaksi lalu dapat langsung memanggil RPC `apply_stock_in()` agar stok dan mutasi tercatat konsisten."
        actions={
          <a
            href="#form-stok-masuk"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:h-10 sm:px-4"
          >
            + Buat transaksi
          </a>
        }
      />

      {flashMessage ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            flashStatus === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {flashMessage}
        </div>
      ) : null}

      {transactionsResult.note ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {transactionsResult.note}
        </div>
      ) : null}

      <form method="get">
        <FilterBar>
          <div className="w-full lg:max-w-sm">
            <SearchInput
              name="q"
              defaultValue={getSearchValue(resolvedSearchParams.q)}
              placeholder="Cari kode transaksi, supplier, sumber, atau lokasi..."
            />
          </div>
          <select
            name="tipeMasuk"
            defaultValue={tipeMasuk}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          >
            <option value="">Semua tipe masuk</option>
            <option value="pembelian">Pembelian</option>
            <option value="drop_barang">Drop Barang</option>
          </select>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Filter
          </button>
        </FilterBar>
      </form>

      <section
        id="form-stok-masuk"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5"
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Form Stok Masuk Multi Item</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Tambahkan beberapa item dalam satu transaksi. Data ditulis ke tabel stock_in_items dan dapat langsung di-apply via RPC.
          </p>
        </div>

        {formOptions.note ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {formOptions.note}
          </div>
        ) : null}

        <StockInMultiForm
          products={formOptions.products}
          locations={formOptions.locations}
          action={createStockInAction}
        />
      </section>

      {filteredTransactions.length > 0 ? (
        <DataTable
          columns={[
            "Kode",
            "Tipe Masuk",
            "Tanggal",
            "Lokasi Tujuan",
            "Total Item",
            "Total Qty",
            "Dibuat Oleh",
            "Applied",
          ]}
          rows={filteredTransactions.map((item) => [
            item.kodeTransaksi,
            item.tipeMasuk.replaceAll("_", " "),
            item.tanggal,
            item.lokasiTujuan,
            item.totalItem,
            item.totalQty,
            item.dibuatOleh,
            item.appliedAt ? "Sudah" : "Belum",
          ])}
        />
      ) : (
        <EmptyState
          title="Belum ada transaksi stok masuk"
          description="Buat transaksi pembelian atau drop barang terlebih dahulu, atau ubah filter pencarian yang sedang aktif."
        />
      )}
    </div>
  );
}
