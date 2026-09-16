"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  FileSpreadsheet, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  X,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface RincianItem {
  namaBarang: string;
  satuan: string;
  qty: number;
}

interface PegawaiRekap {
  id: string;
  nama: string;
  unitKerja: string;
  totalItems: number;
  rincian: RincianItem[];
}

export default function LaporanRekapPegawaiPage() {
  const [data, setData] = useState<PegawaiRekap[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isExporting, setIsExporting] = useState(false);

  // Modal State
  const [selectedPegawai, setSelectedPegawai] = useState<PegawaiRekap | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, startDate, endDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "10",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/laporan/rekap-pegawai?${params}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/laporan/rekap-pegawai/export?${params}`);
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `rekap-pegawai-${startDate || "all"}-to-${endDate || "all"}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (error) {
      console.error("Export error:", error);
      alert("Gagal mengekspor data.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2">
          <Link href="/laporan" className="hover:text-blue-400 transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Kembali ke Laporan
          </Link>
          <span>&bull;</span>
          <span>Rekap Pegawai</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Laporan Rekap Pengambilan per Pegawai</h1>
            <p className="text-sm text-slate-400 mt-1">
              Pantau total dan rincian Persediaan yang telah diambil oleh setiap pegawai
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-600/20 transition-all text-sm"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Export Excel
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="bg-[#071a2e] border border-[#0f2b48] rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama pegawai..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <span className="text-slate-500 text-sm">s.d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="bg-[#071a2e] border border-[#0f2b48] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0a2240] border-b border-[#0f2b48] text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Pegawai</th>
                <th className="px-6 py-4 font-semibold">Unit/Bidang</th>
                <th className="px-6 py-4 font-semibold text-center">Total Item Diambil</th>
                <th className="px-6 py-4 font-semibold text-center">Rincian Barang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0f2b48]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-3" />
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data pengambilan Persediaan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-[#0a2240]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{row.nama}</td>
                    <td className="px-6 py-4">{row.unitKerja}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {row.totalItems} item
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedPegawai(row)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#143550] hover:bg-[#1a4365] px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye size={14} /> Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ────────────────────────────────────── */}
        {!isLoading && totalPages > 0 && (
          <div className="px-6 py-4 border-t border-[#0f2b48] flex items-center justify-between bg-[#0a2240]/50">
            <span className="text-sm text-slate-400">
              Menampilkan <span className="font-medium text-white">{data.length}</span> dari{" "}
              <span className="font-medium text-white">{total}</span> pegawai
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-[#143550] text-slate-400 hover:text-white hover:bg-[#143550] disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-slate-300 px-2">
                Hal {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-[#143550] text-slate-400 hover:text-white hover:bg-[#143550] disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Detail ───────────────────────────────────── */}
      {selectedPegawai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#071a2e] border border-[#0f2b48] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#0f2b48]">
              <div>
                <h3 className="text-lg font-bold text-white">Rincian Pengambilan Persediaan</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedPegawai.nama}</p>
              </div>
              <button
                onClick={() => setSelectedPegawai(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {selectedPegawai.rincian.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-[#0a2240] border border-[#143550]">
                    <div className="font-medium text-sm text-slate-200">{item.namaBarang}</div>
                    <div className="text-sm font-bold text-blue-400">
                      {item.qty} <span className="text-xs font-medium text-slate-500">{item.satuan}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 border-t border-[#0f2b48] bg-[#0a2240]/50 rounded-b-2xl flex justify-between items-center">
              <span className="text-sm text-slate-400">Total Semua Item:</span>
              <span className="text-lg font-bold text-white">{selectedPegawai.totalItems}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
