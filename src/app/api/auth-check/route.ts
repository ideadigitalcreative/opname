import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get("opname-role")?.value ?? null;

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.json({ isLoggedIn: true, role: role ?? "admin" });
      }
    }
  }

  if (role) {
    return NextResponse.json({ isLoggedIn: true, role });
  }

  return NextResponse.json({ isLoggedIn: false, role: null });
}
