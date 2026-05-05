"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function LocationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Lokasi"
      message={error.message || "Terjadi kesalahan saat memuat data lokasi."}
      onRetry={reset}
    />
  );
}
