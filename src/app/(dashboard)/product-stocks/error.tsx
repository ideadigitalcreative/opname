"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function ProductStocksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Stok Produk"
      message={error.message || "Terjadi kesalahan saat memuat data stok per lokasi."}
      onRetry={reset}
    />
  );
}
