"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function OpnameReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Review Opname"
      message={error.message || "Terjadi kesalahan saat memuat halaman review opname."}
      onRetry={reset}
    />
  );
}
