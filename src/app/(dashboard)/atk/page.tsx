"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Download,
  Search,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ClipboardList,
  Package,
  User,
} from "lucide-react";

const UNIT_KERJA = [
  "Subbagian Umum",
  "Fungsi Statistik Sosial",
  "Fungsi Statistik Produksi",
  "Fungsi Statistik Distribusi",
  "Fungsi IPDS (Integrasi Pengolahan & Diseminasi Statistik)",
  "Fungsi Neraca Wilayah & Analisis Statistik",
];

interface TransaksiRow {
  id: string;
  namaPegawai: string;
  unitKerja: string;
  tanggal: string;
  items: { namaBarang: string; qty: number; satuan: string }[];
}

interface ApiResponse {
  success: boolean;
  data: TransaksiRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats?: { totalBulanIni: number };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-blue-600", "bg-violet-600", "bg-emerald-600",
  "bg-orange-500", "bg-rose-600", "bg-cyan-600",
];

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function shortUnitKerja(unit: string) {
  if (unit.includes("Umum")) return "Umum";
  if (unit.includes("Sosial")) return "Sosial";
  if (unit.includes("Produksi")) return "Produksi";
  if (unit.includes("Distribusi")) return "Distribusi";
  if (unit.includes("IPDS")) return "IPDS";
  if (unit.includes("Neraca")) return "Neraca";
  return unit.slice(0, 8);
}

export default function RiwayatAtkPage() {
  // ── Filter State ──
  const [namaPegawai, setNamaPegawai] = useState("");
  const [unitKerja, setUnitKerja] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // ── Data State ──
  const [data, setData] = useState<TransaksiRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<{ totalBulanIni: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // ── Active filter (applied) ──
  const [appliedFilter, setAppliedFilter] = useState({
    namaPegawai: "",
    unitKerja: "",
    startDate: "",
    endDate: "",
  });

  const buildQueryString = useCallback(
    (f: typeof appliedFilter, p: number) => {
      const params = new URLSearchParams();
      if (f.namaPegawai) params.set("namaPegawai", f.namaPegawai);
      if (f.unitKerja) params.set("unitKerja", f.unitKerja);
      if (f.startDate) params.set("startDate", f.startDate);
      if (f.endDate) params.set("endDate", f.endDate);
      params.set("page", String(p));
      params.set("pageSize", String(PAGE_SIZE));
      return params.toString();
    },
    []
  );

  const fetchData = useCallback(
    async (f: typeof appliedFilter, p: number) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/transaksi-atk?${buildQueryString(f, p)}`);
        const json: ApiResponse = await res.json();
        if (json.success) {
          setData(json.data);
          setTotal(json.total);
          setTotalPages(json.totalPages);
          if (json.stats) setStats(json.stats);
        }
      } catch (e) {
        console.error("Fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    [buildQueryString]
  );

  useEffect(() => {
    fetchData(appliedFilter, page);
  }, [appliedFilter, page, fetchData]);

  const handleApplyFilter = () => {
    setPage(1);
    setAppliedFilter({ namaPegawai, unitKerja, startDate, endDate });
  };

  const handleReset = () => {
    setNamaPegawai("");
    setUnitKerja("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setAppliedFilter({ namaPegawai: "", unitKerja: "", startDate: "", endDate: "" });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (appliedFilter.namaPegawai) params.set("namaPegawai", appliedFilter.namaPegawai);
      if (appliedFilter.unitKerja) params.set("unitKerja", appliedFilter.unitKerja);
      if (appliedFilter.startDate) params.set("startDate", appliedFilter.startDate);
      if (appliedFilter.endDate) params.set("endDate", appliedFilter.endDate);

      // Menggunakan endpoint export khusus yang menghasilkan file .xlsx
      const res = await fetch(`/api/transaksi-atk/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export gagal");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisp = res.headers.get("Content-Disposition") || "";
      const fileNameMatch = contentDisp.match(/filename="(.+)"/);
      a.download = fileNameMatch ? fileNameMatch[1] : `riwayat-atk.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  const startEntry = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Dashboard &rsaquo; Log ATK</p>
          <h1 className="text-2xl font-bold text-white">Riwayat Pengambilan ATK</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Pantau aktivitas distribusi Alat Tulis Kantor secara real-time.
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-orange-500/25 transition-all"
        >
          <Download size={16} />
          {isExporting ? "Mengekspor..." : "Export Excel"}
        </button>
      </div>

      {/* Filter Card */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5">
        <div className="flex flex-nowrap gap-3 items-end overflow-x-auto">
          {/* Nama Pegawai */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Pegawai</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={namaPegawai}
                onChange={(e) => setNamaPegawai(e.target.value)}
                placeholder="Cari nama..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
              />
            </div>
          </div>

          {/* Rentang Tanggal */}
          <div className="flex-none space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rentang Tanggal</label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <CalendarRange size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[155px] pl-9 pr-2 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <span className="text-slate-500 text-xs font-medium shrink-0">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[155px] px-3 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          {/* Unit/Bidang */}
          <div className="flex-1 min-w-[160px] space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unit / Bidang</label>
            <div className="relative">
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value)}
                className="w-full pl-4 pr-9 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
              >
                <option value="">Semua Bidang</option>
                {UNIT_KERJA.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0 pt-[22px]">
            <button
              onClick={handleApplyFilter}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              <Search size={14} />
              Terapkan Filter
            </button>
            <button
              onClick={handleReset}
              title="Reset filter"
              className="p-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0f2b48]">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">No</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Pegawai</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Unit / Bidang</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Barang</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Total Item</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0a2240]">
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-6 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 bg-[#0f2b48] rounded-full" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-40 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-10 bg-[#0f2b48] rounded" /></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <ClipboardList size={40} strokeWidth={1} />
                      <p className="text-sm font-medium">Tidak ada data transaksi</p>
                      <p className="text-xs">Coba ubah atau reset filter Anda</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const no = (page - 1) * PAGE_SIZE + idx + 1;
                  const tanggal = new Date(row.tanggal).toLocaleDateString("id-ID", {
                    day: "2-digit", month: "short", year: "numeric",
                    timeZone: "Asia/Makassar",
                  });
                  const waktu = new Date(row.tanggal).toLocaleTimeString("id-ID", {
                    hour: "2-digit", minute: "2-digit",
                    timeZone: "Asia/Makassar",
                  });
                  const totalItem = row.items.reduce((s, it) => s + it.qty, 0);
                  const firstTwo = row.items.slice(0, 2);
                  const extra = row.items.length - 2;

                  return (
                    <tr key={row.id + idx} className="hover:bg-[#0a2240]/50 transition-colors group">
                      <td className="px-5 py-4 text-sm text-slate-500 font-medium">{no}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(row.namaPegawai)}`}>
                            {getInitials(row.namaPegawai)}
                          </div>
                          <span className="text-sm font-semibold text-slate-200">{row.namaPegawai}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-slate-300 font-medium">{tanggal}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{waktu}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-600/30">
                          {shortUnitKerja(row.unitKerja)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {firstTwo.map((it, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs text-slate-400 bg-[#0f2b48] px-2 py-1 rounded-lg">
                              <Package size={11} className="text-slate-500" />
                              {it.namaBarang}
                              <span className="text-slate-500">({it.qty})</span>
                            </span>
                          ))}
                          {extra > 0 && (
                            <span className="inline-flex items-center text-xs text-blue-400 bg-blue-600/10 border border-blue-600/20 px-2 py-1 rounded-lg font-semibold">
                              +{extra}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-slate-200">{totalItem}</span>
                        <span className="text-xs text-slate-500 ml-1">item</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#0f2b48]">
          <p className="text-xs text-slate-500">
            Menampilkan <span className="text-slate-300 font-semibold">{startEntry}–{endEntry}</span> dari{" "}
            <span className="text-slate-300 font-semibold">{total}</span> entri
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-[#0f2b48] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i < 5 ? i + 1 : i === 5 ? -1 : totalPages;
              } else if (page >= totalPages - 3) {
                p = i === 0 ? 1 : i === 1 ? -1 : totalPages - (6 - i);
              } else {
                p = i === 0 ? 1 : i === 1 ? -1 : i === 5 ? -2 : i === 6 ? totalPages : page + (i - 3);
              }

              if (p < 0) {
                return <span key={i} className="px-1 text-slate-600 text-sm">…</span>;
              }

              return (
                <button
                  key={i}
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                    page === p
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-slate-400 hover:bg-[#0f2b48] hover:text-white"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-[#0f2b48] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Penarikan (Bulan Ini)</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {stats ? stats.totalBulanIni.toLocaleString("id-ID") : "—"}
              <span className="text-sm font-normal text-slate-500 ml-1">Transaksi</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Package size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Entri (Filter Aktif)</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {total.toLocaleString("id-ID")}
              <span className="text-sm font-normal text-slate-500 ml-1">Pengambilan</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
