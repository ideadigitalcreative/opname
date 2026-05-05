import { DeleteButton } from "@/components/ui/delete-button";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { getProductFormOptions, getProductsCollection } from "@/lib/services/master-data";
import { createProductAction, updateProductAction, deleteProductAction } from "./actions";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function ProductsPage({
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

  const [productsResult, formOptions] = await Promise.all([
    getProductsCollection(),
    getProductFormOptions(),
  ]);

  const filteredProducts = productsResult.items.filter((item) => {
    const matchesQuery =
      !query ||
      item.namaProduk.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.barcodeProduk.toLowerCase().includes(query);

    const matchesStatus =
      !status ||
      (status === "aktif" && item.statusAktif) ||
      (status === "nonaktif" && !item.statusAktif);

    return matchesQuery && matchesStatus;
  });

  const editingProduct = editId ? productsResult.items.find((p) => p.id === editId) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Master Data"
        title="Data Barang"
        description="Kelola master produk, pencarian SKU/barcode, filter status, dan lihat total stok produk yang dihitung dari stok per lokasi."
        actions={
          <>
            <Button variant="outline" className="hidden sm:inline-flex">Import CSV</Button>
            <a
              href="#form-barang"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:h-10 sm:px-4"
            >
              + Tambah barang
            </a>
          </>
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

      {productsResult.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {productsResult.note}
        </div>
      ) : null}

      <form method="get">
        <FilterBar>
          <div className="w-full lg:max-w-sm">
            <SearchInput
              name="q"
              defaultValue={getSearchValue(resolvedSearchParams.q)}
              placeholder="Cari nama, SKU, atau barcode..."
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
        id="form-barang"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5"
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            {editingProduct ? "Edit Barang" : "Tambah Barang"}
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {editingProduct
              ? "Perbarui data produk di bawah ini."
              : "Form ini siap menulis ke Supabase jika login Supabase aktif."}
          </p>
        </div>

        <form
          action={editingProduct ? updateProductAction : createProductAction}
          className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {editingProduct && (
            <input type="hidden" name="id" value={editingProduct.id} />
          )}

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">SKU</span>
            <input
              name="sku"
              required
              defaultValue={editingProduct?.sku ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Barcode Produk</span>
            <input
              name="barcodeProduk"
              defaultValue={editingProduct?.barcodeProduk ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Nama Produk</span>
            <input
              name="namaProduk"
              required
              defaultValue={editingProduct?.namaProduk ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Kategori</span>
            <select
              name="kategoriId"
              required
              defaultValue={editingProduct?.kategoriId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            >
              <option value="">Pilih kategori</option>
              {formOptions.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Satuan</span>
            <select
              name="satuanId"
              required
              defaultValue={editingProduct?.satuanId ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            >
              <option value="">Pilih satuan</option>
              {formOptions.units.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Minimum Stok</span>
            <input
              name="minimumStok"
              type="number"
              min="0"
              defaultValue={editingProduct?.minimumStok ?? 0}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 sm:rounded-xl sm:px-4 sm:py-3">
            <input
              name="statusAktif"
              type="checkbox"
              defaultChecked={editingProduct ? editingProduct.statusAktif : true}
              className="h-4 w-4 rounded border-slate-300"
            />
            Status aktif
          </label>

          <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-3">
            <Button type="submit" className="w-full sm:w-auto">
              {editingProduct ? "Simpan perubahan" : "Simpan barang"}
            </Button>
            {editingProduct && (
              <a
                href="/products"
                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
              >
                Batal
              </a>
            )}
          </div>
        </form>
      </section>

      {filteredProducts.length > 0 ? (
        <DataTable
          columns={[
            { label: "SKU" },
            { label: "Barcode", hideOnMobile: true },
            { label: "Nama Produk" },
            { label: "Kategori", hideOnMobile: true },
            { label: "Satuan", hideOnMobile: true },
            { label: "Stok" },
            { label: "Min Stok", hideOnMobile: true },
            { label: "Status" },
            { label: "Aksi" },
          ]}
          rows={filteredProducts.map((item) => [
            item.sku,
            item.barcodeProduk,
            item.namaProduk,
            item.kategori,
            item.satuan,
            item.totalStok,
            item.minimumStok,
            item.statusAktif ? "Aktif" : "Nonaktif",
            <span key={item.id} className="inline-flex gap-1">
              <a
                href={`/products/${item.id}`}
                className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Detail
              </a>
              <a
                href={`/products?edit=${item.id}#form-barang`}
                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Edit
              </a>
              <DeleteButton action={deleteProductAction} itemId={item.id} itemLabel={item.namaProduk} />
            </span>,
          ])}
        />
      ) : (
        <EmptyState
          title="Produk tidak ditemukan"
          description="Coba ubah kata kunci pencarian atau filter status, lalu muat ulang daftar barang."
        />
      )}
    </div>
  );
}
