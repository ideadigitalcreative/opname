"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const locationSchema = z.object({
  kodeLokasi: z.string().trim().min(1, "Kode lokasi wajib diisi"),
  namaLokasi: z.string().trim().min(1, "Nama lokasi wajib diisi"),
  tipeLokasi: z.string().trim().min(1, "Tipe lokasi wajib diisi"),
  barcodeValue: z.string().trim().min(1, "Barcode lokasi wajib diisi"),
  deskripsi: z.string().trim().optional(),
  statusAktif: z.boolean(),
});

function buildRedirectUrl(status: "success" | "error", message: string) {
  const params = new URLSearchParams({
    statusType: status,
    message,
  });

  return `/locations?${params.toString()}`;
}

export async function createLocationAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk menambah lokasi."));
  }

  const parsed = locationSchema.safeParse({
    kodeLokasi: formData.get("kodeLokasi"),
    namaLokasi: formData.get("namaLokasi"),
    tipeLokasi: formData.get("tipeLokasi"),
    barcodeValue: formData.get("barcodeValue"),
    deskripsi: formData.get("deskripsi"),
    statusAktif: formData.get("statusAktif") === "on",
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data lokasi tidak valid."));
  }

  const payload = parsed.data;

  const { error } = await supabase.from("locations").insert({
    kode_lokasi: payload.kodeLokasi,
    nama_lokasi: payload.namaLokasi,
    tipe_lokasi: payload.tipeLokasi,
    barcode_value: payload.barcodeValue,
    deskripsi: payload.deskripsi && payload.deskripsi.length > 0 ? payload.deskripsi : null,
    status_aktif: payload.statusAktif,
  });

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  revalidatePath("/locations");
  redirect(buildRedirectUrl("success", "Lokasi baru berhasil ditambahkan."));
}

const updateLocationSchema = locationSchema.extend({
  id: z.string().uuid("ID lokasi tidak valid"),
});

export async function updateLocationAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk mengedit lokasi."));
  }

  const parsed = updateLocationSchema.safeParse({
    id: formData.get("id"),
    kodeLokasi: formData.get("kodeLokasi"),
    namaLokasi: formData.get("namaLokasi"),
    tipeLokasi: formData.get("tipeLokasi"),
    barcodeValue: formData.get("barcodeValue"),
    deskripsi: formData.get("deskripsi"),
    statusAktif: formData.get("statusAktif") === "on",
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data lokasi tidak valid."));
  }

  const payload = parsed.data;

  const { error } = await supabase
    .from("locations")
    .update({
      kode_lokasi: payload.kodeLokasi,
      nama_lokasi: payload.namaLokasi,
      tipe_lokasi: payload.tipeLokasi,
      barcode_value: payload.barcodeValue,
      deskripsi: payload.deskripsi && payload.deskripsi.length > 0 ? payload.deskripsi : null,
      status_aktif: payload.statusAktif,
    })
    .eq("id", payload.id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  revalidatePath("/locations");
  redirect(buildRedirectUrl("success", "Lokasi berhasil diperbarui."));
}

export async function deleteLocationAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk menghapus lokasi."));
  }

  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    redirect(buildRedirectUrl("error", "ID lokasi tidak ditemukan."));
  }

  const { error } = await supabase.from("locations").delete().eq("id", id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  revalidatePath("/locations");
  redirect(buildRedirectUrl("success", "Lokasi berhasil dihapus."));
}
