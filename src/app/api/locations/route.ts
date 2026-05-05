import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ locations: [] });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ locations: [] });
  }

  const { data, error } = await supabase
    .from("locations")
    .select("id, kode_lokasi, nama_lokasi, barcode_value, tipe_lokasi")
    .eq("status_aktif", true)
    .order("nama_lokasi");

  if (error || !data) {
    return NextResponse.json({ locations: [] });
  }

  return NextResponse.json({
    locations: data.map((item) => ({
      id: item.id,
      kodeLokasi: item.kode_lokasi,
      namaLokasi: item.nama_lokasi,
      barcodeValue: item.barcode_value,
      tipeLokasi: item.tipe_lokasi,
    })),
  });
}
