import { SkeletonForm, SkeletonTable } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <div className="h-3 w-24 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-7 w-40 animate-pulse rounded-lg bg-slate-200" />
      </div>
      <SkeletonForm fields={2} />
      <SkeletonTable rows={4} cols={3} />
    </div>
  );
}
