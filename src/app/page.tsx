import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ClipboardEdit, LogIn, ArrowRight, ShieldCheck, Box, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020b14] bg-grid-dots text-slate-200 font-sans selection:bg-blue-500/30">
      {/* ── HEADER / NAVBAR ── */}
      <header className="absolute top-0 left-0 w-full flex items-center justify-between px-6 md:px-12 py-6 z-50">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-sipandai.png"
            alt="Logo SIPANDAI"
            width={40}
            height={40}
            className="rounded-lg shadow-lg shadow-blue-500/20"
          />
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white leading-none">SIPANDAI</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">BPS Kota Palu</p>
          </div>
        </div>
        
        <Link 
          href="/login"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-sm font-semibold text-white backdrop-blur-sm border border-slate-700 transition-all shadow-lg hover:shadow-xl"
        >
          <LogIn size={16} />
          <span className="hidden sm:inline">Login Admin</span>
        </Link>
      </header>

      {/* ── HERO SECTION ── */}
      <main className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-12 overflow-hidden text-center">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Portal Pegawai SIPANDAI
          </div>
          
          <h2 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 tracking-tight">
            Sistem Informasi <br className="hidden md:block" /> Manajemen BMN Terpadu
          </h2>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Platform digital terintegrasi untuk pendataan, pelacakan mutasi, dan pengelolaan persediaan aset negara di lingkungan BPS Kota Palu.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/permintaan"
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-500/40 hover:-translate-y-1 w-full sm:w-auto justify-center"
            >
              <ClipboardEdit size={22} />
              Form Permintaan Barang
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── FEATURES GRID ── */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto text-left w-full">
          <div className="p-6 rounded-3xl bg-[#071a2e]/60 border border-[#0f2b48] backdrop-blur-sm">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-4">
              <Box size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Manajemen Inventaris</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Pencatatan aset tetap dengan NUP otomatis dan pelacakan kondisi secara real-time.</p>
          </div>
          <div className="p-6 rounded-3xl bg-[#071a2e]/60 border border-[#0f2b48] backdrop-blur-sm">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
              <ClipboardEdit size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Alur Persediaan FIFO</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Distribusi barang persediaan dengan algoritma FIFO untuk mencegah selisih stok.</p>
          </div>
          <div className="p-6 rounded-3xl bg-[#071a2e]/60 border border-[#0f2b48] backdrop-blur-sm">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Keamanan & RBAC</h3>
            <p className="text-sm text-slate-400 leading-relaxed">Hak akses yang disesuaikan untuk Super Admin, Admin Console, dan Karyawan.</p>
          </div>
        </div>
      </main>
      
      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-6 border-t border-[#0f2b48] text-center">
        <p className="text-xs text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} BPS Kota Palu. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
