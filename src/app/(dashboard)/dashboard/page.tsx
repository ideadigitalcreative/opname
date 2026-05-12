import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Clock,
  FileText,
  LogIn,
  MapPin,
  PackageSearch,
  PackageX,
  ScanBarcode,
  ShieldCheck,
} from "lucide-react";
import { cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

import { getDashboardOverview } from "@/lib/services/master-data";
import { getCurrentRoleFromCookie } from "@/lib/supabase/auth";
import { formatNumber } from "@/lib/utils/format-number";

function ActivityIcon({ type }: { type: string }) {
  if (type === "IN") return <ArrowDownRight className="h-4 w-4 text-emerald-600" />;
  if (type === "OUT") return <ArrowUpRight className="h-4 w-4 text-rose-600" />;
  return <BarChart3 className="h-4 w-4 text-amber-600" />;
}

function StatHighlight({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "indigo" | "emerald" | "amber" | "rose";
}) {
  const iconColor: Record<string, string> = {
    indigo: "text-indigo-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };

  const displayIcon = isValidElement(icon)
    ? cloneElement(icon as ReactElement<{ className?: string; strokeWidth?: number }>, {
        className: `h-10 w-10 ${iconColor[tone]}`,
        strokeWidth: 1.5,
      })
    : icon;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-200 p-4 sm:rounded-2xl sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500 sm:text-sm">{label}</p>
          <p className="text-3xl font-semibold text-slate-900 sm:text-4xl">{value}</p>
        </div>
        <div className="shrink-0">{displayIcon}</div>
      </div>
    </div>
  );
}

const quickActions = [
  { label: "Stok Masuk", href: "/stock-in#form-stok-masuk", icon: LogIn, tone: "indigo" as const },
  { label: "Ambil Barang", href: "/stock-out", icon: ScanBarcode, tone: "emerald" as const },
  { label: "Opname", href: "/opname/sessions", icon: ClipboardIcon, tone: "amber" as const },
  { label: "Laporan", href: "/reports", icon: FileText, tone: "rose" as const },
];

function ClipboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

export default async function DashboardPage() {
  const [role, overview] = await Promise.all([
    getCurrentRoleFromCookie(),
    getDashboardOverview(),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Dashboard
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Ringkasan Manajemen Stok
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {role === "user"
              ? "Ringkasan pengambilan barang milik Anda."
              : "Pantau stok, transaksi, dan peringatan dari satu tempat."}
          </p>
        </div>
      </div>

      {overview.note && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {overview.note}
        </div>
      )}

      {role !== "user" && (
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:rounded-2xl sm:px-5 sm:py-3.5"
            >
              <action.icon
                className={`h-4 w-4 shrink-0 ${
                  action.tone === "indigo"
                    ? "text-indigo-600"
                    : action.tone === "emerald"
                      ? "text-emerald-600"
                      : action.tone === "amber"
                        ? "text-amber-600"
                        : "text-rose-600"
                }`}
              />
              <span className="truncate">{action.label}</span>
            </a>
          ))}
        </section>
      )}

      {role === "user" ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatHighlight
            label="Pengambilan"
            value={formatNumber(overview.pengambilanCount)}
            icon={<PackageSearch className="h-5 w-5" />}
            tone="indigo"
          />
          <StatHighlight
            label="Total Produk"
            value={formatNumber(overview.totalProduk)}
            icon={<Boxes className="h-5 w-5" />}
            tone="emerald"
          />
          <StatHighlight
            label="Lokasi Aktif"
            value={formatNumber(overview.totalLokasi)}
            icon={<MapPin className="h-5 w-5" />}
            tone="amber"
          />
          <StatHighlight
            label="Stok Rendah"
            value={formatNumber(overview.lowStockCount)}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="rose"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatHighlight
            label="Total Produk"
            value={formatNumber(overview.totalProduk)}
            icon={<Boxes className="h-5 w-5" />}
            tone="indigo"
          />
          <StatHighlight
            label="Total Stok"
            value={formatNumber(overview.totalStok)}
            icon={<BarChart3 className="h-5 w-5" />}
            tone="emerald"
          />
          <StatHighlight
            label="Total Lokasi"
            value={formatNumber(overview.totalLokasi)}
            icon={<MapPin className="h-5 w-5" />}
            tone="amber"
          />
          <StatHighlight
            label="Stok Masuk"
            value={formatNumber(overview.stokMasukCount)}
            icon={<LogIn className="h-5 w-5" />}
            tone="indigo"
          />
          <StatHighlight
            label="Pengambilan"
            value={formatNumber(overview.pengambilanCount)}
            icon={<PackageSearch className="h-5 w-5" />}
            tone="emerald"
          />
          <StatHighlight
            label="Stok Rendah"
            value={formatNumber(overview.lowStockCount)}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="rose"
          />
        </div>
      )}

      {role !== "user" && overview.lowStockProducts.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:rounded-2xl sm:p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-semibold text-amber-900 sm:text-lg">
              Peringatan Stok Rendah
            </h2>
            <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {overview.stokHabisCount} habis
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-700 sm:text-sm">
            Produk dengan stok di bawah minimum atau habis. Perlu segera dilakukan pembelian atau redistribusi.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {overview.lowStockProducts.map((product) => (
              <a
                key={product.id}
                href={`/products/${product.id}`}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 transition hover:border-amber-400"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{product.namaProduk}</p>
                  <p className="text-xs text-slate-500">{product.sku}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    product.totalStok === 0
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {product.totalStok === 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <PackageX className="h-3 w-3" /> Habis
                    </span>
                  ) : (
                    `${product.totalStok}/${product.minimumStok}`
                  )}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {role !== "user" && overview.lowStockProducts.length === 0 && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:rounded-2xl sm:p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-emerald-900">Semua Stok Aman</h2>
          </div>
          <p className="mt-1 text-sm text-emerald-700">
            Tidak ada produk yang stoknya di bawah minimum. Pertahankan!
          </p>
        </section>
      )}

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Aktivitas Terbaru</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Mutasi stok masuk, keluar, opname, dan koreksi.
          </p>
          <div className="mt-4 space-y-3 sm:mt-5">
            {overview.recentActivities.length > 0 ? (
              overview.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="mt-0.5 shrink-0">
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{activity.description}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
                <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Ringkasan</h2>
          <div className="mt-4 space-y-3">
            {overview.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
              >
                <span className="text-sm text-slate-600">{stat.label}</span>
                <span className="text-sm font-semibold text-slate-900">{stat.value}</span>
              </div>
            ))}
          </div>

          {overview.source === "supabase" && (
            <p className="mt-4 text-xs text-emerald-600">
              Terhubung ke Supabase
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
