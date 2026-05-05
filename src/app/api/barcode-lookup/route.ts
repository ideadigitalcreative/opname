import { NextRequest, NextResponse } from "next/server";

import { getStockOutLocationByBarcode, getStockOutAvailableItems } from "@/lib/services/master-data";

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get("barcode")?.trim();

  if (!barcode) {
    return NextResponse.json({ error: "Barcode wajib diisi" }, { status: 400 });
  }

  const locationResult = await getStockOutLocationByBarcode(barcode);

  if (!locationResult.location) {
    return NextResponse.json({
      location: null,
      availableItems: [],
      note: locationResult.note ?? "Lokasi tidak ditemukan atau nonaktif.",
    });
  }

  const itemsResult = await getStockOutAvailableItems(locationResult.location.id);

  return NextResponse.json({
    location: locationResult.location,
    availableItems: itemsResult.items,
    note: locationResult.note,
  });
}
