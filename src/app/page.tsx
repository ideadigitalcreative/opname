import Link from "next/link";
import {
  Boxes,
  Clock,
  MapPin,
  PackageX,
  ShieldCheck,
  TriangleAlert,
  Warehouse,
} from "lucide-react";
import type { ReactNode } from "react";

import { SimpleBarChart } from "@/components/ui/simple-bar-chart";
import { AuthButton } from "@/components/landing/auth-button";
import { BarcodeScanPanel } from "@/components/forms/barcode-scan-panel";
import { UserHistory } from "@/components/landing/user-history";
import {
  getLandingOverview,
  getUserStockOutHistory,
} from "@/lib/services/master-data";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentRoleFromCookie } from "@/lib/supabase/auth";
import { formatNumber } from "@/lib/utils/format-number";

function StatCard({
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
  const bg: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-200",
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
    rose: "bg-rose-50 border-rose-200",
  };
  const iconBg: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 sm:gap-4 sm:p-4 ${bg[tone]}`}>
      <div className={`shrink-0 rounded-lg p-2 ${iconBg[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500 sm:text-sm">{label}</p>
        <p className="text-xl font-semibold text-slate-900 sm:text-2xl">{value}</p>
      </div>
    </div>
  );
}

function FlashBanner({ status, message }: { status: string; message: string }) {
  if (!message) return null;

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {message}
    </div>
  );
}

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const flashStatus = getSearchValue(resolvedSearchParams.statusType);
  const flashMessage = getSearchValue(resolvedSearchParams.message);

  const authUserId = await (async () => {
    if (!hasSupabaseEnv()) return null;
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  })();

  const role = await getCurrentRoleFromCookie();
  const overview = await getLandingOverview();
  const userHistory = authUserId ? await getUserStockOutHistory(authUserId) : null;
  const isStaff = role === "admin" || role === "petugas_gudang";

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Warehouse className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Stok Gudang</span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <AuthButton />
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        <FlashBanner status={flashStatus} message={flashMessage} />

        <div className="mb-4 mt-4 sm:mb-6 sm:mt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Ringkasan Stok
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Dashboard Manajemen Stok Gudang
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Data real-time dari Supabase.
          </p>
        </div>

        {overview.note ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {overview.note}
          </div>
        ) : null}

        {!!authUserId && <BarcodeScanPanel />}

        <section className={`grid grid-cols-2 gap-3 sm:gap-4 ${isStaff ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          <StatCard
            label="Total Produk"
            value={formatNumber(overview.totalProduk)}
            icon={<Boxes className="h-5 w-5" />}
            tone="indigo"
          />
          <StatCard
            label="Total Lokasi"
            value={formatNumber(overview.totalLokasi)}
            icon={<MapPin className="h-5 w-5" />}
            tone="emerald"
          />
          <StatCard
            label="Stok Rendah"
            value={formatNumber(overview.stokRendahCount)}
            icon={<TriangleAlert className="h-5 w-5" />}
            tone="amber"
          />
          {isStaff && (
            <StatCard
              label="Mutasi Terbaru"
              value={formatNumber(overview.recentMovements.length)}
              icon={<Clock className="h-5 w-5" />}
              tone="rose"
            />
          )}
        </section>

        {!!authUserId && userHistory && userHistory.items.length > 0 && (
          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-6 sm:rounded-2xl sm:p-5">
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
              Riwayat Pengambilan Anda
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              20 transaksi pengambilan terakhir.
            </p>
            <div className="mt-3">
              <UserHistory items={userHistory.items} />
            </div>
          </section>
        )}

        {overview.lowStockProducts.length > 0 ? (
          <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-amber-600" />
              <h2 className="text-base font-semibold text-amber-900 sm:text-lg">Peringatan Stok Rendah</h2>
              <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {overview.lowStockProducts.filter((p) => p.totalStok === 0).length} habis
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-700 sm:text-sm">
              Produk dengan stok di bawah minimum atau habis. Perlu segera dilakukan pembelian atau redistribusi.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {overview.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{product.namaProduk}</p>
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
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-emerald-900">Semua Stok Aman</h2>
            </div>
            <p className="mt-1 text-sm text-emerald-700">
              Tidak ada produk yang stoknya di bawah minimum.
            </p>
          </section>
        )}

        {isStaff && (
          <div className="mt-4 sm:mt-6">
            <SimpleBarChart
              title="Produk Dengan Stok Terbanyak"
              description="Top produk berdasarkan total qty di semua lokasi."
              tone="indigo"
              items={overview.topProductsByStock.map((item) => ({
                label: item.namaProduk,
                value: item.totalStok,
              }))}
            />
          </div>
        )}

        <footer className="mt-10 border-t border-slate-200 py-6 text-center sm:mt-12">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
              <Warehouse className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900">Stok Gudang</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Next.js + Supabase &middot; Sistem Manajemen Stok 
          </p>
        </footer>
      </div>
    </main>
  );
}
