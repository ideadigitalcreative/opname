import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-1.5 sm:space-y-2">
        {eyebrow ? (
          <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 sm:px-3 sm:py-1 sm:text-xs">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        <p className="hidden text-sm leading-6 text-slate-500 sm:block sm:max-w-3xl">{description}</p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2 sm:gap-3">{actions}</div>
      ) : null}
    </div>
  );
}
