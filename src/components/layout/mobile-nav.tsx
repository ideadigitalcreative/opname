import Link from "next/link";

import { getNavigationByRole } from "@/lib/services/mock-data";
import { cn } from "@/lib/utils/cn";
import type { AppRole } from "@/types/app";

interface MobileNavProps {
  currentPath: string;
  role: AppRole;
}

export function MobileNav({ currentPath, role }: MobileNavProps) {
  const items = getNavigationByRole(role).slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm lg:hidden">
      <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium leading-tight transition-colors",
                isActive ? "text-indigo-600" : "text-slate-400",
              )}
            >
              {isActive && (
                <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-indigo-600" />
              )}
              <Icon className={cn("h-5 w-5", isActive && "text-indigo-600")} />
              <span className="truncate px-1 text-center">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
