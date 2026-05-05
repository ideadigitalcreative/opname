import { Button } from "@/components/ui/button";
import { loginAction } from "./actions";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusType = getSearchValue(resolvedSearchParams.statusType);
  const message = getSearchValue(resolvedSearchParams.message);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Login</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Masuk ke aplikasi
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              Gunakan akun Supabase Auth jika sudah tersedia. Jika belum, mode demo lokal tetap
              bisa dipakai untuk mencoba UI.
            </p>
          </div>

          {message ? (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                statusType === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {message}
            </div>
          ) : null}

          <form action={loginAction} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-700">User</span>
              <input
                name="username"
                type="text"
                autoComplete="username"
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-slate-700">Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </label>

            <Button type="submit" className="w-full">
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
