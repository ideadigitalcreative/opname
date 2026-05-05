"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { UserProfile } from "@/types/app";

interface DashboardShellProps {
  profile: UserProfile;
  children: ReactNode;
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AppSidebar currentPath={pathname} role={profile.role} profile={profile} />
      <div className="flex min-h-0 w-0 flex-1 flex-col">
        <AppTopbar profile={profile} />
        <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 pb-20 sm:px-6 sm:py-6 lg:px-8 lg:pb-8">{children}</main>
      </div>
      <MobileNav currentPath={pathname} role={profile.role} />
    </div>
  );
}
