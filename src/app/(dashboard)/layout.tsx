import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ToastProvider } from "@/components/ui/toast-provider";
import { FlashToast } from "@/components/ui/flash-toast";
import { getCurrentUserProfile } from "@/lib/supabase/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <ToastProvider>
      <FlashToast />
      <DashboardShell profile={profile}>{children}</DashboardShell>
    </ToastProvider>
  );
}
