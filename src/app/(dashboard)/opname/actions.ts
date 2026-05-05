"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const createSessionSchema = z.object({
  namaSesi: z.string().min(1, "Nama sesi wajib diisi"),
  locationId: z.string().uuid("Lokasi tidak valid"),
  tanggalMulai: z.string().min(1, "Tanggal mulai wajib diisi"),
  tanggalSelesai: z.string().optional(),
  catatan: z.string().optional(),
});

export async function createOpnameSessionAction(formData: FormData) {
  const parsed = createSessionSchema.safeParse({
    namaSesi: formData.get("namaSesi"),
    locationId: formData.get("locationId"),
    tanggalMulai: formData.get("tanggalMulai"),
    tanggalSelesai: formData.get("tanggalSelesai") || undefined,
    catatan: formData.get("catatan") || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    redirect(`/opname/sessions?statusType=error&message=${encodeURIComponent(message)}`);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(`/opname/sessions?statusType=error&message=${encodeURIComponent("Supabase belum dikonfigurasi.")}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/opname/sessions?statusType=error&message=${encodeURIComponent("Anda belum login.")}`);
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const kodeSesi = `OPN-${dateStr}-${randomSuffix}`;

  const { data: newSession, error } = await supabase
    .from("opname_sessions")
    .insert({
      kode_sesi: kodeSesi,
      nama_sesi: parsed.data.namaSesi,
      location_id: parsed.data.locationId,
      tanggal_mulai: parsed.data.tanggalMulai,
      tanggal_selesai: parsed.data.tanggalSelesai || null,
      status: "draft",
      dibuat_oleh: user.id,
      catatan: parsed.data.catatan || null,
    })
    .select("id")
    .single();

  if (error || !newSession) {
    redirect(
      `/opname/sessions?statusType=error&message=${encodeURIComponent(`Gagal membuat sesi: ${error?.message ?? "Unknown error"}`)}`,
    );
  }

  const { data: stocks } = await supabase
    .from("product_stocks")
    .select("product_id, location_id, qty")
    .eq("location_id", parsed.data.locationId);

  if (stocks && stocks.length > 0) {
    const items = stocks.map((stock) => ({
      session_id: newSession.id,
      product_id: stock.product_id,
      location_id: stock.location_id,
      stok_sistem_snapshot: Number(stock.qty ?? 0),
    }));

    await supabase.from("opname_items").insert(items);
  }

  revalidatePath("/opname/sessions");
  redirect(
    `/opname/sessions?statusType=success&message=${encodeURIComponent(`Sesi "${parsed.data.namaSesi}" berhasil dibuat dengan ${stocks?.length ?? 0} item.`)}`,
  );
}

const inputStokSchema = z.object({
  itemId: z.string().uuid("Item ID tidak valid"),
  stokFisik: z.coerce.number().min(0, "Stok fisik tidak boleh negatif"),
  catatan: z.string().optional(),
});

export async function updateOpnameItemAction(formData: FormData) {
  const parsed = inputStokSchema.safeParse({
    itemId: formData.get("itemId"),
    stokFisik: formData.get("stokFisik"),
    catatan: formData.get("catatan") || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    redirect(`/opname/input?statusType=error&message=${encodeURIComponent(message)}`);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(`/opname/input?statusType=error&message=${encodeURIComponent("Supabase belum dikonfigurasi.")}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/opname/input?statusType=error&message=${encodeURIComponent("Anda belum login.")}`);
  }

  const { data: item } = await supabase
    .from("opname_items")
    .select("session_id")
    .eq("id", parsed.data.itemId)
    .maybeSingle();

  if (!item) {
    redirect(`/opname/input?statusType=error&message=${encodeURIComponent("Item opname tidak ditemukan.")}`);
  }

  const { error } = await supabase
    .from("opname_items")
    .update({
      stok_fisik: parsed.data.stokFisik,
      catatan: parsed.data.catatan || null,
      dihitung_oleh: user.id,
      dihitung_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.itemId);

  if (error) {
    redirect(
      `/opname/input?statusType=error&message=${encodeURIComponent(`Gagal menyimpan: ${error.message}`)}`,
    );
  }

  revalidatePath("/opname/input");
  redirect(`/opname/input?statusType=success&message=${encodeURIComponent("Stok fisik berhasil disimpan.")}`);
}

export async function updateSessionStatusAction(sessionId: string, newStatus: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(`/opname/sessions?statusType=error&message=${encodeURIComponent("Supabase belum dikonfigurasi.")}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/opname/sessions?statusType=error&message=${encodeURIComponent("Anda belum login.")}`);
  }

  if (newStatus === "menunggu_approval") {
    const { count } = await supabase
      .from("opname_items")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .is("stok_fisik", null);

    if (count && count > 0) {
      redirect(
        `/opname/sessions?statusType=error&message=${encodeURIComponent(`Masih ada ${count} item yang belum dihitung. Semua item harus dihitung sebelum submit review.`)}`,
      );
    }
  }

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "aktif") {
    updateData.tanggal_mulai = new Date().toISOString().split("T")[0];
  } else if (newStatus === "menunggu_approval") {
    updateData.tanggal_selesai = new Date().toISOString().split("T")[0];
  } else if (newStatus === "disetujui" || newStatus === "ditolak") {
    updateData.approved_by = user.id;
    updateData.approved_at = new Date().toISOString();
  }

  const { data: sessionData } = await supabase
    .from("opname_sessions")
    .select("kode_sesi, nama_sesi")
    .eq("id", sessionId)
    .maybeSingle();

  const namaSesi = (sessionData as Record<string, unknown> | null)?.nama_sesi as string | undefined;
  const kodeSesi = sessionData?.kode_sesi as string | undefined;

  const { error } = await supabase
    .from("opname_sessions")
    .update(updateData)
    .eq("id", sessionId);

  if (error) {
    redirect(
      `/opname/sessions?statusType=error&message=${encodeURIComponent(`Gagal mengubah status: ${error.message}`)}`,
    );
  }

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: `opname_${newStatus}`,
    entity_type: "opname_sessions",
    entity_id: sessionId,
    new_data: { status: newStatus, kode_sesi: kodeSesi },
  });

  revalidatePath("/opname/sessions");
  revalidatePath("/opname/review");
  redirect(
    `/opname/sessions?statusType=success&message=${encodeURIComponent(`Status sesi "${namaSesi ?? kodeSesi}" berhasil diubah ke "${newStatus.replaceAll("_", " ")}".`)}`,
  );
}

export async function applyOpnameCorrectionAction(sessionId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(`/opname/sessions?statusType=error&message=${encodeURIComponent("Supabase belum dikonfigurasi.")}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/opname/sessions?statusType=error&message=${encodeURIComponent("Anda belum login.")}`);
  }

  const { data: sessionData } = await supabase
    .from("opname_sessions")
    .select("kode_sesi, nama_sesi, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!sessionData) {
    redirect(`/opname/sessions?statusType=error&message=${encodeURIComponent("Sesi tidak ditemukan.")}`);
  }

  const sessionStatus = (sessionData as Record<string, unknown>).status as string;

  if (sessionStatus !== "disetujui") {
    redirect(
      `/opname/sessions?statusType=error&message=${encodeURIComponent("Koreksi hanya bisa diterapkan untuk sesi yang sudah disetujui.")}`,
    );
  }

  const { error } = await supabase.rpc("apply_opname_correction", {
    p_session_id: sessionId,
  });

  if (error) {
    redirect(
      `/opname/sessions?statusType=error&message=${encodeURIComponent(`Gagal koreksi stok: ${error.message}`)}`,
    );
  }

  await supabase
    .from("opname_sessions")
    .update({ status: "selesai" })
    .eq("id", sessionId);

  const namaSesi = (sessionData as Record<string, unknown>).nama_sesi as string | undefined;
  const kodeSesi = sessionData.kode_sesi as string | undefined;

  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "opname_correction_applied",
    entity_type: "opname_sessions",
    entity_id: sessionId,
    new_data: { status: "selesai", kode_sesi: kodeSesi },
  });

  revalidatePath("/opname/sessions");
  revalidatePath("/adjustments");
  redirect(
    `/opname/sessions?statusType=success&message=${encodeURIComponent(`Koreksi stok sesi "${namaSesi ?? kodeSesi}" berhasil diterapkan dan status diubah ke selesai.`)}`,
  );
}
