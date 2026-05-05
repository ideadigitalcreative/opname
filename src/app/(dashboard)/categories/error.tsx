"use client";

import { ErrorDisplay } from "@/components/ui/error-display";

export default function CategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorDisplay
      title="Error Kategori"
      message={error.message || "Terjadi kesalahan saat memuat data kategori."}
      onRetry={reset}
    />
  );
}
