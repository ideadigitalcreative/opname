"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Dashboard"
      message={error.message || "Terjadi kesalahan saat memuat dashboard."}
      onRetry={reset}
    />
  );
}
