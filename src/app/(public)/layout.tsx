import React from "react";
import Link from "next/link";
import { Package } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Public Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-[#001D3D] tracking-tight">
              SIMBARA <span className="font-normal text-slate-400 mx-1">|</span> <span className="text-sm font-medium text-slate-600">BPS Kota Palu</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-slate-900 transition-colors">Lacak Permintaan</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Bantuan</a>
          </nav>

          <Link
            href="/login"
            className="text-sm font-medium text-white bg-[#001D3D] hover:bg-[#001D3D]/90 rounded-full px-5 py-2 transition-all"
          >
            Masuk Admin
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col py-12 px-4 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#001D3D]">SIMBARA</span>
            <span className="text-xs text-slate-500 mt-1">© 2026 BPS Kota Palu - Sistem Informasi Manajemen Barang & Aset (SIMBARA)</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#" className="hover:text-slate-900">Kebijakan Privasi</a>
            <a href="#" className="hover:text-slate-900">Kontak Kami</a>
            <a href="#" className="hover:text-slate-900">Portal BPS</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
