"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function AuditLogsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Audit Log"
      message={error.message || "Terjadi kesalahan saat memuat data audit log."}
      onRetry={reset}
    />
  );
}
