"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/utils/audit-log";

const quickStockOutItemSchema = z.object({
  productId: z.string().min(1, "Produk tidak valid"),
  qty: z.coerce.number().gt(0, "Qty harus lebih dari 0"),
});

const quickStockOutSchema = z.object({
  barcodeValue: z.string().trim().min(1, "Barcode wajib diisi"),
  keperluan: z.string().trim().min(1, "Keperluan wajib diisi"),
  catatan: z.string().trim().optional(),
  items: z.array(quickStockOutItemSchema).min(1, "Minimal satu item wajib diisi"),
});

function buildRedirectUrl(status: "success" | "error", message: string) {
  const params = new URLSearchParams({ statusType: status, message });
  return `/?${params.toString()}`;
}

function generateTransactionCode() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `OUT-${year}${month}${day}-${random}`;
}

function toDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function quickStockOutAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif."));
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login diperlukan untuk mengambil barang."));
  }

  let items: z.infer<typeof quickStockOutItemSchema>[] = [];

  try {
    const rawItems = formData.get("itemsJson");
    items = JSON.parse(String(rawItems ?? "[]"));
  } catch {
    redirect(buildRedirectUrl("error", "Data item tidak valid."));
  }

  const parsed = quickStockOutSchema.safeParse({
    barcodeValue: formData.get("barcodeValue"),
    keperluan: formData.get("keperluan"),
    catatan: formData.get("catatan"),
    items,
  });

  if (!parsed.success) {
    redirect(buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data tidak valid."));
  }

  const payload = parsed.data;

  const { data: location, error: locError } = await supabase
    .from("locations")
    .select("id, nama_lokasi")
    .eq("barcode_value", payload.barcodeValue)
    .eq("status_aktif", true)
    .maybeSingle();

  if (locError || !location) {
    redirect(buildRedirectUrl("error", "Lokasi tidak ditemukan atau nonaktif. Pastikan barcode lokasi benar."));
  }

  const kodeTransaksi = generateTransactionCode();

  const { data: transaction, error: transactionError } = await supabase
    .from("stock_out_transactions")
    .insert({
      kode_transaksi: kodeTransaksi,
      tanggal: toDateString(new Date()),
      location_id: location.id,
      diambil_oleh: user.id,
      keperluan: payload.keperluan,
      catatan: payload.catatan || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (transactionError || !transaction) {
    redirect(buildRedirectUrl("error", transactionError?.message ?? "Gagal membuat transaksi."));
  }

  const itemInserts = payload.items.map((item) => ({
    transaction_id: transaction.id,
    product_id: item.productId,
    qty: item.qty,
  }));

  const { error: itemError } = await supabase.from("stock_out_items").insert(itemInserts);

  if (itemError) {
    redirect(buildRedirectUrl("error", itemError.message));
  }

  const { error: applyError } = await supabase.rpc("apply_stock_out", {
    p_transaction_id: transaction.id,
  });

  if (applyError) {
    redirect(
      buildRedirectUrl("error", `Transaksi tersimpan tetapi gagal apply stok: ${applyError.message}`),
    );
  }

  const totalQty = payload.items.reduce((acc, item) => acc + item.qty, 0);

  revalidatePath("/");
  revalidatePath("/product-stocks");
  revalidatePath("/movements");

  await writeAuditLog({
    userId: user.id,
    action: "stock_out_applied",
    entityType: "stock_out_transactions",
    entityId: transaction.id,
    newData: { kode_transaksi: kodeTransaksi, keperluan: payload.keperluan, totalQty, itemCount: payload.items.length },
  });

  redirect(
    buildRedirectUrl("success", `Berhasil mengambil ${payload.items.length} item (${totalQty} qty). Kode: ${kodeTransaksi}`),
  );
}
