import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUserProfile } from "@/lib/supabase/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { updateProfileAction, updatePasswordAction } from "./actions";
import { Database, CheckCircle2, XCircle } from "lucide-react";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const flashStatus = getSearchValue(resolvedSearchParams.statusType);
  const flashMessage = getSearchValue(resolvedSearchParams.message);

  const profile = await getCurrentUserProfile();
  const isSupabaseConnected = hasSupabaseEnv();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Pengaturan"
        title="Pengaturan"
        description="Kelola profil dan keamanan akun Anda."
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

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Profil</h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Perbarui nama tampilan Anda.</p>

        <form action={updateProfileAction} className="mt-4 grid gap-3 sm:gap-4 sm:max-w-md">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Nama Lengkap</span>
            <input
              name="fullName"
              required
              defaultValue={profile.fullName}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Role</span>
            <input
              value={profile.role}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto sm:px-5"
          >
            Simpan profil
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Keamanan</h2>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Ganti password akun Anda.</p>

        <form action={updatePasswordAction} className="mt-4 grid gap-3 sm:gap-4 sm:max-w-md">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Password Baru</span>
            <input
              name="newPassword"
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Konfirmasi Password</span>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              placeholder="Ulangi password baru"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto sm:px-5"
          >
            Ganti password
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <Database className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Integrasi Supabase</h2>
            <p className="text-xs text-slate-500 sm:text-sm">Status koneksi database aplikasi.</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Status Koneksi</p>
              <p className="text-xs text-slate-500">
                {isSupabaseConnected
                  ? "Terhubung ke database Supabase"
                  : "Menggunakan data mock (Supabase belum dikonfigurasi)"}
              </p>
            </div>
            {isSupabaseConnected ? (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Terhubung</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1">
                <XCircle className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Mock Mode</span>
              </div>
            )}
          </div>

          {isSupabaseConnected && (
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600">Tabel Database Aktif</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["profiles", "products", "categories", "units", "locations", "product_stocks", "stock_in_transactions", "stock_out_transactions", "stock_movements", "opname_sessions", "opname_items", "audit_logs", "app_settings"].map((table) => (
                  <span key={table} className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                    {table}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isSupabaseConnected && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">Cara menghubungkan Supabase</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-blue-800">
                <li>Buat project di <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                <li>Jalankan script <code className="rounded bg-blue-100 px-1">supabase/setup-database.sql</code> di SQL Editor</li>
                <li>Copy URL dan Anon Key dari Settings → API</li>
                <li>Isi <code className="rounded bg-blue-100 px-1">.env.local</code> dengan <code className="rounded bg-blue-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> dan <code className="rounded bg-blue-100 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code></li>
                <li>Restart development server</li>
              </ol>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
