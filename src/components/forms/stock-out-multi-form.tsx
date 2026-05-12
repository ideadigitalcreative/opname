"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface AvailableItem {
  productId: string;
  sku: string;
  namaProduk: string;
  satuan: string;
  qtyTersedia: number;
}

interface StockOutMultiFormProps {
  barcodeValue: string;
  locationId: string;
  availableItems: AvailableItem[];
  action: (formData: FormData) => void;
}

interface SelectedItem {
  productId: string;
  qty: number;
  catatan: string;
}

export function StockOutMultiForm({
  barcodeValue,
  locationId,
  availableItems,
  action,
}: StockOutMultiFormProps) {
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [keperluan, setKeperluan] = useState("");
  const [catatanGlobal, setCatatanGlobal] = useState("");

  function addItem(productId: string) {
    setSelected((prev) => {
      if (prev.find((s) => s.productId === productId)) return prev;
      return [...prev, { productId, qty: 1, catatan: "" }];
    });
  }

  function removeItem(productId: string) {
    setSelected((prev) => prev.filter((s) => s.productId !== productId));
  }

  function updateQty(productId: string, qty: number) {
    setSelected((prev) =>
      prev.map((s) =>
        s.productId === productId ? { ...s, qty: Math.max(1, qty) } : s,
      ),
    );
  }

  const unselected = availableItems.filter(
    (item) => !selected.find((s) => s.productId === item.productId),
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="barcodeValue" value={barcodeValue} />
      <input type="hidden" name="locationId" value={locationId} />
      <input
        type="hidden"
        name="itemsJson"
        value={JSON.stringify(
          selected.map((s) => ({
            productId: s.productId,
            qty: s.qty,
            catatan: s.catatan,
          })),
        )}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Keperluan</span>
          <input
            required
            value={keperluan}
            onChange={(e) => setKeperluan(e.target.value)}
            placeholder="Contoh: instalasi / perbaikan / operasional"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Catatan Transaksi</span>
          <input
            value={catatanGlobal}
            onChange={(e) => setCatatanGlobal(e.target.value)}
            placeholder="Catatan umum (opsional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
          />
        </label>
      </div>

      <input type="hidden" name="keperluan" value={keperluan} />
      <input type="hidden" name="catatan" value={catatanGlobal} />

      {selected.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">
            Item yang dipilih ({selected.length})
          </h3>
          {selected.map((sel) => {
            const item = availableItems.find((a) => a.productId === sel.productId);
            if (!item) return null;
            return (
              <div
                key={sel.productId}
                className="flex flex-col gap-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.namaProduk}</p>
                  <p className="text-xs text-slate-500">
                    {item.sku} | Tersedia: {item.qtyTersedia} {item.satuan}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQty(sel.productId, sel.qty - 1)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={item.qtyTersedia}
                    value={sel.qty}
                    onChange={(e) => updateQty(sel.productId, Number(e.target.value))}
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => updateQty(sel.productId, sel.qty + 1)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(sel.productId)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unselected.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-600">Produk tersedia</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unselected.map((item) => (
              <button
                key={item.productId}
                type="button"
                onClick={() => addItem(item.productId)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{item.namaProduk}</p>
                  <p className="text-xs text-slate-400">
                    {item.sku} | {item.qtyTersedia} {item.satuan}
                  </p>
                </div>
                <Plus className="h-4 w-4 shrink-0 text-indigo-500" />
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
        <input
          name="autoApply"
          type="checkbox"
          defaultChecked
          className="h-4 w-4 rounded border-slate-300"
        />
        Langsung apply stok (Mode 1)
      </label>

      <Button
        type="submit"
        disabled={selected.length === 0 || !keperluan}
        className="w-full sm:w-auto"
      >
        Ambil barang ({selected.length} item)
      </Button>
    </form>
  );
}
