import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOpnameSessionDetail } from "@/lib/services/master-data";
import { updateSessionStatusAction, applyOpnameCorrectionAction } from "../actions";
import Link from "next/link";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export default async function OpnameReviewPage({
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
          title="Review & Approval"
          description="Pilih sesi opname dari halaman Sesi Opname untuk melakukan review."
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
          title="Review & Approval"
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
  const totalDiscrepancies = items.filter((item) => item.selisih !== null && item.selisih !== 0).length;
  const totalSelisihNilai = items.reduce((sum, item) => sum + Math.abs(item.nilaiSelisih ?? 0), 0);
  const isReviewable = session.status === "menunggu_approval";

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow={session.kodeSesi}
        title={`Review: ${session.namaSesi}`}
        description={`${session.lokasi} · ${items.length} item · ${session.dibuatOleh}`}
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
        <StatCard label="Item Selisih" value={String(totalDiscrepancies)} hint="" />
        <StatCard label="Total Selisih Nilai" value={formatCurrency(totalSelisihNilai)} hint="" />
      </div>

      {isReviewable && (
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm sm:rounded-2xl sm:p-5">
          <h2 className="mb-1 text-base font-semibold text-indigo-900 sm:text-lg">Aksi Approval</h2>
          <p className="mb-4 text-xs text-indigo-700 sm:text-sm">
            Review item di bawah lalu approve atau reject sesi ini.
          </p>
          <div className="flex flex-wrap gap-3">
            <form action={updateSessionStatusAction.bind(null, session.id, "disetujui")}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                ✓ Approve Sesi
              </button>
            </form>
            <form action={updateSessionStatusAction.bind(null, session.id, "ditolak")}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                ✕ Reject Sesi
              </button>
            </form>
            <form action={updateSessionStatusAction.bind(null, session.id, "aktif")}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ← Kembali ke Aktif
              </button>
            </form>
          </div>
        </section>
      )}

      {session.status === "disetujui" && (
        <section className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm sm:rounded-2xl sm:p-5">
          <h2 className="mb-1 text-base font-semibold text-orange-900 sm:text-lg">Terapkan Koreksi Stok</h2>
          <p className="mb-4 text-xs text-orange-700 sm:text-sm">
            Sesi ini sudah disetujui. Terapkan koreksi stok untuk menyesuaikan stok sistem dengan hasil perhitungan fisik.
          </p>
          <form action={applyOpnameCorrectionAction.bind(null, session.id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
            >
              Terapkan Koreksi Stok
            </button>
          </form>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Daftar Item</h2>
          <p className="text-xs text-slate-500 sm:text-sm">
            {totalDiscrepancies} item dengan selisih dari {items.length} total
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-3 pb-3">Produk</th>
                <th className="px-3 pb-3">SKU</th>
                <th className="px-3 pb-3">Sistem</th>
                <th className="px-3 pb-3">Fisik</th>
                <th className="px-3 pb-3">Selisih</th>
                <th className="px-3 pb-3">Nilai Selisih</th>
                <th className="px-3 pb-3">Status</th>
                <th className="px-3 pb-3">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isDifferent = item.selisih !== null && item.selisih !== 0;
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 last:border-b-0 ${
                      isDifferent ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <p className="font-medium text-slate-900">{item.namaProduk}</p>
                      <p className="text-[10px] text-slate-500">{item.kategori} · {item.satuan}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{item.sku}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">{formatNumber(item.stokSistem)}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {item.stokFisik !== null ? formatNumber(item.stokFisik) : "-"}
                    </td>
                    <td className={`px-3 py-3 font-semibold ${
                      isDifferent ? "text-red-600" : "text-slate-500"
                    }`}>
                      {item.selisih !== null ? formatNumber(item.selisih) : "-"}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {item.nilaiSelisih !== null ? formatCurrency(Math.abs(item.nilaiSelisih)) : "-"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge
                        label={
                          item.statusHasil === "sesuai" ? "Sesuai" :
                          item.statusHasil === "lebih" ? "Lebih" :
                          item.statusHasil === "kurang" ? "Kurang" : "Belum"
                        }
                        tone={
                          item.statusHasil === "sesuai" ? "green" :
                          item.statusHasil === "lebih" ? "amber" :
                          item.statusHasil === "kurang" ? "red" : "slate"
                        }
                      />
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">{item.catatan ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
