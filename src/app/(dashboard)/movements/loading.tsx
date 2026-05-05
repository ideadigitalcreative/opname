import { SkeletonTable } from "@/components/ui/skeleton";

export default function MovementsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <div className="h-3 w-24 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-full max-w-sm animate-pulse rounded-lg bg-slate-200" />
        <div className="h-10 w-20 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
