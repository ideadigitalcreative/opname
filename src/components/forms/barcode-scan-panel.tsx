"use client";

import {
  Camera,
  CheckCircle,
  Keyboard,
  Loader2,
  MapPin,
  Minus,
  PackageSearch,
  Plus,
  ScanBarcode,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { quickStockOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

interface AvailableItem {
  productId: string;
  sku: string;
  namaProduk: string;
  satuan: string;
  qtyTersedia: number;
}

interface SelectedItem {
  productId: string;
  qty: number;
}

interface LookupResult {
  location: { id: string; namaLokasi: string; barcodeValue: string } | null;
  availableItems: AvailableItem[];
  note?: string;
}

interface LocationItem {
  id: string;
  kodeLokasi: string;
  namaLokasi: string;
  barcodeValue: string;
  tipeLokasi: string;
}

type ScanMode = "idle" | "camera" | "manual";

export function BarcodeScanPanel() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("idle");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [keperluan, setKeperluan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [locationList, setLocationList] = useState<LocationItem[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDetectedRef = useRef<string>("");

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (typeof BarcodeDetector !== "undefined") {
        if (!detectorRef.current) {
          detectorRef.current = new BarcodeDetector({ formats: ["qr_code", "code_128", "code_39", "ean_13", "ean_8", "upc_a"] });
        }

        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || !detectorRef.current || videoRef.current.readyState < 2) return;
          try {
            const barcodes = await detectorRef.current.detect(videoRef.current);
            if (barcodes.length > 0) {
              const value = barcodes[0].rawValue;
              if (value && value !== lastDetectedRef.current) {
                lastDetectedRef.current = value;
                setBarcodeInput(value);
                setScanMode("idle");
                stopCamera();
              }
            }
          } catch {
            // ignore detection errors
          }
        }, 300);
      } else {
        setCameraError("Browser tidak mendukung auto-detect barcode. Ketik barcode manual setelah melihat kamera.");
      }
    } catch (err) {
      const message = err instanceof DOMException && err.name === "NotAllowedError"
        ? "Izin kamera ditolak. Berikan izin akses kamera di pengaturan browser."
        : "Gagal mengakses kamera. Pastikan perangkat memiliki kamera.";
      setCameraError(message);
    }
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (scanMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
  }, [scanMode, startCamera, stopCamera]);

  useEffect(() => {
    if (scanMode !== "manual" || locationList.length > 0) return;
    let cancelled = false;
    setLocationLoading(true);
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setLocationList(data.locations ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLocationLoading(false);
      });
    return () => { cancelled = true; };
  }, [scanMode, locationList.length]);

  function handleClose() {
    setPanelOpen(false);
    stopCamera();
    setScanMode("idle");
    handleReset();
  }

  function handleOpen() {
    setPanelOpen(true);
    setScanMode("idle");
  }

  const handleLookup = useCallback(async (barcode?: string) => {
    const code = (barcode ?? barcodeInput).trim();
    if (!code) return;

    setLoading(true);
    setError(null);
    setSelected([]);

    try {
      const res = await fetch(`/api/barcode-lookup?barcode=${encodeURIComponent(code)}`);
      const data: LookupResult = await res.json();
      setLookupResult(data);
      if (!data.location) {
        setError(data.note ?? "Lokasi tidak ditemukan.");
      }
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }, [barcodeInput]);

  function addItem(productId: string) {
    setSelected((prev) => {
      if (prev.find((s) => s.productId === productId)) return prev;
      return [...prev, { productId, qty: 1 }];
    });
  }

  function removeItem(productId: string) {
    setSelected((prev) => prev.filter((s) => s.productId !== productId));
  }

  function updateQty(productId: string, qty: number) {
    setSelected((prev) =>
      prev.map((s) =>
        s.productId === productId ? { ...s, qty: Math.max(1, qty) } : s,
      ),
    );
  }

  function handleReset() {
    setBarcodeInput("");
    setLookupResult(null);
    setSelected([]);
    setError(null);
    setCameraError(null);
    setKeperluan("");
    setCatatan("");
    lastDetectedRef.current = "";
    setLocationSearch("");
  }

  function handleSelectLocation(location: LocationItem) {
    setBarcodeInput(location.barcodeValue);
    handleLookup(location.barcodeValue);
  }

  const filteredLocations = locationSearch.trim()
    ? locationList.filter((loc) => {
        const q = locationSearch.toLowerCase();
        return (
          loc.namaLokasi.toLowerCase().includes(q) ||
          loc.kodeLokasi.toLowerCase().includes(q) ||
          loc.barcodeValue.toLowerCase().includes(q)
        );
      })
    : locationList;

  function handleBarcodeDetected(value: string) {
    setBarcodeInput(value);
    setScanMode("idle");
    stopCamera();
    handleLookup(value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!lookupResult?.location || selected.length === 0 || !keperluan.trim()) return;

    const formData = new FormData();
    formData.set("barcodeValue", lookupResult.location.barcodeValue);
    formData.set("keperluan", keperluan);
    formData.set("catatan", catatan);
    formData.set(
      "itemsJson",
      JSON.stringify(
        selected.map((s) => ({
          productId: s.productId,
          qty: s.qty,
        })),
      ),
    );

    startTransition(async () => {
      await quickStockOutAction(formData);
    });
  }

  const availableItems = lookupResult?.availableItems ?? [];
  const unselected = availableItems.filter(
    (item) => !selected.find((s) => s.productId === item.productId),
  );

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition hover:scale-105 hover:bg-indigo-500 active:scale-95 sm:bottom-8 sm:right-8 sm:h-16 sm:w-16"
        title="Scan Barcode Ambil Barang"
      >
        <ScanBarcode className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative z-10 flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl sm:border sm:border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                Ambil Barang dari Lokasi
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScanMode(scanMode === "camera" ? "idle" : "camera")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
                      scanMode === "camera"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <Camera className="h-4 w-4" />
                    Scan Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScanMode(scanMode === "manual" ? "idle" : "manual");
                      setTimeout(() => barcodeRef.current?.focus(), 100);
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
                      scanMode === "manual"
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <Keyboard className="h-4 w-4" />
                    Input Manual
                  </button>
                </div>

                {scanMode === "camera" && (
                  <div className="space-y-2">
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black">
                      <video
                        ref={videoRef}
                        className="aspect-video w-full object-cover"
                        playsInline
                        muted
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-48 rounded-lg border-2 border-dashed border-white/60 sm:h-20 sm:w-56" />
                      </div>
                      <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                        Arahkan kamera ke barcode lokasi
                      </div>
                    </div>
                    {cameraError && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        {cameraError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleBarcodeDetected(barcodeInput);
                            }
                          }}
                          placeholder="Atau ketik barcode di sini"
                          className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBarcodeDetected(barcodeInput)}
                        disabled={loading || !barcodeInput.trim()}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        Cari
                      </button>
                    </div>
                  </div>
                )}

                {scanMode === "manual" && (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          ref={barcodeRef}
                          type="text"
                          value={locationSearch}
                          onChange={(e) => {
                            setLocationSearch(e.target.value);
                            setBarcodeInput(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleLookup();
                            }
                          }}
                          placeholder="Cari lokasi berdasarkan nama, kode, atau barcode..."
                          className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLookup()}
                        disabled={loading || !barcodeInput.trim()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        Cari
                      </button>
                    </div>

                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                      {locationLoading ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memuat daftar lokasi...
                        </div>
                      ) : filteredLocations.length > 0 ? (
                        filteredLocations.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => handleSelectLocation(loc)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-indigo-50"
                          >
                            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-800">
                                {loc.namaLokasi}
                              </p>
                              <p className="text-xs text-slate-500">
                                {loc.kodeLokasi} &middot; {loc.tipeLokasi}
                              </p>
                            </div>
                            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              {loc.barcodeValue}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="py-6 text-center text-sm text-slate-500">
                          {locationSearch.trim()
                            ? "Lokasi tidak ditemukan."
                            : "Tidak ada lokasi aktif."}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {lookupResult?.location && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
                    <p className="text-xs font-medium text-indigo-600">Lokasi ditemukan</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {lookupResult.location.namaLokasi}
                    </p>
                    <p className="text-xs text-slate-500">
                      Barcode: {lookupResult.location.barcodeValue}
                    </p>
                  </div>
                )}

                {lookupResult?.note && !error && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                    {lookupResult.note}
                  </div>
                )}

                {selected.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Item dipilih ({selected.length})
                    </h3>
                    {selected.map((sel) => {
                      const item = availableItems.find((a) => a.productId === sel.productId);
                      if (!item) return null;
                      return (
                        <div
                          key={sel.productId}
                          className="flex flex-col gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 sm:flex-row sm:items-center sm:gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {item.namaProduk}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.sku} &middot; Tersedia: {item.qtyTersedia} {item.satuan}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQty(sel.productId, sel.qty - 1)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={item.qtyTersedia}
                              value={sel.qty}
                              onChange={(e) =>
                                updateQty(sel.productId, Number(e.target.value))
                              }
                              className="w-14 rounded-md border border-slate-300 px-2 py-1 text-center text-sm outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => updateQty(sel.productId, sel.qty + 1)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(sel.productId)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {unselected.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-600">Pilih barang</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {unselected.map((item) => (
                        <button
                          key={item.productId}
                          type="button"
                          onClick={() => addItem(item.productId)}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {item.namaProduk}
                            </p>
                            <p className="text-xs text-slate-400">
                              {item.sku} &middot; {item.qtyTersedia} {item.satuan}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 shrink-0 text-indigo-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {lookupResult?.location && availableItems.length === 0 && !loading && (
                  <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center">
                    <PackageSearch className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500">
                      Tidak ada stok tersedia di lokasi ini.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selected.length > 0 && (
              <div className="border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">
                      Keperluan <span className="text-red-500">*</span>
                    </span>
                    <input
                      required
                      value={keperluan}
                      onChange={(e) => setKeperluan(e.target.value)}
                      placeholder="Instalasi / perbaikan / ..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Catatan</span>
                    <input
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      placeholder="Opsional"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </label>
                </div>
                <Button
                  type="submit"
                  disabled={isPending || !keperluan.trim()}
                  className="w-full"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Ambil Barang ({selected.length} item)
                    </>
                  )}
                </Button>
              </div>
            )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
