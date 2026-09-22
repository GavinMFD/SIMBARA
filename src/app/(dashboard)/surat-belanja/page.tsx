"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  PackageOpen,
  RefreshCw,
  FolderOpen,
  CalendarDays,
  FileText
} from "lucide-react";

interface SuratBelanja {
  noSuratBelanja: string;
  tanggalBelanja: string;
  totalQty: number;
  totalNominal: number;
  totalItems: number;
}

export default function SuratBelanjaPage() {
  const [data, setData] = useState<SuratBelanja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/surat-belanja", window.location.origin);
      if (search) url.searchParams.set("search", search);
      
      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error("Fetch SB error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Dashboard &rsaquo; Surat Belanja</p>
          <h1 className="text-2xl font-bold text-white">Riwayat Penerimaan</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Daftar riwayat dokumen penerimaan Aset Tetap dan Barang Persediaan.
          </p>
        </div>
        <Link
          href="/surat-belanja/tambah"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all shrink-0 whitespace-nowrap"
        >
          <Plus size={16} />
          Input Surat Belanja
        </Link>
      </div>

      {/* ── Search ──────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end w-full">
          <div className="flex-1 w-full sm:w-auto min-w-0 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cari No. Dokumen</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ketik Nomor Surat Belanja..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setSearch(""); setTimeout(fetchData, 100); }}
            title="Reset filter"
            className="p-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </form>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0f2b48]">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">No</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">No Surat Belanja</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Total Jenis Barang</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kuantitas</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0a2240]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-6 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-40 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-[#0f2b48] rounded mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-[#0f2b48] rounded mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-[#0f2b48] rounded ml-auto" /></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <FolderOpen size={40} strokeWidth={1} />
                      <p className="text-sm font-medium">
                        {search ? "Tidak ada dokumen yang cocok" : "Belum ada data Surat Belanja"}
                      </p>
                      <p className="text-xs">
                        {search ? "Coba ubah kata pencarian" : 'Klik "Input Surat Belanja" untuk memulai'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.noSuratBelanja + idx} className="hover:bg-[#0a2240]/50 transition-colors group">
                    <td className="px-5 py-4 text-sm text-slate-500 font-medium">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                          <FileText size={14} />
                        </div>
                        <span className="text-sm font-semibold text-slate-200">{item.noSuratBelanja}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <CalendarDays size={14} className="text-slate-500" />
                        {formatDate(item.tanggalBelanja)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700/30 text-slate-300">
                        {item.totalItems} Jenis
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-semibold text-slate-300">
                      {item.totalQty}
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-bold text-emerald-400">
                      Rp {item.totalNominal.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#0f2b48]">
          <p className="text-xs text-slate-500">
            Menampilkan <span className="text-slate-300 font-semibold">{data.length}</span> dokumen
          </p>
        </div>
      </div>
    </div>
  );
}
