export default function SettingsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <div className="h-3 w-24 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-5">
        <div className="mb-2 h-5 w-40 animate-pulse rounded-lg bg-slate-200" />
        <div className="mb-6 h-3 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
