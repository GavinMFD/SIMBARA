import React from "react";
import Link from "next/link";
import { Package } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#020b14] bg-grid-dots text-slate-300">
      {/* Public Header */}
      <header className="border-b border-border bg-[#030d1a]/85 backdrop-blur px-6 py-4 sticky top-0 z-55">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Package className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-wider leading-none">
                SIMBARA
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-widest mt-0.5">
                KOTA PALU • LAYANAN PEGAWAI
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="text-xs font-bold text-slate-400 hover:text-white border border-border/60 rounded-lg px-3 py-1.5 hover:bg-slate-800 transition-all"
          >
            Admin Console
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col py-10 px-4 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-border bg-[#030d1a]/40 py-6 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
          <span>© 2026 Badan Pusat Statistik (BPS) Kota Palu</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-slate-300">Panduan Penggunaan</a>
            <span className="text-slate-700">|</span>
            <a href="#" className="hover:text-slate-300">Kontak Admin BMN</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
