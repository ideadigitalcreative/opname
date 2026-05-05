import { DataTable } from "@/components/ui/data-table";
import { DeleteButton } from "@/components/ui/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getUsersCollection } from "@/lib/services/master-data";
import { createUserAction, deactivateUserAction, inviteUserAction, updateUserRoleAction } from "./actions";
import type { AppRole } from "@/types/app";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  petugas_gudang: "Petugas Gudang",
  user: "User",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const flashStatus = getSearchValue(resolvedSearchParams.statusType);
  const flashMessage = getSearchValue(resolvedSearchParams.message);

  const usersResult = await getUsersCollection();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="User & Role"
        description="Undang user baru, kelola role, dan nonaktifkan akun yang tidak diperlukan."
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

      {usersResult.note ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:rounded-2xl">
          {usersResult.note}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Buat User Baru</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Buat akun user langsung dengan email dan password. User bisa langsung login tanpa konfirmasi email.
          </p>
        </div>

        <form action={createUserAction} className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="user@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Nama Lengkap</span>
            <input
              name="fullName"
              required
              placeholder="Nama user"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Role</span>
            <select
              name="role"
              defaultValue="user"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            >
              <option value="user">User</option>
              <option value="petugas_gudang">Petugas Gudang</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 sm:rounded-xl sm:h-10"
            >
              Buat User
            </button>
          </div>
        </form>
      </section>

      <section
        id="form-undang-user"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5"
      >
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Undang User Baru</h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Kirim undangan email melalui Supabase Auth. User akan menerima email untuk mengatur password.
          </p>
        </div>

        <form action={inviteUserAction} className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="user@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Nama Lengkap</span>
            <input
              name="fullName"
              required
              placeholder="Nama user"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Role</span>
            <select
              name="role"
              defaultValue="user"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
            >
              <option value="user">User</option>
              <option value="petugas_gudang">Petugas Gudang</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:rounded-xl sm:h-10"
            >
              Kirim Undangan
            </button>
          </div>
        </form>
      </section>

      {usersResult.items.length > 0 ? (
        <DataTable
          columns={[
            { label: "Nama" },
            { label: "Email" },
            { label: "Role" },
            { label: "Ubah Role" },
            { label: "Aksi" },
          ]}
          rows={usersResult.items.map((item) => [
            item.fullName,
            item.email,
            <StatusBadge
              key={`role-${item.id}`}
              label={roleLabels[item.role] ?? item.role}
              tone={item.role === "admin" ? "blue" : item.role === "petugas_gudang" ? "amber" : "slate"}
            />,
            <form key={`form-${item.id}`} action={updateUserRoleAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={item.id} />
              <select
                name="role"
                defaultValue={item.role}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-500 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
              >
                <option value="admin">Admin</option>
                <option value="petugas_gudang">Petugas Gudang</option>
                <option value="user">User</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Simpan
              </button>
            </form>,
            <DeleteButton
              key={`deactivate-${item.id}`}
              action={deactivateUserAction}
              itemId={item.id}
              itemLabel={`Nonaktifkan ${item.fullName}`}
              label="Nonaktifkan"
            />,
          ])}
        />
      ) : (
        <EmptyState
          title="Belum ada user"
          description="Data user akan muncul setelah akun terdaftar di Supabase Auth."
        />
      )}
    </div>
  );
}
