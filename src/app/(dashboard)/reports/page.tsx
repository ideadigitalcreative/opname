import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ExportButtons } from "@/components/reports/export-buttons";
import { getDashboardOverview } from "@/lib/services/master-data";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const startDate = getSearchValue(resolvedSearchParams.startDate);
  const endDate = getSearchValue(resolvedSearchParams.endDate);
  const month = getSearchValue(resolvedSearchParams.month);
  const overview = await getDashboardOverview();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Laporan"
        title="Laporan Gudang"
        description="Ringkasan data stok, transaksi, dan opname dari database Supabase."
      />

      {overview.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {overview.note}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total Produk" value={String(overview.totalProduk)} hint="Produk aktif" />
        <StatCard label="Lokasi Aktif" value={String(overview.totalLokasi)} hint="Gudang & rak" />
        <StatCard label="Stok Masuk" value={String(overview.stokMasukCount)} hint="Transaksi masuk" />
        <StatCard label="Pengambilan" value={String(overview.pengambilanCount)} hint="Transaksi keluar" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-900 sm:text-lg">Export Data</h2>
        <form method="get" className="mb-4 grid gap-3 sm:grid-cols-4">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Tanggal Mulai
            <input
              type="date"
              name="startDate"
              defaultValue={startDate}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Tanggal Selesai
            <input
              type="date"
              name="endDate"
              defaultValue={endDate}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Bulan
            <input
              type="month"
              name="month"
              defaultValue={month}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Terapkan
            </button>
          </div>
        </form>
        <ExportButtons
          csvTypes={[
            { label: "Produk", type: "products" },
            { label: "Stok", type: "stocks" },
            { label: "Mutasi", type: "movements" },
            { label: "Barang Keluar", type: "stock-out" },
            { label: "Opname", type: "opname" },
          ]}
          pdfTypes={[
            { label: "Produk", type: "products" },
            { label: "Stok", type: "stocks" },
            { label: "Barang Keluar", type: "stock-out" },
            { label: "Lengkap", type: "full-report" },
          ]}
        />
      </section>

      <DataTable
        columns={[
          { label: "Jenis Laporan" },
          { label: "Deskripsi" },
          { label: "Status" },
        ]}
        rows={[
          ["Laporan Stok Saat Ini", "Posisi stok aktif seluruh produk berdasarkan lokasi.", "Tersedia"],
          ["Laporan Mutasi Stok", "Riwayat pergerakan stok masuk, keluar, koreksi, dan opname.", "Tersedia"],
          ["Laporan Barang Keluar", "Riwayat barang keluar lengkap dengan siapa yang mengambil barang.", "Tersedia"],
          ["Laporan Stock Opname", "Hasil hitung fisik, selisih, dan approval sesi opname.", "Dalam pengembangan"],
        ]}
      />

      {overview.recentActivities.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Aktivitas Terakhir</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {overview.recentActivities.length} transaksi terakhir yang tercatat.
          </p>

          <div className="mt-4 space-y-3">
            {overview.recentActivities.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {item.type === "stok_masuk" ? "IN" : "OUT"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.description}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(item.time).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
