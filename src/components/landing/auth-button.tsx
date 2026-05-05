"use client";

import Link from "next/link";
import { LayoutDashboard, LogIn } from "lucide-react";
import { useEffect, useState } from "react";

export function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth-check")
      .then((res) => res.json())
      .then((data) => setIsLoggedIn(Boolean(data.isLoggedIn)))
      .catch(() => setIsLoggedIn(false));
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
