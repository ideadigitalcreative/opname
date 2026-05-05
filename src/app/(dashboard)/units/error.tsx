"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function UnitsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Satuan"
      message={error.message || "Terjadi kesalahan saat memuat data satuan."}
      onRetry={reset}
    />
  );
}
