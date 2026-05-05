import type { FilterOption } from "@/types/report";

interface LocationFilterProps {
  options: FilterOption[];
  defaultValue?: string;
}

export function LocationFilter({ options, defaultValue }: LocationFilterProps) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="font-medium">Lokasi</span>
      <select
        name="location"
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
      >
        <option value="">Semua lokasi</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
