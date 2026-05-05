"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function MovementsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Mutasi Stok"
      message={error.message || "Terjadi kesalahan saat memuat data mutasi."}
      onRetry={reset}
    />
  );
}
