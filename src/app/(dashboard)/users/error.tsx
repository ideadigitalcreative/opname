"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error User Management"
      message={error.message || "Terjadi kesalahan saat memuat data pengguna."}
      onRetry={reset}
    />
  );
}
