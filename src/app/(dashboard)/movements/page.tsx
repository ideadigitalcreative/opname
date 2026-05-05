import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { getMovementsCollection } from "@/lib/services/master-data";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function MovementsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = getSearchValue(resolvedSearchParams.q).toLowerCase();
  const tipeFilter = getSearchValue(resolvedSearchParams.tipe);

  const result = await getMovementsCollection();

  const filtered = result.items.filter((item) => {
    if (!query && !tipeFilter) return true;
    const matchesQuery = !query || (
      item.productName.toLowerCase().includes(query) ||
      item.locationName.toLowerCase().includes(query) ||
      item.sourceType.toLowerCase().includes(query)
    );
    const matchesTipe = !tipeFilter || item.movementType === tipeFilter;
    return matchesQuery && matchesTipe;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Transaksi"
        title="Mutasi Stok"
        description="Semua perubahan stok wajib tercatat di sini: stok masuk, pengambilan, koreksi, dan hasil opname."
        actions={
          <a
            href="/api/export/csv?type=movements"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:h-10 sm:px-4"
          >
            Export CSV
          </a>
        }
      />

      {result.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {result.note}
        </div>
      ) : null}

      <form method="get">
        <FilterBar>
          <div className="w-full lg:max-w-sm">
            <SearchInput
              name="q"
              defaultValue={getSearchValue(resolvedSearchParams.q)}
              placeholder="Cari produk atau sumber mutasi..."
            />
          </div>
          <select
            name="tipe"
            defaultValue={tipeFilter}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 lg:w-44"
          >
            <option value="">Semua Tipe</option>
            <option value="stok_masuk">Stok Masuk</option>
            <option value="pengambilan">Pengambilan</option>
            <option value="koreksi">Koreksi</option>
            <option value="opname">Opname</option>
          </select>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Filter
          </button>
        </FilterBar>
      </form>

      {filtered.length > 0 ? (
        <DataTable
          columns={[
            { label: "Waktu" },
            { label: "Produk" },
            { label: "Lokasi" },
            { label: "Tipe" },
            { label: "Sumber", hideOnMobile: true },
            { label: "Perubahan" },
            { label: "Qty Sesudah", hideOnMobile: true },
          ]}
          rows={filtered.map((item) => [
            new Date(item.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }),
            item.productName,
            item.locationName,
            item.movementType,
            item.sourceType,
            item.qtyChange > 0 ? `+${item.qtyChange}` : String(item.qtyChange),
            item.qtyAfter,
          ])}
        />
      ) : (
        <EmptyState
          title="Belum ada mutasi stok"
          description="Riwayat mutasi akan muncul setelah ada transaksi stok masuk atau keluar."
        />
      )}
    </div>
  );
}
