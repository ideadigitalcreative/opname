"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export function AuthButton() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth-check")
      .then((res) => res.json())
      .then((data) => {
        if (data.isLoggedIn) {
          setRole(data.role ?? "user");
        } else {
          setRole(null);
        }
      })
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="inline-flex h-9 w-24 animate-pulse rounded-lg bg-slate-200 sm:h-10" />
    );
  }

  if (role === "user") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-400 sm:h-10"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    );
  }

  if (role === "admin" || role === "petugas_gudang") {
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
