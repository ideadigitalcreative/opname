"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const unitSchema = z.object({
  namaSatuan: z.string().trim().min(1, "Nama satuan wajib diisi"),
  simbol: z.string().trim().min(1, "Simbol wajib diisi"),
  deskripsi: z.string().trim().optional(),
  statusAktif: z.boolean(),
});

function buildRedirectUrl(status: "success" | "error", message: string) {
  const params = new URLSearchParams({ statusType: status, message });
  return `/units?${params.toString()}`;
}

export async function createUnitAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk menambah satuan."));
  }

  const parsed = unitSchema.safeParse({
    namaSatuan: formData.get("namaSatuan"),
    simbol: formData.get("simbol"),
    deskripsi: formData.get("deskripsi"),
    statusAktif: formData.get("statusAktif") === "on",
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data satuan tidak valid."));
  }

  const payload = parsed.data;

  const { error } = await supabase.from("units").insert({
    nama_satuan: payload.namaSatuan,
    simbol: payload.simbol,
    deskripsi: payload.deskripsi && payload.deskripsi.length > 0 ? payload.deskripsi : null,
    status_aktif: payload.statusAktif,
  });

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  revalidatePath("/units");
  redirect(buildRedirectUrl("success", "Satuan baru berhasil ditambahkan."));
}

const updateUnitSchema = unitSchema.extend({
  id: z.string().uuid("ID satuan tidak valid"),
});

export async function updateUnitAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk mengedit satuan."));
  }

  const parsed = updateUnitSchema.safeParse({
    id: formData.get("id"),
    namaSatuan: formData.get("namaSatuan"),
    simbol: formData.get("simbol"),
    deskripsi: formData.get("deskripsi"),
    statusAktif: formData.get("statusAktif") === "on",
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data satuan tidak valid."));
  }

  const payload = parsed.data;

  const { error } = await supabase
    .from("units")
    .update({
      nama_satuan: payload.namaSatuan,
      simbol: payload.simbol,
      deskripsi: payload.deskripsi && payload.deskripsi.length > 0 ? payload.deskripsi : null,
      status_aktif: payload.statusAktif,
    })
    .eq("id", payload.id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  revalidatePath("/units");
  redirect(buildRedirectUrl("success", "Satuan berhasil diperbarui."));
}

export async function deleteUnitAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk menghapus satuan."));
  }

  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    redirect(buildRedirectUrl("error", "ID satuan tidak ditemukan."));
  }

  const { error } = await supabase.from("units").delete().eq("id", id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  revalidatePath("/units");
  redirect(buildRedirectUrl("success", "Satuan berhasil dihapus."));
}
