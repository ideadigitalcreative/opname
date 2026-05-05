interface EmptyReportStateProps {
  message: string;
}

export function EmptyReportState({ message }: EmptyReportStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Data laporan kosong</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Ubah filter atau reset filter untuk menampilkan data kembali.
      </p>
    </div>
  );
}
