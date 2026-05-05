interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
}

export function DateRangeFilter({ startDate, endDate }: DateRangeFilterProps) {
  return (
    <>
      <label className="space-y-2 text-sm text-slate-700">
        <span className="font-medium">Tanggal Mulai</span>
        <input
          type="date"
          name="startDate"
          defaultValue={startDate}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
        />
      </label>
      <label className="space-y-2 text-sm text-slate-700">
        <span className="font-medium">Tanggal Selesai</span>
        <input
          type="date"
          name="endDate"
          defaultValue={endDate}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
        />
      </label>
    </>
  );
}
