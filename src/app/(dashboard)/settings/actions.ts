"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildRedirectUrl(status: "success" | "error", message: string) {
  const params = new URLSearchParams({ statusType: status, message });
  return `/settings?${params.toString()}`;
}

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Nama lengkap wajib diisi"),
});

export async function updateProfileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login diperlukan."));
  }

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data tidak valid."));
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  revalidatePath("/settings");
  redirect(buildRedirectUrl("success", "Profil berhasil diperbarui."));
}

const updatePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password dan konfirmasi tidak cocok",
  path: ["confirmPassword"],
});

export async function updatePasswordAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login diperlukan."));
  }

  const parsed = updatePasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data tidak valid."));
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  redirect(buildRedirectUrl("success", "Password berhasil diperbarui."));
}
