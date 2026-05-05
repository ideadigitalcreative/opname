"use client";

import { CheckCircle, Clock, Package } from "lucide-react";

interface ProductDetail {
  productName: string;
  qty: number;
}

interface HistoryItem {
  id: string;
  kodeTransaksi: string;
  tanggal: string;
  lokasi: string;
  productName: string;
  qty: number;
  status: string;
  keperluan: string;
  productDetails: ProductDetail[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  submitted: { label: "Diproses", className: "bg-blue-100 text-blue-700" },
  approved: { label: "Disetujui", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Dibatalkan", className: "bg-slate-100 text-slate-600" },
  draft: { label: "Draft", className: "bg-amber-100 text-amber-700" },
};

export function UserHistory({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
        <Package className="mx-auto h-8 w-8 text-slate-300" />
        <h3 className="mt-3 text-sm font-semibold text-slate-900">Belum ada riwayat</h3>
        <p className="mt-1 text-xs text-slate-500">
          Riwayat pengambilan barang Anda akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const cfg = statusConfig[item.status] ?? statusConfig.submitted;
        const hasDetails = item.productDetails && item.productDetails.length > 0;
        return (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300"
          >
            <div className="mt-0.5 shrink-0">
              {item.status === "submitted" ? (
                <Clock className="h-4 w-4 text-blue-500" />
              ) : item.status === "approved" ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : (
                <Package className="h-4 w-4 text-slate-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-800">{item.productName}</p>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.className}`}
                >
                  {cfg.label}
                </span>
              </div>
              {hasDetails && item.productDetails.length > 1 && (
                <div className="mt-1.5 space-y-0.5">
                  {item.productDetails.map((detail, idx) => (
                    <p key={idx} className="text-xs text-slate-600">
                      {idx + 1}. {detail.productName} &times; {detail.qty}
                    </p>
                  ))}
                </div>
              )}
              <p className="mt-0.5 text-xs text-slate-500">
                {item.kodeTransaksi} &middot; {item.lokasi} &middot; Qty: {item.qty}
              </p>
              <p className="text-xs text-slate-400">
                {item.keperluan} &middot; {item.tanggal}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
