"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Laporan"
      message={error.message || "Terjadi kesalahan saat memuat data laporan."}
      onRetry={reset}
    />
  );
}
