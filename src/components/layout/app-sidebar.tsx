import Link from "next/link";

import { getNavigationByRole } from "@/lib/services/mock-data";
import { cn } from "@/lib/utils/cn";
import type { AppRole, UserProfile } from "@/types/app";

interface AppSidebarProps {
  currentPath: string;
  role: AppRole;
  profile: UserProfile;
}

export function AppSidebar({ currentPath, role, profile }: AppSidebarProps) {
  const navigation = getNavigationByRole(role);

  return (
    <aside className="hidden h-full w-72 shrink-0 overflow-hidden border-r border-slate-200 bg-white text-slate-900 lg:flex lg:flex-col">
      <div className="shrink-0 px-4 pt-6 pb-4">
        <div className="rounded-2xl bg-slate-50 px-4 py-4">
          <p className="text-sm font-medium text-slate-900">{profile.fullName}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-indigo-600">{profile.role}</p>
          <p className="mt-1 text-xs text-slate-500">{profile.email}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
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
