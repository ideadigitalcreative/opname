interface BarChartItem {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  title: string;
  description: string;
  items: BarChartItem[];
  valueLabel?: string;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "slate";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function SimpleBarChart({
  title,
  description,
  items,
  valueLabel = "Qty",
  tone = "slate",
}: SimpleBarChartProps) {
  const maxValue = items.reduce((accumulator, item) => Math.max(accumulator, item.value), 0) || 1;
  const toneClass =
    tone === "indigo"
      ? "bg-indigo-600"
      : tone === "emerald"
        ? "bg-emerald-600"
        : tone === "amber"
          ? "bg-amber-500"
          : tone === "rose"
            ? "bg-rose-600"
            : "bg-slate-900";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>
        <p className="text-xs leading-6 text-slate-600 sm:text-sm">{description}</p>
      </div>

      <div className="mt-4 space-y-3 sm:mt-5">
        {items.map((item) => {
          const percent = clamp((item.value / maxValue) * 100, 0, 100);

          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="min-w-0 truncate font-medium text-slate-700">{item.label}</span>
                <span className="shrink-0 text-slate-500">
                  {item.value.toLocaleString("id-ID")} {valueLabel}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 sm:h-2.5">
                <div
                  className={`h-2 rounded-full sm:h-2.5 ${toneClass}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
