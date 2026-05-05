"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const categorySchema = z.object({
  namaKategori: z.string().trim().min(1, "Nama kategori wajib diisi"),
  deskripsi: z.string().trim().optional(),
  statusAktif: z.boolean(),
});

function buildRedirectUrl(status: "success" | "error", message: string) {
  const params = new URLSearchParams({ statusType: status, message });
  return `/categories?${params.toString()}`;
}

export async function createCategoryAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk menambah kategori."));
  }

  const parsed = categorySchema.safeParse({
    namaKategori: formData.get("namaKategori"),
    deskripsi: formData.get("deskripsi"),
    statusAktif: formData.get("statusAktif") === "on",
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data kategori tidak valid."));
  }

  const payload = parsed.data;

  const { error } = await supabase.from("categories").insert({
    nama_kategori: payload.namaKategori,
    deskripsi: payload.deskripsi && payload.deskripsi.length > 0 ? payload.deskripsi : null,
    status_aktif: payload.statusAktif,
  });

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  revalidatePath("/categories");
  redirect(buildRedirectUrl("success", "Kategori baru berhasil ditambahkan."));
}

const updateCategorySchema = categorySchema.extend({
  id: z.string().uuid("ID kategori tidak valid"),
});

export async function updateCategoryAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk mengedit kategori."));
  }

  const parsed = updateCategorySchema.safeParse({
    id: formData.get("id"),
    namaKategori: formData.get("namaKategori"),
    deskripsi: formData.get("deskripsi"),
    statusAktif: formData.get("statusAktif") === "on",
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data kategori tidak valid."));
  }

  const payload = parsed.data;

  const { error } = await supabase
    .from("categories")
    .update({
      nama_kategori: payload.namaKategori,
      deskripsi: payload.deskripsi && payload.deskripsi.length > 0 ? payload.deskripsi : null,
      status_aktif: payload.statusAktif,
    })
    .eq("id", payload.id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  revalidatePath("/categories");
  redirect(buildRedirectUrl("success", "Kategori berhasil diperbarui."));
}

export async function deleteCategoryAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk menghapus kategori."));
  }

  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    redirect(buildRedirectUrl("error", "ID kategori tidak ditemukan."));
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  revalidatePath("/categories");
  redirect(buildRedirectUrl("success", "Kategori berhasil dihapus."));
}
