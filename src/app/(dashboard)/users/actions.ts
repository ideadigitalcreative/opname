"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/utils/audit-log";

function buildRedirectUrl(status: "success" | "error", message: string) {
  const params = new URLSearchParams({ statusType: status, message });
  return `/users?${params.toString()}`;
}

const updateRoleSchema = z.object({
  id: z.string().uuid("ID user tidak valid"),
  role: z.enum(["admin", "petugas_gudang", "user"]),
});

export async function updateUserRoleAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk mengubah role user."));
  }

  const parsed = updateRoleSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data tidak valid."));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  await writeAuditLog({
    userId: user.id,
    action: "user_role_updated",
    entityType: "profiles",
    entityId: parsed.data.id,
    newData: { role: parsed.data.role },
  });

  revalidatePath("/users");
  redirect(buildRedirectUrl("success", "Role user berhasil diperbarui."));
}

const inviteUserSchema = z.object({
  email: z.string().email("Email tidak valid"),
  fullName: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  role: z.enum(["admin", "petugas_gudang", "user"]),
});

export async function inviteUserAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk mengundang user."));
  }

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    redirect(buildRedirectUrl("error", "Service role key belum dikonfigurasi. Tambahkan SUPABASE_SERVICE_ROLE_KEY di .env.local"));
  }

  const parsed = inviteUserSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data tidak valid."));
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    { data: { full_name: parsed.data.fullName, role: parsed.data.role } },
  );

  if (inviteError) {
    redirect(buildRedirectUrl("error", `Gagal mengundang user: ${inviteError.message}`));
  }

  if (inviteData.user) {
    await supabase
      .from("profiles")
      .upsert(
        { id: inviteData.user.id, full_name: parsed.data.fullName, role: parsed.data.role },
        { onConflict: "id" },
      );
  }

  await writeAuditLog({
    userId: user.id,
    action: "user_invited",
    entityType: "profiles",
    entityId: inviteData.user?.id ?? null,
    newData: { email: parsed.data.email, fullName: parsed.data.fullName, role: parsed.data.role },
  });

  revalidatePath("/users");
  redirect(buildRedirectUrl("success", `Undangan berhasil dikirim ke ${parsed.data.email}.`));
}

const createUserSchema = z.object({
  email: z.string().email("Email tidak valid"),
  fullName: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  role: z.enum(["admin", "petugas_gudang", "user"]),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export async function createUserAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk membuat user."));
  }

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    redirect(buildRedirectUrl("error", "Service role key belum dikonfigurasi. Tambahkan SUPABASE_SERVICE_ROLE_KEY di .env.local"));
  }

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data tidak valid."));
  }

  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName, role: parsed.data.role },
  });

  if (createError) {
    redirect(buildRedirectUrl("error", `Gagal membuat user: ${createError.message}`));
  }

  if (createData.user) {
    await supabase
      .from("profiles")
      .upsert(
        { id: createData.user.id, full_name: parsed.data.fullName, role: parsed.data.role, status_aktif: true },
        { onConflict: "id" },
      );
  }

  await writeAuditLog({
    userId: user.id,
    action: "user_created",
    entityType: "profiles",
    entityId: createData.user?.id ?? null,
    newData: { email: parsed.data.email, fullName: parsed.data.fullName, role: parsed.data.role },
  });

  revalidatePath("/users");
  redirect(buildRedirectUrl("success", `User ${parsed.data.email} berhasil dibuat.`));
}

const deactivateUserSchema = z.object({
  id: z.string().uuid("ID user tidak valid"),
});

export async function deactivateUserAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk menonaktifkan user."));
  }

  const parsed = deactivateUserSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data tidak valid."));
  }

  if (parsed.data.id === user.id) {
    redirect(buildRedirectUrl("error", "Anda tidak dapat menonaktifkan akun sendiri."));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status_aktif: false })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  await writeAuditLog({
    userId: user.id,
    action: "user_deactivated",
    entityType: "profiles",
    entityId: parsed.data.id,
  });

  revalidatePath("/users");
  redirect(buildRedirectUrl("success", "User berhasil dinonaktifkan."));
}
