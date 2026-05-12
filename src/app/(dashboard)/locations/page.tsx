import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DeleteButton } from "@/components/ui/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { QRDownloadAllButton, QRCodeViewer } from "@/components/ui/qr-code-viewer";
import { SearchInput } from "@/components/ui/search-input";
import { getLocationsCollection } from "@/lib/services/master-data";
import { createLocationAction, updateLocationAction, deleteLocationAction } from "./actions";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function LocationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = getSearchValue(resolvedSearchParams.q).toLowerCase();
  const status = getSearchValue(resolvedSearchParams.status);
  const flashStatus = getSearchValue(resolvedSearchParams.statusType);
  const flashMessage = getSearchValue(resolvedSearchParams.message);
  const editId = getSearchValue(resolvedSearchParams.edit);

  const locationsResult = await getLocationsCollection();

  const editingLocation = editId ? locationsResult.items.find((l) => l.id === editId) : null;

  const filteredLocations = locationsResult.items.filter((item) => {
    const matchesQuery =
      !query ||
      item.namaLokasi.toLowerCase().includes(query) ||
      item.kodeLokasi.toLowerCase().includes(query) ||
      item.barcodeValue.toLowerCase().includes(query);

    const matchesStatus =
      !status ||
      (status === "aktif" && item.statusAktif) ||
      (status === "nonaktif" && !item.statusAktif);

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title="Lokasi"
        description="Kelola gudang, rak, lemari, etalase, dan box teknisi lengkap dengan barcode atau QR code unik untuk transaksi."
        actions={
          <div className="flex gap-2">
            {filteredLocations.length > 0 && (
              <QRDownloadAllButton locations={filteredLocations.map((l) => ({ namaLokasi: l.namaLokasi, barcodeValue: l.barcodeValue }))} />
            )}
            <a
              href="#form-lokasi"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:h-10 sm:px-4"
            >
              + Tambah lokasi
            </a>
          </div>
        }
      />

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

      {locationsResult.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {locationsResult.note}
        </div>
      ) : null}

      <form method="get">
        <FilterBar>
          <div className="w-full lg:max-w-sm">
            <SearchInput
              name="q"
              defaultValue={getSearchValue(resolvedSearchParams.q)}
              placeholder="Cari nama lokasi, kode, atau barcode..."
            />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          >
            <option value="">Semua status</option>
            <option value="aktif">Status aktif</option>
            <option value="nonaktif">Status nonaktif</option>
          </select>
          <Button type="submit" size="sm" className="w-full sm:w-auto">Filter</Button>
        </FilterBar>
      </form>

      <section
        id="form-lokasi"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5"
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            {editingLocation ? "Edit Lokasi" : "Tambah Lokasi"}
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {editingLocation
              ? "Perbarui data lokasi di bawah ini."
              : "Gunakan barcode atau QR code unik per lokasi agar alur scan pengambilan barang tetap konsisten."}
          </p>
        </div>

        <form
          key={editingLocation?.id ?? "new-location"}
          action={editingLocation ? updateLocationAction : createLocationAction}
          className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {editingLocation && (
            <input type="hidden" name="id" value={editingLocation.id} />
          )}

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Kode Lokasi</span>
            <input
              name="kodeLokasi"
              required
              defaultValue={editingLocation?.kodeLokasi ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Nama Lokasi</span>
            <input
              name="namaLokasi"
              required
              defaultValue={editingLocation?.namaLokasi ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Tipe Lokasi</span>
            <input
              name="tipeLokasi"
              required
              defaultValue={editingLocation?.tipeLokasi ?? ""}
              placeholder="Gudang / Rak / Lemari / Etalase"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Barcode Value</span>
            <input
              name="barcodeValue"
              required
              defaultValue={editingLocation?.barcodeValue ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm sm:col-span-2 xl:col-span-2">
            <span className="font-medium text-slate-700">Deskripsi</span>
            <textarea
              name="deskripsi"
              rows={3}
              defaultValue={editingLocation?.deskripsi !== "-" ? editingLocation?.deskripsi ?? "" : ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 sm:rounded-xl sm:px-4 sm:py-3">
            <input
              name="statusAktif"
              type="checkbox"
              defaultChecked={editingLocation ? editingLocation.statusAktif : true}
              className="h-4 w-4 rounded border-slate-300"
            />
            Status aktif
          </label>

          <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-3">
            <Button type="submit" className="w-full sm:w-auto">
              {editingLocation ? "Simpan perubahan" : "Simpan lokasi"}
            </Button>
            {editingLocation && (
              <a
                href="/locations"
                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                Batal
              </a>
            )}
          </div>
        </form>
      </section>

      {filteredLocations.length > 0 ? (
        <DataTable
          columns={[
            { label: "Kode" },
            { label: "Nama Lokasi" },
            { label: "Tipe", hideOnMobile: true },
            { label: "Barcode", hideOnMobile: true },
            { label: "Total Barang" },
            { label: "Status" },
            { label: "Aksi" },
          ]}
          rows={filteredLocations.map((item) => [
            item.kodeLokasi,
            item.namaLokasi,
            item.tipeLokasi,
            item.barcodeValue,
            item.totalBarang,
            item.statusAktif ? "Aktif" : "Nonaktif",
            <span key={item.id} className="inline-flex gap-1">
              <QRCodeViewer locationName={item.namaLokasi} barcodeValue={item.barcodeValue} />
              <a
                href={`/locations?edit=${item.id}#form-lokasi`}
                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Edit
              </a>
              <DeleteButton action={deleteLocationAction} itemId={item.id} itemLabel={item.namaLokasi} />
            </span>,
          ])}
        />
      ) : (
        <EmptyState
          title="Lokasi tidak ditemukan"
          description="Coba ubah kata kunci pencarian atau filter status, lalu muat ulang daftar lokasi."
        />
      )}
    </div>
  );
}
