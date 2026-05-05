import { Camera, Minus, Plus, ScanBarcode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { OpnameInputItem } from "@/types/app";

interface OpnameInputCardProps {
  item: OpnameInputItem;
}

function getStatusTone(status: OpnameInputItem["statusHasil"]) {
  switch (status) {
    case "sesuai":
      return "green";
    case "lebih":
      return "blue";
    case "kurang":
      return "red";
    case "barang_rusak":
    case "tidak_ditemukan":
      return "amber";
    default:
      return "slate";
  }
}

export function OpnameInputCard({ item }: OpnameInputCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.sku}</p>
          <h3 className="text-lg font-semibold text-slate-900">{item.namaProduk}</h3>
          <p className="text-sm text-slate-500">
            {item.kategori} • {item.lokasi}
          </p>
        </div>
        <StatusBadge label={item.statusHasil.replaceAll("_", " ")} tone={getStatusTone(item.statusHasil)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-slate-500">Stok sistem</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{item.stokSistem}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-slate-500">Stok fisik</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{item.stokFisik ?? "-"}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
        <Button variant="outline" size="sm">
          <Minus className="mr-1 h-4 w-4" />
          Kurangi
        </Button>
        <div className="text-center">
          <p className="text-xs text-slate-500">Input cepat</p>
          <p className="text-xl font-semibold text-slate-900">{item.stokFisik ?? 0}</p>
        </div>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Tambah
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" className="justify-start">
          <ScanBarcode className="mr-2 h-4 w-4" />
          Scan barcode
        </Button>
        <Button variant="outline" className="justify-start">
          <Camera className="mr-2 h-4 w-4" />
          Upload foto
        </Button>
      </div>

      <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">Nilai selisih estimasi</p>
        <p className="mt-1">{formatCurrency(item.nilaiSelisih)}</p>
      </div>
    </article>
  );
}
