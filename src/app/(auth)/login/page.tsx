"use client";

import { useActionState } from "react";
import { login } from "./actions";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, KeyRound, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="w-full">
      {/* Back button */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 mb-6 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Beranda
      </Link>

      <div className="rounded-3xl border border-[#0f2b48] bg-[#071a2e]/90 p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="mb-10 text-center relative z-10 flex flex-col items-center">
          <div className="h-16 w-16 mb-6 bg-white rounded-2xl p-2 shadow-lg shadow-black/20 flex items-center justify-center">
            <Image
              src="/logo-sipandai.png"
              alt="Logo SIPANDAI"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Login Admin</h1>
          <p className="mt-2 text-sm text-slate-400">
            Masuk ke panel manajemen SIPANDAI
          </p>
        </div>

        <form action={formAction} className="space-y-6 relative z-10">
          {state?.error && (
            <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-medium text-red-400">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Alamat Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@bps.go.id"
                  className="w-full rounded-xl border border-[#143550] bg-[#0a2240] pl-11 pr-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Kata Sandi <span className="text-red-400">*</span>
                </label>
              </div>
              <div className="relative">
                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#143550] bg-[#0a2240] pl-11 pr-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#071a2e] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Mengautentikasi...
                </>
              ) : (
                "Masuk ke Dashboard"
              )}
            </button>
          </div>
        </form>
      </div>
      
      <p className="text-center text-xs text-slate-500 mt-8 font-medium">
        &copy; {new Date().getFullYear()} Badan Pusat Statistik Kota Palu
      </p>
    </div>
  );
}
