import type { FilterOption } from "@/types/report";

interface ProductFilterProps {
  options: FilterOption[];
  defaultValue?: string;
}

export function ProductFilter({ options, defaultValue }: ProductFilterProps) {
  return (
    <label className="space-y-2 text-sm text-slate-700">
      <span className="font-medium">Produk</span>
      <select
        name="product"
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-blue-500"
      >
        <option value="">Semua produk</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
