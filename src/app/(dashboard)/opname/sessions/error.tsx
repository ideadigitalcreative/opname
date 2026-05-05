"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function OpnameSessionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Sesi Opname"
      message={error.message || "Terjadi kesalahan saat memuat data sesi opname."}
      onRetry={reset}
    />
  );
}
