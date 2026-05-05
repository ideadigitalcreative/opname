"use client";

import { Download, QrCode, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface QRCodeViewerProps {
  locationName: string;
  barcodeValue: string;
}

export function QRCodeViewer({ locationName, barcodeValue }: QRCodeViewerProps) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const qrUrl = `/api/qr?text=${encodeURIComponent(barcodeValue)}&size=400`;

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `QR-${locationName.replace(/\s+/g, "_")}-${barcodeValue}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, "_blank");
    }
  }, [qrUrl, locationName, barcodeValue]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
      >
        <QrCode className="h-3 w-3" />
        QR
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900">QR Code Lokasi</h3>
              <p className="mt-1 text-sm text-slate-500">{locationName}</p>
              <p className="text-xs text-slate-400">{barcodeValue}</p>
            </div>

            <div className="mt-4 flex justify-center">
              <div className="rounded-xl border-2 border-slate-200 bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt={`QR Code ${locationName}`}
                  width={250}
                  height={250}
                  className="block"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                <Download className="h-4 w-4" />
                Download PNG
              </button>
              <a
                href={`/api/qr?text=${encodeURIComponent(barcodeValue)}&size=400&format=svg`}
                download={`QR-${locationName.replace(/\s+/g, "_")}-${barcodeValue}.svg`}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                SVG
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function QRDownloadAllButton({ locations }: { locations: { namaLokasi: string; barcodeValue: string }[] }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadAll() {
    setDownloading(true);
    try {
      for (const loc of locations) {
        const response = await fetch(`/api/qr?text=${encodeURIComponent(loc.barcodeValue)}&size=400`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `QR-${loc.namaLokasi.replace(/\s+/g, "_")}-${loc.barcodeValue}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownloadAll}
      disabled={downloading}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 sm:h-10 sm:px-4"
    >
      <QrCode className="mr-1.5 h-4 w-4" />
      {downloading ? "Mengunduh..." : "Download Semua QR"}
    </button>
  );
}
