import type { FilterOption, ReportFilterKey } from "@/types/report";

interface StatusFilterProps {
  name: Extract<
    ReportFilterKey,
    "category" | "transactionStatus" | "stockStatus" | "opnameStatus" | "transactionType"
  >;
  label: string;
  allLabel: string;
  options: FilterOption[];
  defaultValue?: string;
}

export function StatusFilter({
  name,
  label,
  allLabel,
  options,
  defaultValue,
}: StatusFilterProps) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
