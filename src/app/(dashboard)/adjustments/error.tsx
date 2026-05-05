"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function AdjustmentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Koreksi Stok"
      message={error.message || "Terjadi kesalahan saat memuat halaman koreksi stok."}
      onRetry={reset}
    />
  );
}
