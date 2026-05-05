interface SearchInputProps {
  name?: string;
  placeholder?: string;
  defaultValue?: string;
}

export function SearchInput({
  name,
  placeholder = "Cari data...",
  defaultValue,
}: SearchInputProps) {
  return (
    <input
      type="search"
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 sm:rounded-xl sm:px-4 sm:py-2.5"
    />
  );
}
