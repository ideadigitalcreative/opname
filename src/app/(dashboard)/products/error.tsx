"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Data Barang"
      message={error.message || "Terjadi kesalahan saat memuat data produk."}
      onRetry={reset}
    />
  );
}
