"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function StockOutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Stok Keluar"
      message={error.message || "Terjadi kesalahan saat memuat data stok keluar."}
      onRetry={reset}
    />
  );
}
