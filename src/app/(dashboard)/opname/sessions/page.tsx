import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOpnameFormOptions, getOpnameSessionsCollection } from "@/lib/services/master-data";
import {
  createOpnameSessionAction,
  updateSessionStatusAction,
  applyOpnameCorrectionAction,
} from "../actions";
import Link from "next/link";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function getSessionTone(status: string) {
  switch (status) {
    case "aktif":
      return "blue" as const;
    case "menunggu_approval":
      return "amber" as const;
    case "disetujui":
    case "selesai":
      return "green" as const;
    case "ditolak":
      return "red" as const;
    default:
      return "slate" as const;
  }
}

export default async function OpnameSessionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const flashStatus = getSearchValue(resolvedSearchParams.statusType);
  const flashMessage = getSearchValue(resolvedSearchParams.message);

  const [result, formOptions] = await Promise.all([
    getOpnameSessionsCollection(),
    getOpnameFormOptions(),
  ]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Stock Opname"
        title="Daftar Sesi Opname"
        description="Buat sesi opname per lokasi, pantau proses hitung sampai approval dan koreksi."
        actions={
          <a
            href="#form-sesi"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:h-10 sm:px-4"
          >
            + Buat sesi baru
          </a>
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

      {result.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {result.note}
        </div>
      ) : null}

      <section
        id="form-sesi"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5"
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Buat Sesi Opname Baru</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Pilih lokasi dan isi nama sesi. Item opname akan otomatis di-generate dari stok per lokasi.
          </p>
        </div>

        <form action={createOpnameSessionAction} className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2 text-sm sm:col-span-2 xl:col-span-3">
            <span className="font-medium text-slate-700">Nama Sesi</span>
            <input
              name="namaSesi"
              required
              placeholder="Contoh: Opname Akhir Mei Gudang Utama"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Lokasi</span>
            <select
              name="locationId"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            >
              <option value="">Pilih lokasi</option>
              {formOptions.locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Tanggal Mulai</span>
            <input
              name="tanggalMulai"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Tanggal Selesai (opsional)</span>
            <input
              name="tanggalSelesai"
              type="date"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm sm:col-span-2 xl:col-span-3">
            <span className="font-medium text-slate-700">Catatan (opsional)</span>
            <input
              name="catatan"
              placeholder="Catatan tambahan..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <div className="sm:col-span-2 xl:col-span-3">
            <Button type="submit" className="w-full sm:w-auto">
              Simpan sesi baru
            </Button>
          </div>
        </form>
      </section>

      {result.items.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map((session) => (
            <article key={session.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                    {session.kodeSesi}
                  </p>
                  <h3 className="mt-1 truncate text-base font-semibold text-slate-900 sm:text-lg">{session.namaSesi}</h3>
                </div>
                <StatusBadge label={session.status.replaceAll("_", " ")} tone={getSessionTone(session.status)} />
              </div>
              <p className="mt-1.5 truncate text-xs text-slate-500 sm:mt-2 sm:text-sm">{session.lokasi}</p>
              <div className="mt-3 h-2.5 rounded-full bg-slate-100 sm:mt-4 sm:h-3">
                <div
                  className="h-2.5 rounded-full bg-indigo-600 sm:h-3"
                  style={{ width: `${session.progressPercent}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs sm:mt-4 sm:gap-3 sm:text-sm">
                <div className="rounded-xl bg-slate-50 p-2 sm:rounded-2xl sm:p-3">
                  <p className="text-slate-500">Item</p>
                  <p className="mt-0.5 font-semibold text-slate-900 sm:mt-1">{session.totalItem}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2 sm:rounded-2xl sm:p-3">
                  <p className="text-slate-500">Dicek</p>
                  <p className="mt-0.5 font-semibold text-slate-900 sm:mt-1">{session.sudahDicek}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2 sm:rounded-2xl sm:p-3">
                  <p className="text-slate-500">Selisih</p>
                  <p className="mt-0.5 font-semibold text-slate-900 sm:mt-1">{session.selisihItem}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(session.status === "draft") && (
                  <form action={updateSessionStatusAction.bind(null, session.id, "aktif")}>
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      Mulai
                    </button>
                  </form>
                )}
                {(session.status === "draft" || session.status === "aktif") && (
                  <Link
                    href={`/opname/input?session=${session.id}`}
                    className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Input Stok
                  </Link>
                )}
                {session.status === "aktif" && (
                  <form action={updateSessionStatusAction.bind(null, session.id, "menunggu_approval")}>
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      Submit Review
                    </button>
                  </form>
                )}
                {(session.status === "menunggu_approval" || session.status === "disetujui" || session.status === "ditolak") && (
                  <Link
                    href={`/opname/review?session=${session.id}`}
                    className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
                  >
                    Review
                  </Link>
                )}
                {session.status === "menunggu_approval" && (
                  <>
                    <form action={updateSessionStatusAction.bind(null, session.id, "disetujui")}>
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={updateSessionStatusAction.bind(null, session.id, "ditolak")}>
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Reject
                      </button>
                    </form>
                  </>
                )}
                {session.status === "disetujui" && (
                  <form action={applyOpnameCorrectionAction.bind(null, session.id)}>
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100"
                    >
                      Terapkan Koreksi
                    </button>
                  </form>
                )}
                {(session.status === "draft" || session.status === "ditolak") && (
                  <form action={updateSessionStatusAction.bind(null, session.id, "dibatalkan")}>
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                    >
                      Batalkan
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada sesi opname"
          description="Buat sesi opname baru untuk memulai proses stock opname."
        />
      )}
    </div>
  );
}
