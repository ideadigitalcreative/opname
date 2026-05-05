"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/utils/audit-log";

const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU wajib diisi"),
  namaProduk: z.string().trim().min(1, "Nama produk wajib diisi"),
  barcodeProduk: z.string().trim().optional(),
  kategoriId: z.string().uuid("Kategori wajib dipilih"),
  satuanId: z.string().uuid("Satuan wajib dipilih"),
  minimumStok: z.coerce.number().min(0, "Minimum stok tidak boleh negatif"),
  statusAktif: z.boolean(),
});

function buildRedirectUrl(status: "success" | "error", message: string) {
  const params = new URLSearchParams({
    statusType: status,
    message,
  });

  return `/products?${params.toString()}`;
}

export async function createProductAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk menambah produk."));
  }

  const parsed = productSchema.safeParse({
    sku: formData.get("sku"),
    namaProduk: formData.get("namaProduk"),
    barcodeProduk: formData.get("barcodeProduk"),
    kategoriId: formData.get("kategoriId"),
    satuanId: formData.get("satuanId"),
    minimumStok: formData.get("minimumStok"),
    statusAktif: formData.get("statusAktif") === "on",
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data produk tidak valid."));
  }

  const payload = parsed.data;

  const { error } = await supabase.from("products").insert({
    sku: payload.sku,
    barcode_produk:
      payload.barcodeProduk && payload.barcodeProduk.length > 0 ? payload.barcodeProduk : null,
    nama_produk: payload.namaProduk,
    kategori_id: payload.kategoriId,
    satuan_id: payload.satuanId,
    minimum_stok: payload.minimumStok,
    status_aktif: payload.statusAktif,
  });

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  await writeAuditLog({
    userId: user.id,
    action: "create_product",
    entityType: "products",
    newData: { sku: payload.sku, nama_produk: payload.namaProduk },
  });

  revalidatePath("/products");
  redirect(buildRedirectUrl("success", "Produk baru berhasil ditambahkan."));
}

const updateProductSchema = productSchema.extend({
  id: z.string().uuid("ID produk tidak valid"),
});

export async function updateProductAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk mengedit produk."));
  }

  const parsed = updateProductSchema.safeParse({
    id: formData.get("id"),
    sku: formData.get("sku"),
    namaProduk: formData.get("namaProduk"),
    barcodeProduk: formData.get("barcodeProduk"),
    kategoriId: formData.get("kategoriId"),
    satuanId: formData.get("satuanId"),
    minimumStok: formData.get("minimumStok"),
    statusAktif: formData.get("statusAktif") === "on",
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data produk tidak valid."));
  }

  const payload = parsed.data;

  const { error } = await supabase
    .from("products")
    .update({
      sku: payload.sku,
      barcode_produk:
        payload.barcodeProduk && payload.barcodeProduk.length > 0 ? payload.barcodeProduk : null,
      nama_produk: payload.namaProduk,
      kategori_id: payload.kategoriId,
      satuan_id: payload.satuanId,
      minimum_stok: payload.minimumStok,
      status_aktif: payload.statusAktif,
    })
    .eq("id", payload.id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  await writeAuditLog({
    userId: user.id,
    action: "update_product",
    entityType: "products",
    entityId: payload.id,
    newData: { sku: payload.sku, nama_produk: payload.namaProduk },
  });

  revalidatePath("/products");
  redirect(buildRedirectUrl("success", "Produk berhasil diperbarui."));
}

export async function deleteProductAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk menghapus produk."));
  }

  const id = formData.get("id");

  if (typeof id !== "string" || !id) {
    redirect(buildRedirectUrl("error", "ID produk tidak ditemukan."));
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    redirect(buildRedirectUrl("error", error.message));
  }

  await writeAuditLog({
    userId: user.id,
    action: "delete_product",
    entityType: "products",
    entityId: id,
  });

  revalidatePath("/products");
  redirect(buildRedirectUrl("success", "Produk berhasil dihapus."));
}
