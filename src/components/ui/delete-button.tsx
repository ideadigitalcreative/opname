"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

interface DeleteButtonProps {
  action: (formData: FormData) => void;
  itemId: string;
  itemLabel?: string;
  label?: string;
}

export function DeleteButton({ action, itemId, itemLabel, label }: DeleteButtonProps) {
  const [pending, setPending] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const label = itemLabel ? `"${itemLabel}"` : "data ini";
    if (!window.confirm(`Yakin ingin menghapus ${label}? Tindakan ini tidak dapat dibatalkan.`)) {
      e.preventDefault();
      return;
    }
    setPending(true);
  }

  return (
    <form action={action} className="inline" onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={itemId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
        {pending ? "..." : (label ?? "Hapus")}
      </button>
    </form>
  );
}
