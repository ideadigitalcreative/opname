import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      tone: {
        slate: "bg-slate-100 text-slate-700",
        green: "bg-emerald-100 text-emerald-700",
        blue: "bg-blue-100 text-blue-700",
        red: "bg-red-100 text-red-700",
        amber: "bg-amber-100 text-amber-700",
        purple: "bg-purple-100 text-purple-700",
      },
    },
    defaultVariants: {
      tone: "slate",
    },
  },
);

type StatusBadgeProps = {
  label: string;
  className?: string;
} & VariantProps<typeof badgeVariants>;

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)}>{label}</span>;
}
