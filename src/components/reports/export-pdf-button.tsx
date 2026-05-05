interface ExportPdfButtonProps {
  disabled: boolean;
}

export function ExportPdfButton({ disabled }: ExportPdfButtonProps) {
  return (
    <button
      type="button"
      disabled
      aria-disabled={disabled}
      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-400"
      title="Export PDF akan diaktifkan pada tahap implementasi export."
    >
      Export PDF
    </button>
  );
}
