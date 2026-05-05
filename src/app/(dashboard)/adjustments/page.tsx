import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getAdjustmentsCollection } from "@/lib/services/master-data";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function AdjustmentsPage() {
  const result = await getAdjustmentsCollection();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Koreksi Stok"
        title="Riwayat Koreksi Stok"
        description="Daftar item yang memiliki selisih dari hasil stock opname. Koreksi diterapkan melalui sesi opname yang sudah disetujui."
      />

      {result.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {result.note}
        </div>
      ) : null}

      {result.items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-5">
              <p className="text-xs text-slate-500 sm:text-sm">Total Item Koreksi</p>
              <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{result.items.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-5">
              <p className="text-xs text-slate-500 sm:text-sm">Total Kelebihan</p>
              <p className="mt-1 text-xl font-bold text-amber-600 sm:text-2xl">
                +{result.items.filter((i) => i.perubahan > 0).reduce((sum, i) => sum + i.perubahan, 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-5">
              <p className="text-xs text-slate-500 sm:text-sm">Total Kekurangan</p>
              <p className="mt-1 text-xl font-bold text-red-600 sm:text-2xl">
                {result.items.filter((i) => i.perubahan < 0).reduce((sum, i) => sum + i.perubahan, 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-5">
              <p className="text-xs text-slate-500 sm:text-sm">Sesi Terkait</p>
              <p className="mt-1 text-xl font-bold text-indigo-600 sm:text-2xl">
                {new Set(result.items.map((i) => i.sessionId)).size}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <DataTable
              columns={[
                { label: "Kode Sesi" },
                { label: "Barang" },
                { label: "SKU" },
                { label: "Lokasi" },
                { label: "Stok Awal" },
                { label: "Stok Akhir" },
                { label: "Perubahan" },
                { label: "Alasan", hideOnMobile: true },
                { label: "Waktu", hideOnMobile: true },
              ]}
              rows={result.items.map((item) => [
                item.kodeSesi,
                item.namaProduk,
                item.sku,
                item.locationName,
                formatNumber(item.stokAwal),
                formatNumber(item.stokAkhir),
                item.perubahan > 0 ? `+${formatNumber(item.perubahan)}` : formatNumber(item.perubahan),
                item.alasan,
                item.appliedAt,
              ])}
            />
          </div>
        </>
      ) : (
        <EmptyState
          title="Belum ada data koreksi"
          description="Data koreksi akan muncul setelah sesi opname disetujui dan item memiliki selisih."
        />
      )}
    </div>
  );
}
