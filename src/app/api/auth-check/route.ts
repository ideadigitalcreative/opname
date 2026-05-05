import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  const hasCookieRole = Boolean(cookieStore.get("opname-role")?.value);

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.json({ isLoggedIn: true });
      }
    }
  }

  return NextResponse.json({ isLoggedIn: hasCookieRole });
}
