"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/utils/audit-log";

const stockInItemSchema = z.object({
  productId: z.string().uuid("Produk tidak valid"),
  locationId: z.string().uuid("Lokasi tujuan tidak valid"),
  qty: z.coerce.number().gt(0, "Qty masuk harus lebih dari 0"),
  hargaBeli: z.coerce.number().min(0, "Harga beli tidak boleh negatif"),
  catatan: z.string().trim().optional(),
});

const stockInSchema = z.object({
  tipeMasuk: z.enum(["pembelian", "drop_barang"]),
  tanggal: z.string().trim().min(1, "Tanggal transaksi wajib diisi"),
  supplier: z.string().trim().optional(),
  sumberDrop: z.string().trim().optional(),
  catatan: z.string().trim().optional(),
  items: z.array(stockInItemSchema).min(1, "Minimal satu item wajib diisi"),
  autoApply: z.boolean(),
});

function buildRedirectUrl(status: "success" | "error", message: string) {
  const params = new URLSearchParams({
    statusType: status,
    message,
  });

  return `/stock-in?${params.toString()}`;
}

function generateTransactionCode() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `IN-${year}${month}${day}-${random}`;
}

export async function createStockInAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildRedirectUrl("error", "Supabase belum aktif pada environment saat ini."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildRedirectUrl("error", "Login Supabase diperlukan untuk membuat transaksi stok masuk."));
  }

  let items: z.infer<typeof stockInItemSchema>[] = [];

  try {
    const rawItems = formData.get("itemsJson");
    items = JSON.parse(String(rawItems ?? "[]"));
  } catch {
    redirect(buildRedirectUrl("error", "Data item tidak valid."));
  }

  const parsed = stockInSchema.safeParse({
    tipeMasuk: formData.get("tipeMasuk"),
    tanggal: formData.get("tanggal"),
    supplier: formData.get("supplier"),
    sumberDrop: formData.get("sumberDrop"),
    catatan: formData.get("catatan"),
    items,
    autoApply: formData.get("autoApply") === "on",
  });

  if (!parsed.success) {
    redirect(
      buildRedirectUrl("error", parsed.error.issues[0]?.message ?? "Data transaksi tidak valid."),
    );
  }

  const payload = parsed.data;

  if (payload.tipeMasuk === "pembelian" && !payload.supplier) {
    redirect(buildRedirectUrl("error", "Supplier wajib diisi untuk transaksi pembelian."));
  }

  if (payload.tipeMasuk === "drop_barang" && !payload.sumberDrop) {
    redirect(buildRedirectUrl("error", "Sumber drop wajib diisi untuk transaksi drop barang."));
  }

  const kodeTransaksi = generateTransactionCode();

  const { data: transaction, error: transactionError } = await supabase
    .from("stock_in_transactions")
    .insert({
      kode_transaksi: kodeTransaksi,
      tipe_masuk: payload.tipeMasuk,
      tanggal: payload.tanggal,
      supplier: payload.tipeMasuk === "pembelian" ? payload.supplier : null,
      sumber_drop: payload.tipeMasuk === "drop_barang" ? payload.sumberDrop : null,
      catatan: payload.catatan || null,
      dibuat_oleh: user.id,
    })
    .select("id")
    .single();

  if (transactionError || !transaction) {
    redirect(buildRedirectUrl("error", transactionError?.message ?? "Gagal membuat transaksi."));
  }

  const itemInserts = payload.items.map((item) => ({
    transaction_id: transaction.id,
    product_id: item.productId,
    location_id: item.locationId,
    qty: item.qty,
    harga_beli: item.hargaBeli,
    catatan: item.catatan || null,
  }));

  const { error: itemError } = await supabase.from("stock_in_items").insert(itemInserts);

  if (itemError) {
    redirect(buildRedirectUrl("error", itemError.message));
  }

  if (payload.autoApply) {
    const { error: applyError } = await supabase.rpc("apply_stock_in", {
      p_transaction_id: transaction.id,
    });

    if (applyError) {
      redirect(
        buildRedirectUrl(
          "error",
          `Transaksi tersimpan tetapi gagal apply stok otomatis: ${applyError.message}`,
        ),
      );
    }
  }

  const totalQty = payload.items.reduce((acc, item) => acc + item.qty, 0);

  revalidatePath("/stock-in");
  revalidatePath("/product-stocks");
  revalidatePath("/movements");
  revalidatePath("/products");

  await writeAuditLog({
    userId: user.id,
    action: payload.autoApply ? "stock_in_applied" : "stock_in_created",
    entityType: "stock_in_transactions",
    entityId: transaction.id,
    newData: { kode_transaksi: kodeTransaksi, tipe_masuk: payload.tipeMasuk, totalQty, itemCount: payload.items.length },
  });

  redirect(buildRedirectUrl("success", `Transaksi stok masuk berhasil disimpan (${payload.items.length} item, ${totalQty} qty).`));
}
