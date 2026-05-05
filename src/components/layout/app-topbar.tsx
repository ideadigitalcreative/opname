import { ProfileDropdown } from "@/components/layout/profile-dropdown";
import type { UserProfile } from "@/types/app";

interface AppTopbarProps {
  profile: UserProfile;
}

export function AppTopbar({ profile }: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0">
          <p className="hidden text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:block">
            Manajemen Stok Gudang
          </p>
          <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
            Halo, {profile.fullName}
          </h2>
          <p className="hidden truncate text-sm text-slate-500 sm:block">
            Role {profile.role} &middot; {profile.locationName ?? "Semua lokasi"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ProfileDropdown avatarFallback={profile.avatarFallback} />
        </div>
      </div>
    </header>
  );
}
