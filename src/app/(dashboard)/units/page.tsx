import { DataTable } from "@/components/ui/data-table";
import { DeleteButton } from "@/components/ui/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getUnitsCollection } from "@/lib/services/master-data";
import { createUnitAction, updateUnitAction, deleteUnitAction } from "./actions";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function UnitsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const flashStatus = getSearchValue(resolvedSearchParams.statusType);
  const flashMessage = getSearchValue(resolvedSearchParams.message);
  const editId = getSearchValue(resolvedSearchParams.edit);

  const unitsResult = await getUnitsCollection();

  const editingUnit = editId ? unitsResult.items.find((u) => u.id === editId) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title="Satuan"
        description="Kelola satuan barang seperti pcs, box, kg, dan liter agar pencatatan stok konsisten."
        actions={
          <a
            href="#form-satuan"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:h-10 sm:px-4"
          >
            + Tambah satuan
          </a>
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

      {unitsResult.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {unitsResult.note}
        </div>
      ) : null}

      <section
        id="form-satuan"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5"
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            {editingUnit ? "Edit Satuan" : "Tambah Satuan"}
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {editingUnit
              ? "Perbarui data satuan di bawah ini."
              : "Form ini siap menulis ke Supabase jika login Supabase aktif."}
          </p>
        </div>

        <form
          key={editingUnit?.id ?? "new-unit"}
          action={editingUnit ? updateUnitAction : createUnitAction}
          className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {editingUnit && (
            <input type="hidden" name="id" value={editingUnit.id} />
          )}

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Nama Satuan</span>
            <input
              name="namaSatuan"
              required
              defaultValue={editingUnit?.namaSatuan ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Simbol</span>
            <input
              name="simbol"
              required
              defaultValue={editingUnit?.simbol ?? ""}
              placeholder="pcs / box / kg"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm sm:col-span-2 xl:col-span-1">
            <span className="font-medium text-slate-700">Deskripsi</span>
            <input
              name="deskripsi"
              defaultValue={editingUnit?.deskripsi !== "-" ? editingUnit?.deskripsi ?? "" : ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 sm:rounded-xl sm:px-4 sm:py-3">
            <input
              name="statusAktif"
              type="checkbox"
              defaultChecked={editingUnit ? editingUnit.statusAktif : true}
              className="h-4 w-4 rounded border-slate-300"
            />
            Status aktif
          </label>

          <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:h-10 sm:px-5"
            >
              {editingUnit ? "Simpan perubahan" : "Simpan satuan"}
            </button>
            {editingUnit && (
              <a
                href="/units"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </a>
            )}
          </div>
        </form>
      </section>

      {unitsResult.items.length > 0 ? (
        <DataTable
          columns={[
            { label: "Nama Satuan" },
            { label: "Simbol" },
            { label: "Deskripsi", hideOnMobile: true },
            { label: "Status" },
            { label: "Aksi" },
          ]}
          rows={unitsResult.items.map((item) => [
            item.namaSatuan,
            item.simbol,
            item.deskripsi,
            item.statusAktif ? "Aktif" : "Nonaktif",
            <span key={item.id} className="inline-flex gap-1">
              <a
                href={`/units?edit=${item.id}#form-satuan`}
                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Edit
              </a>
              <DeleteButton action={deleteUnitAction} itemId={item.id} itemLabel={item.namaSatuan} />
            </span>,
          ])}
        />
      ) : (
        <EmptyState
          title="Satuan tidak ditemukan"
          description="Belum ada satuan yang terdaftar. Tambahkan satuan baru di atas."
        />
      )}
    </div>
  );
}
