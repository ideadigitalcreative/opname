import { type NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text");

  if (!text) {
    return NextResponse.json({ error: "text parameter required" }, { status: 400 });
  }

  const size = Number(request.nextUrl.searchParams.get("size") ?? "300");
  const format = request.nextUrl.searchParams.get("format") ?? "png";

  if (format === "svg") {
    const svg = await QRCode.toString(text, { type: "svg", margin: 2, width: size });
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
    });
  }

  const buffer = await QRCode.toBuffer(text, { type: "png", margin: 2, width: size });
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  });
}
