"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Pengaturan"
      message={error.message || "Terjadi kesalahan saat memuat halaman pengaturan."}
      onRetry={reset}
    />
  );
}
