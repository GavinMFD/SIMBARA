"use client";

import { useActionState } from "react";
import { resetPasswordFirstTime } from "./actions";
import { KeyRound, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function UbahPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPasswordFirstTime, null);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#020b14] bg-grid-dots px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="rounded-2xl border border-[#143550] bg-[#0a2240]/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="rounded-2xl bg-blue-500/10 p-4 mb-4 ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <KeyRound size={32} className="text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Wajib Ubah Password</h1>
            <p className="text-sm text-slate-400 text-center mt-2 font-medium px-4">
              Demi keamanan, Anda diwajibkan untuk mengubah password default sebelum dapat mengakses sistem.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="rounded-xl bg-red-500/10 p-3.5 text-sm text-red-400 border border-red-500/20 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="leading-snug font-medium">{state.error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Password Baru
              </label>
              <div className="relative group">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full rounded-xl border border-[#143550] bg-[#071a2e] px-10 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Konfirmasi Password
              </label>
              <div className="relative group">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Ketik ulang password baru"
                  required
                  className="w-full rounded-xl border border-[#143550] bg-[#071a2e] px-10 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] mt-2"
            >
              {isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Simpan & Lanjutkan
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 opacity-60">
          <Image
            src="/logo-simbara.png"
            alt="SIMBARA Logo"
            width={24}
            height={24}
            className="rounded opacity-70 grayscale"
          />
          <span className="text-xs font-semibold text-slate-500 tracking-wider">SIMBARA BPS KOTA PALU</span>
        </div>
      </div>
    </div>
  );
}
