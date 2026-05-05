import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOpnameSessionDetail } from "@/lib/services/master-data";
import { updateOpnameItemAction } from "../actions";
import Link from "next/link";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function OpnameInputPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const flashStatus = getSearchValue(resolvedSearchParams.statusType);
  const flashMessage = getSearchValue(resolvedSearchParams.message);
  const sessionId = getSearchValue(resolvedSearchParams.session);

  if (!sessionId) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          eyebrow="Stock Opname"
          title="Input Stok Fisik"
          description="Pilih sesi opname dari halaman Sesi Opname untuk mulai menghitung stok fisik."
        />
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-900 sm:rounded-2xl">
          <p className="font-medium">Tidak ada sesi yang dipilih</p>
          <p className="mt-1 text-xs">Silakan pilih sesi opname dari halaman berikut:</p>
          <Link
            href="/opname/sessions"
            className="mt-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
          >
            Buka Daftar Sesi Opname
          </Link>
        </div>
      </div>
    );
  }

  const { session, items, note } = await getOpnameSessionDetail(sessionId);

  if (!session) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          eyebrow="Stock Opname"
          title="Input Stok Fisik"
          description="Sesi opname tidak ditemukan."
        />
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-800 sm:rounded-2xl">
          Sesi opname dengan ID tersebut tidak ditemukan.
          <Link href="/opname/sessions" className="ml-1 underline">Kembali ke daftar sesi</Link>
        </div>
      </div>
    );
  }

  const totalChecked = items.filter((item) => item.stokFisik !== null).length;
  const totalDiscrepancies = items.filter(
    (item) => item.selisih !== null && item.selisih !== 0,
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow={session.kodeSesi}
        title={session.namaSesi}
        description={`${session.lokasi} · ${items.length} item · `}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge label={session.status.replaceAll("_", " ")} tone={
              session.status === "aktif" ? "blue" :
              session.status === "menunggu_approval" ? "amber" :
              session.status === "disetujui" ? "green" :
              session.status === "ditolak" ? "red" : "slate"
            } />
            <Link
              href="/opname/sessions"
              className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              ← Kembali
            </Link>
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

      {note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {note}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total Item" value={String(items.length)} hint="" />
        <StatCard label="Sudah Dicek" value={String(totalChecked)} hint={`${Math.round((totalChecked / Math.max(items.length, 1)) * 100)}%`} />
        <StatCard label="Selisih Ditemukan" value={String(totalDiscrepancies)} hint="" />
        <StatCard label="Progress" value={`${Math.round((totalChecked / Math.max(items.length, 1)) * 100)}%`} hint="" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Item Perhitungan</h2>
          <p className="text-xs text-slate-500 sm:text-sm">
            {totalChecked}/{items.length} item sudah dihitung
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {items.map((item) => (
            <form
              key={item.id}
              action={updateOpnameItemAction}
              className={`rounded-xl border p-3 transition-shadow sm:rounded-2xl sm:p-4 ${
                item.stokFisik !== null
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <input type="hidden" name="itemId" value={item.id} />
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 sm:text-sm">{item.namaProduk}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">
                    {item.sku} · {item.kategori}
                  </p>
                </div>
                <StatusBadge
                  label={
                    item.statusHasil === "sesuai"
                      ? "Sesuai"
                      : item.statusHasil === "lebih"
                        ? "Lebih"
                        : item.statusHasil === "kurang"
                          ? "Kurang"
                          : "Belum"
                  }
                  tone={
                    item.statusHasil === "sesuai"
                      ? "green"
                      : item.statusHasil === "lebih"
                        ? "amber"
                        : item.statusHasil === "kurang"
                          ? "red"
                          : "slate"
                  }
                />
              </div>

              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-100 p-1.5">
                  <p className="text-slate-500">Sistem</p>
                  <p className="font-semibold text-slate-900">{formatNumber(item.stokSistem)}</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-1.5">
                  <p className="text-slate-500">Fisik</p>
                  <p className="font-semibold text-slate-900">
                    {item.stokFisik !== null ? formatNumber(item.stokFisik) : "-"}
                  </p>
                </div>
                <div className={`rounded-lg p-1.5 ${
                  item.selisih !== null && item.selisih !== 0 ? "bg-red-50" : "bg-slate-100"
                }`}>
                  <p className="text-slate-500">Selisih</p>
                  <p className={`font-semibold ${
                    item.selisih !== null && item.selisih !== 0 ? "text-red-600" : "text-slate-900"
                  }`}>
                    {item.selisih !== null ? formatNumber(item.selisih) : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <label className="flex-1 space-y-1">
                  <span className="text-[10px] font-medium text-slate-600">Input Stok Fisik</span>
                  <input
                    name="stokFisik"
                    type="number"
                    min="0"
                    required
                    defaultValue={item.stokFisik ?? ""}
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <label className="flex-1 space-y-1">
                  <span className="text-[10px] font-medium text-slate-600">Catatan</span>
                  <input
                    name="catatan"
                    defaultValue={item.catatan ?? ""}
                    placeholder="Opsional"
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-[34px] items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Simpan
                </button>
              </div>

              {item.petugas && (
                <p className="mt-2 text-[10px] text-slate-400">
                  Dihitung oleh: {item.petugas}
                  {item.dihitungAt ? ` · ${item.dihitungAt}` : ""}
                </p>
              )}
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
