"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function OpnameInputError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Input Opname"
      message={error.message || "Terjadi kesalahan saat memuat form input opname."}
      onRetry={reset}
    />
  );
}
