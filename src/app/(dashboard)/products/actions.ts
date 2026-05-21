"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/utils/audit-log";

const productSchema = z.object({
  sku: z.string().trim().optional(),
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

function buildProductDetailRedirectUrl(productId: string, status: "success" | "error", message: string) {
  const params = new URLSearchParams({
    statusType: status,
    message,
  });

  return `/products/${productId}?${params.toString()}`;
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
    sku: payload.sku && payload.sku.length > 0 ? payload.sku : null,
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
      sku: payload.sku && payload.sku.length > 0 ? payload.sku : null,
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

const initialStockSchema = z.object({
  productId: z.string().uuid("Produk tidak valid"),
  locationId: z.string().uuid("Lokasi tidak valid"),
  qty: z.coerce.number().min(0, "Qty tidak boleh negatif"),
  catatan: z.string().trim().optional(),
});

export async function setInitialStockAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/products?statusType=error&message=Supabase%20belum%20aktif%20pada%20environment%20saat%20ini.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const productFallback = String(formData.get("productId") ?? "").trim();
    redirect(
      productFallback
        ? buildProductDetailRedirectUrl(productFallback, "error", "Login Supabase diperlukan untuk mengatur stok awal.")
        : "/products?statusType=error&message=Login%20Supabase%20diperlukan%20untuk%20mengatur%20stok%20awal.",
    );
  }

  const parsed = initialStockSchema.safeParse({
    productId: formData.get("productId"),
    locationId: formData.get("locationId"),
    qty: formData.get("qty"),
    catatan: formData.get("catatan"),
  });

  if (!parsed.success) {
    const productFallback = String(formData.get("productId") ?? "").trim();
    redirect(
      productFallback
        ? buildProductDetailRedirectUrl(
            productFallback,
            "error",
            parsed.error.issues[0]?.message ?? "Data stok awal tidak valid.",
          )
        : buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data stok awal tidak valid."),
    );
  }

  const payload = parsed.data;

  const { data: existingStock, error: existingError } = await supabase
    .from("product_stocks")
    .select("qty")
    .eq("product_id", payload.productId)
    .eq("location_id", payload.locationId)
    .maybeSingle();

  if (existingError) {
    redirect(buildProductDetailRedirectUrl(payload.productId, "error", existingError.message));
  }

  const qtyBefore = Number(existingStock?.qty ?? 0);
  const qtyAfter = Number(payload.qty);
  const qtyChange = qtyAfter - qtyBefore;

  if (qtyChange === 0) {
    redirect(buildProductDetailRedirectUrl(payload.productId, "error", "Stok awal tidak berubah (qty sama)."));
  }

  const { error: upsertError } = await supabase.from("product_stocks").upsert(
    {
      product_id: payload.productId,
      location_id: payload.locationId,
      qty: qtyAfter,
    },
    { onConflict: "product_id,location_id" },
  );

  if (upsertError) {
    redirect(buildProductDetailRedirectUrl(payload.productId, "error", upsertError.message));
  }

  const description = payload.catatan && payload.catatan.length > 0 ? payload.catatan : "Set stok awal (manual)";

  const { error: movementError } = await supabase.from("stock_movements").insert({
    product_id: payload.productId,
    location_id: payload.locationId,
    movement_type: "ADJUSTMENT",
    source_type: "koreksi",
    qty_change: qtyChange,
    qty_before: qtyBefore,
    qty_after: qtyAfter,
    description,
    created_by: user.id,
  });

  if (movementError) {
    redirect(buildProductDetailRedirectUrl(payload.productId, "error", movementError.message));
  }

  await writeAuditLog({
    userId: user.id,
    action: "set_initial_stock",
    entityType: "product_stocks",
    entityId: `${payload.productId}:${payload.locationId}`,
    newData: { qty_before: qtyBefore, qty_after: qtyAfter, qty_change: qtyChange, description },
  });

  revalidatePath(`/products/${payload.productId}`);
  revalidatePath("/products");
  revalidatePath("/product-stocks");
  revalidatePath("/movements");
  revalidatePath("/dashboard");

  redirect(buildProductDetailRedirectUrl(payload.productId, "success", "Stok awal berhasil diset."));
}
