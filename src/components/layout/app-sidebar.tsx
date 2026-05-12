import Link from "next/link";
import Image from "next/image";

import { getNavigationByRole } from "@/lib/services/mock-data";
import { cn } from "@/lib/utils/cn";
import type { AppRole, UserProfile } from "@/types/app";

interface AppSidebarProps {
  currentPath: string;
  role: AppRole;
  profile: UserProfile;
}

export function AppSidebar({ currentPath, role }: AppSidebarProps) {
  const navigation = getNavigationByRole(role);

  return (
    <aside className="hidden h-full w-80 shrink-0 overflow-hidden border-r border-slate-200 bg-white text-slate-900 lg:flex lg:flex-col">
      <div className="shrink-0 px-4 pt-6 pb-4">
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <div className="flex justify-center">
            <Image src="/Logo-labkes.svg" alt="Logo" width={160} height={50} priority />
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = item.children
            ? item.children.some(
                (child) => currentPath === child.href || currentPath.startsWith(`${child.href}/`),
              )
            : currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          if (item.children && item.children.length > 0) {
            return (
              <details key={item.href} open={isActive} className="group rounded-xl">
                <summary
                  className={cn(
                    "flex cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] transition-colors",
                    isActive
                      ? "bg-indigo-50 font-semibold text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.title}</span>
                  <span className="text-xs text-slate-400 group-open:rotate-180">▾</span>
                </summary>
                <div className="space-y-1 pt-1 pl-6">
                  {item.children.map((child) => {
                    const isChildActive =
                      currentPath === child.href || currentPath.startsWith(`${child.href}/`);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center rounded-xl px-4 py-2.5 text-[15px] transition-colors",
                          isChildActive
                            ? "bg-indigo-50 font-semibold text-indigo-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <span>{child.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </details>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] transition-colors",
                isActive
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
