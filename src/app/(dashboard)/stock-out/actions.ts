"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/utils/audit-log";

const stockOutItemSchema = z.object({
  productId: z.string().uuid("Produk tidak valid"),
  qty: z.coerce.number().gt(0, "Qty pengambilan harus lebih dari 0"),
  catatan: z.string().trim().optional(),
});

const stockOutSchema = z.object({
  barcodeValue: z.string().trim().min(1, "Barcode lokasi wajib diisi"),
  locationId: z.string().uuid("Lokasi tidak valid"),
  items: z.array(stockOutItemSchema).min(1, "Minimal satu item wajib diisi"),
  keperluan: z.string().trim().min(1, "Keperluan wajib diisi"),
  catatan: z.string().trim().optional(),
  autoApply: z.boolean(),
});

function buildRedirectUrl(barcodeValue: string, status: "success" | "error", message: string) {
  const params = new URLSearchParams({
    barcode: barcodeValue,
    statusType: status,
    message,
  });

  return `/stock-out?${params.toString()}`;
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

export async function createStockOutAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/stock-out?statusType=error&message=Supabase%20belum%20aktif%20pada%20environment%20saat%20ini.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/stock-out?statusType=error&message=Login%20Supabase%20diperlukan%20untuk%20mengambil%20barang.");
  }

  let items: z.infer<typeof stockOutItemSchema>[] = [];

  try {
    const rawItems = formData.get("itemsJson");
    items = JSON.parse(String(rawItems ?? "[]"));
  } catch {
    redirect("/stock-out?statusType=error&message=Data%20item%20tidak%20valid.");
  }

  const parsed = stockOutSchema.safeParse({
    barcodeValue: formData.get("barcodeValue"),
    locationId: formData.get("locationId"),
    items,
    keperluan: formData.get("keperluan"),
    catatan: formData.get("catatan"),
    autoApply: formData.get("autoApply") === "on",
  });

  if (!parsed.success) {
    const barcodeFallback = String(formData.get("barcodeValue") ?? "").trim();
    redirect(
      buildRedirectUrl(
        barcodeFallback || "",
        "error",
        parsed.error.issues[0]?.message ?? "Data pengambilan tidak valid.",
      ),
    );
  }

  const payload = parsed.data;

  const kodeTransaksi = generateTransactionCode();

  const { data: transaction, error: transactionError } = await supabase
    .from("stock_out_transactions")
    .insert({
      kode_transaksi: kodeTransaksi,
      tanggal: toDateString(new Date()),
      location_id: payload.locationId,
      diambil_oleh: user.id,
      keperluan: payload.keperluan,
      catatan: payload.catatan || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (transactionError || !transaction) {
    redirect(buildRedirectUrl(payload.barcodeValue, "error", transactionError?.message ?? "Gagal membuat transaksi."));
  }

  const itemInserts = payload.items.map((item) => ({
    transaction_id: transaction.id,
    product_id: item.productId,
    qty: item.qty,
    catatan: item.catatan || null,
  }));

  const { error: itemError } = await supabase.from("stock_out_items").insert(itemInserts);

  if (itemError) {
    redirect(buildRedirectUrl(payload.barcodeValue, "error", itemError.message));
  }

  if (payload.autoApply) {
    const { error: applyError } = await supabase.rpc("apply_stock_out", {
      p_transaction_id: transaction.id,
    });

    if (applyError) {
      redirect(
        buildRedirectUrl(
          payload.barcodeValue,
          "error",
          `Transaksi tersimpan tetapi gagal apply stok: ${applyError.message}`,
        ),
      );
    }
  }

  const totalQty = payload.items.reduce((acc, item) => acc + item.qty, 0);

  revalidatePath("/stock-out");
  revalidatePath("/product-stocks");
  revalidatePath("/movements");

  await writeAuditLog({
    userId: user.id,
    action: payload.autoApply ? "stock_out_applied" : "stock_out_created",
    entityType: "stock_out_transactions",
    entityId: transaction.id,
    newData: { kode_transaksi: kodeTransaksi, keperluan: payload.keperluan, totalQty, itemCount: payload.items.length },
  });

  redirect(buildRedirectUrl(payload.barcodeValue, "success", `Pengambilan barang berhasil diproses (${payload.items.length} item, ${totalQty} qty).`));
}

