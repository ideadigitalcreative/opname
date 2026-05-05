"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface SelectOption {
  id: string;
  label: string;
}

interface StockInMultiFormProps {
  products: SelectOption[];
  locations: SelectOption[];
  action: (formData: FormData) => void;
}

interface ItemRow {
  key: string;
  productId: string;
  locationId: string;
  qty: string;
  hargaBeli: string;
  catatan: string;
}

let rowCounter = 0;
function createRow(): ItemRow {
  rowCounter += 1;
  return {
    key: `row-${rowCounter}-${Date.now()}`,
    productId: "",
    locationId: "",
    qty: "1",
    hargaBeli: "0",
    catatan: "",
  };
}

export function StockInMultiForm({ products, locations, action }: StockInMultiFormProps) {
  const [rows, setRows] = useState<ItemRow[]>(() => [createRow()]);

  function addRow() {
    setRows((prev) => [...prev, createRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function updateRow(key: string, field: keyof ItemRow, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Tipe Masuk</span>
          <select
            name="tipeMasuk"
            required
            defaultValue="pembelian"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          >
            <option value="pembelian">Pembelian</option>
            <option value="drop_barang">Drop Barang</option>
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Tanggal</span>
          <input
            name="tanggal"
            type="date"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Supplier</span>
          <input
            name="supplier"
            placeholder="Untuk pembelian"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Sumber Drop</span>
          <input
            name="sumberDrop"
            placeholder="Untuk drop barang"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          />
        </label>

        <label className="space-y-2 text-sm sm:col-span-2 xl:col-span-1">
          <span className="font-medium text-slate-700">Catatan Transaksi</span>
          <textarea
            name="catatan"
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          />
        </label>
      </div>

      <input type="hidden" name="itemsJson" value={JSON.stringify(rows.map((r) => ({ productId: r.productId, locationId: r.locationId, qty: r.qty, hargaBeli: r.hargaBeli, catatan: r.catatan })))} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Daftar Item ({rows.length})
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Item
          </Button>
        </div>

        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Item {index + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" /> Hapus
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium text-slate-600">Produk</span>
                  <select
                    required
                    value={row.productId}
                    onChange={(e) => updateRow(row.key, "productId", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Pilih produk</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium text-slate-600">Lokasi</span>
                  <select
                    required
                    value={row.locationId}
                    onChange={(e) => updateRow(row.key, "locationId", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Pilih lokasi</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium text-slate-600">Qty</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={row.qty}
                    onChange={(e) => updateRow(row.key, "qty", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium text-slate-600">Harga Beli</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.hargaBeli}
                    onChange={(e) => updateRow(row.key, "hargaBeli", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium text-slate-600">Catatan</span>
                  <input
                    type="text"
                    value={row.catatan}
                    onChange={(e) => updateRow(row.key, "catatan", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
        <input
          name="autoApply"
          type="checkbox"
          defaultChecked
          className="h-4 w-4 rounded border-slate-300"
        />
        Langsung apply stok setelah transaksi tersimpan
      </label>

      <Button type="submit" className="w-full sm:w-auto">
        Simpan transaksi stok masuk ({rows.length} item)
      </Button>
    </form>
  );
}
