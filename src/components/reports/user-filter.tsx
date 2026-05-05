import type { FilterOption } from "@/types/report";

interface UserFilterProps {
  options: FilterOption[];
  defaultValue?: string;
}

export function UserFilter({ options, defaultValue }: UserFilterProps) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="font-medium">User / Petugas</span>
      <select
        name="user"
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
      >
        <option value="">Semua user</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
