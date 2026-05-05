import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { StockOutMultiForm } from "@/components/forms/stock-out-multi-form";
import {
  getStockOutAvailableItems,
  getStockOutHistoryCollection,
  getStockOutLocationByBarcode,
} from "@/lib/services/master-data";
import { createStockOutAction } from "./actions";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function StockOutPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const barcode = getSearchValue(resolvedSearchParams.barcode);
  const query = getSearchValue(resolvedSearchParams.q).toLowerCase();
  const flashStatus = getSearchValue(resolvedSearchParams.statusType);
  const flashMessage = getSearchValue(resolvedSearchParams.message);

  const locationResult = barcode ? await getStockOutLocationByBarcode(barcode) : null;
  const location = locationResult?.location ?? null;
  const availableItemsResult = location ? await getStockOutAvailableItems(location.id) : null;
  const historyResult = await getStockOutHistoryCollection();

  const availableItems = (availableItemsResult?.items ?? []).filter((item) => {
    if (!query) return true;
    return (
      item.namaProduk.toLowerCase().includes(query) || item.sku.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Pengambilan"
        title="Ambil Barang"
        description="Scan atau input barcode lokasi untuk menampilkan produk yang tersedia (qty > 0). Submit pengambilan akan memanggil RPC agar stok berkurang secara aman dan tercatat di mutasi."
        actions={
          <div className="flex gap-2">
            <a
              href="#form-scan-lokasi"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:h-10 sm:px-4"
            >
              Input barcode
            </a>
            <Button disabled size="sm" className="sm:size-default">Scan lokasi</Button>
          </div>
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

      {locationResult?.note ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {locationResult.note}
        </div>
      ) : null}

      <section
        id="form-scan-lokasi"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5"
      >
        <form method="get">
          <FilterBar>
            <div className="w-full lg:max-w-sm">
              <SearchInput
                name="barcode"
                defaultValue={barcode}
                placeholder="Input barcode lokasi (contoh: LOC-RAK-A1-2026)"
              />
            </div>
            <Button type="submit">Tampilkan</Button>
          </FilterBar>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">Lokasi aktif</p>
            <h2 className="truncate text-xl font-semibold text-slate-900 sm:text-2xl">
              {location?.namaLokasi ?? "-"}
            </h2>
            <p className="mt-1 truncate text-xs text-slate-400 sm:text-sm">
              Barcode: {location?.barcodeValue ?? "-"}
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <form method="get">
              <input type="hidden" name="barcode" value={barcode} />
              <SearchInput
                name="q"
                defaultValue={getSearchValue(resolvedSearchParams.q)}
                placeholder="Cari produk dalam lokasi..."
              />
            </form>
          </div>
        </div>

        {!barcode ? (
          <div className="mt-6">
            <EmptyState
              title="Scan lokasi terlebih dahulu"
              description="Masukkan barcode lokasi untuk menampilkan daftar produk yang tersedia pada lokasi tersebut."
            />
          </div>
        ) : location ? (
          <div className="mt-6">
            {availableItems.length > 0 ? (
              <StockOutMultiForm
                barcodeValue={barcode}
                locationId={location.id}
                availableItems={availableItems}
                action={createStockOutAction}
              />
            ) : (
              <EmptyState
                title="Tidak ada stok tersedia"
                description="Tidak ada produk dengan qty > 0 pada lokasi ini, atau filter pencarian terlalu ketat."
              />
            )}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Lokasi tidak ditemukan atau nonaktif"
              description="Pastikan barcode lokasi benar dan status lokasi masih aktif."
            />
          </div>
        )}
      </section>

      {historyResult.note ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {historyResult.note}
        </div>
      ) : null}

      <DataTable
        columns={["Kode", "Tanggal", "Lokasi", "Produk", "Qty", "Status", "User"]}
        rows={historyResult.items.map((item) => [
          item.kodeTransaksi,
          item.tanggal,
          item.lokasi,
          item.productName,
          item.qty,
          item.status,
          item.requestedBy,
        ])}
      />
    </div>
  );
}
