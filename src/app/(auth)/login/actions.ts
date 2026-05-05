"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isAppRole } from "@/lib/supabase/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildRedirectUrl(status: "success" | "error", message: string) {
  const params = new URLSearchParams({
    statusType: status,
    message,
  });

  return `/login?${params.toString()}`;
}

function inferRoleFromUsername(username: string) {
  const value = username.toLowerCase();
  if (value.includes("admin")) return "admin";
  if (value.includes("petugas")) return "petugas_gudang";
  return "user";
}

export async function loginAction(formData: FormData) {
  const usernameInput = String(formData.get("username") ?? "").trim();
  const passwordInput = String(formData.get("password") ?? "");
  const cookieStore = await cookies();

  if (!usernameInput || !passwordInput) {
    redirect(buildRedirectUrl("error", "User dan password wajib diisi."));
  }

  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      redirect(buildRedirectUrl("error", "Supabase client tidak tersedia."));
    }

    if (!usernameInput.includes("@")) {
      redirect(buildRedirectUrl("error", "Untuk login Supabase, field User harus berupa email."));
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameInput,
      password: passwordInput,
    });

    if (signInError) {
      redirect(buildRedirectUrl("error", signInError.message));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(buildRedirectUrl("error", "Login berhasil tetapi user Supabase tidak ditemukan."));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile && isAppRole(profile.role) ? profile.role : "user";

    cookieStore.set("opname-role", role, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    cookieStore.set("opname-name", profile?.full_name || usernameInput, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });

    if (role === "user") {
      redirect("/");
    }

    if (role === "petugas_gudang") {
      redirect("/stock-in");
    }

    redirect("/dashboard");
  }

  const inferredRole = inferRoleFromUsername(usernameInput);
  const role = isAppRole(inferredRole) ? inferredRole : "user";

  cookieStore.set("opname-role", role, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  cookieStore.set("opname-name", usernameInput, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  if (role === "user") {
    redirect("/");
  }

  if (role === "petugas_gudang") {
    redirect("/stock-in");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete("opname-role");
  cookieStore.delete("opname-name");
  revalidatePath("/");
  redirect("/login");
}
