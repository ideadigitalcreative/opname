export default function OpnameSessionsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <div className="h-3 w-24 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 sm:rounded-2xl sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="h-5 w-24 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-5 w-16 animate-pulse rounded-lg bg-slate-200" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded-lg bg-slate-200" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-3 w-full animate-pulse rounded-lg bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
