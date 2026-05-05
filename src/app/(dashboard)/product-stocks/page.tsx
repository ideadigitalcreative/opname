import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getProductStocksCollection } from "@/lib/services/master-data";

export default async function ProductStocksPage() {
  const stocksResult = await getProductStocksCollection();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Stok"
        title="Stok Per Lokasi"
        description="Lihat distribusi stok setiap produk di masing-masing lokasi aktif beserta barcode lokasi untuk proses scan."
      />

      {stocksResult.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {stocksResult.note}
        </div>
      ) : null}

      {stocksResult.items.length > 0 ? (
        <DataTable
          columns={["Produk", "Lokasi", "Qty", "Barcode Lokasi"]}
          rows={stocksResult.items.map((item) => [
            item.productName,
            item.locationName,
            item.qty,
            item.barcodeLocation,
          ])}
        />
      ) : (
        <EmptyState
          title="Belum ada stok per lokasi"
          description="Data stok per lokasi akan muncul setelah transaksi stok masuk berhasil diaplikasikan."
        />
      )}
    </div>
  );
}
