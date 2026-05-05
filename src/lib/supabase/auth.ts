import { cookies } from "next/headers";

import { getMockUser } from "@/lib/services/mock-data";
import type { AppRole, UserProfile } from "@/types/app";
import { hasSupabaseEnv } from "./env";
import { createSupabaseServerClient } from "./server";

const ROLE_COOKIE_KEY = "opname-role";
const NAME_COOKIE_KEY = "opname-name";

export function isAppRole(value: string): value is AppRole {
  return value === "admin" || value === "petugas_gudang" || value === "user";
}

export async function getCurrentRoleFromCookie(): Promise<AppRole> {
  const cookieStore = await cookies();
  const rawRole = cookieStore.get(ROLE_COOKIE_KEY)?.value;

  if (rawRole && isAppRole(rawRole)) {
    return rawRole;
  }

  return "admin";
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const fallbackRole = await getCurrentRoleFromCookie();
  const fallbackUser = getMockUser(fallbackRole);
  const cookieStore = await cookies();
  const customName = cookieStore.get(NAME_COOKIE_KEY)?.value;

  if (!hasSupabaseEnv()) {
    return customName ? { ...fallbackUser, fullName: customName } : fallbackUser;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return customName ? { ...fallbackUser, fullName: customName } : fallbackUser;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return customName ? { ...fallbackUser, fullName: customName } : fallbackUser;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isAppRole(profile.role)) {
    return {
      ...fallbackUser,
      id: user.id,
      email: user.email ?? fallbackUser.email,
      fullName: customName ?? fallbackUser.fullName,
    };
  }

  return {
    id: profile.id,
    fullName: profile.full_name ?? customName ?? fallbackUser.fullName,
    email: profile.email ?? user.email ?? fallbackUser.email,
    role: profile.role,
    avatarFallback: (profile.full_name ?? fallbackUser.fullName)
      .split(" ")
      .map((part: string) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    locationName: fallbackUser.locationName,
  };
}
