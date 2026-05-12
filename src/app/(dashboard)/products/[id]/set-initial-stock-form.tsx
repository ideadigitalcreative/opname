"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LocationOption {
  id: string;
  label: string;
}

interface ProductStock {
  locationId: string;
  qty: number;
}

interface SetInitialStockFormProps {
  productId: string;
  locations: LocationOption[];
  currentStocks: ProductStock[];
  action: (formData: FormData) => void;
}

export function SetInitialStockForm({
  productId,
  locations,
  currentStocks,
  action,
}: SetInitialStockFormProps) {
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id ?? "");

  const currentStock = currentStocks.find((s) => s.locationId === selectedLocationId)?.qty ?? 0;

  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
      <input type="hidden" name="productId" value={productId} />

      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700">Lokasi</span>
        <select
          name="locationId"
          required
          value={selectedLocationId}
          onChange={(e) => setSelectedLocationId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
        >
          {locations.length === 0 ? (
            <option value="">Belum ada lokasi aktif</option>
          ) : (
            <>
              <option value="" disabled>Pilih lokasi</option>
              {locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </>
          )}
        </select>
      </label>

      <label className="space-y-2 text-sm">
        <span className="font-medium text-slate-700">Qty</span>
        <input
          name="qty"
          type="number"
          min="0"
          step="1"
          key={`qty-${selectedLocationId}-${currentStock}`}
          defaultValue={currentStock}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
        />
      </label>

      <label className="space-y-2 text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Catatan (opsional)</span>
        <input
          name="catatan"
          placeholder="Contoh: koreksi stok manual"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
        />
      </label>

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={locations.length === 0}>
          Simpan stok awal
        </Button>
      </div>
    </form>
  );
}
