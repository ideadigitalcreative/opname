"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";

interface LoginFormProps {
  action: (formData: FormData) => void;
  message?: string;
  statusType?: string;
}

function FormOverlay() {
  const { pending } = useFormStatus();

  if (!pending) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-700">Sedang memproses...</p>
      </div>
    </div>
  );
}

export function LoginForm({ action, message, statusType }: LoginFormProps) {
  return (
    <div className="relative">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Login</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Masuk ke aplikasi
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          Gunakan akun Supabase Auth jika sudah tersedia. Jika belum, mode demo lokal tetap
          bisa dipakai untuk mencoba UI.
        </p>
      </div>

      {message ? (
        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
            statusType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      ) : null}

      <form action={action} className="relative mt-6 space-y-4">
        <FormOverlay />
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-slate-700">User</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="font-medium text-slate-700">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </label>

        <SubmitButton className="w-full" loadingText="Sedang masuk...">
          Masuk
        </SubmitButton>
      </form>
    </div>
  );
}
