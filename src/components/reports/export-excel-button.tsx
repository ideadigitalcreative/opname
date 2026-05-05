interface ExportExcelButtonProps {
  disabled: boolean;
}

export function ExportExcelButton({ disabled }: ExportExcelButtonProps) {
  return (
    <button
      type="button"
      disabled
      aria-disabled={disabled}
      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-400"
      title="Export Excel akan diaktifkan pada tahap implementasi export."
    >
      Export Excel
    </button>
  );
}
