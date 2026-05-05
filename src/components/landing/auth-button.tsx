"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import { useEffect, useState } from "react";

function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const client = getBrowserClient();
    if (!client) {
      const hasRole = document.cookie.includes("opname-role=");
      setIsLoggedIn(hasRole);
      return;
    }

    client.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  if (isLoggedIn === null) {
    return (
      <div className="inline-flex h-9 w-24 animate-pulse rounded-lg bg-slate-200 sm:h-10" />
    );
  }

  if (isLoggedIn) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 sm:h-10"
      >
        <LayoutDashboard className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 sm:h-10"
    >
      <LogIn className="h-4 w-4" />
      <span>Login</span>
    </Link>
  );
}
