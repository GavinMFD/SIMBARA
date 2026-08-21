"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Package,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Eye,
  PackageOpen,
  Tags,
  DoorOpen,
  Hash,
  Shield,
  Download,
} from "lucide-react";

// ─── Interfaces ──────────────────────────────────────────────
interface MasterAsetRow {
  id: string;
  nup: string;
  kondisi: string;
  statusAset: string;
  createdAt: string;
  batchPembelian: {
    namaAset: string;
    merekTipe: string | null;
    hargaSatuan: number | string;
    noSuratBelanja: string;
    kategori: { namaKategori: string };
  };
  ruangan: {
    kodeRuangan: string;
    namaRuangan: string;
  };
}

interface KategoriOption {
  id: string;
  namaKategori: string;
}

interface RuanganOption {
  id: string;
  kodeRuangan: string;
  namaRuangan: string;
}

const KONDISI_LABELS: Record<string, { label: string; color: string }> = {
  baik: { label: "Baik", color: "bg-emerald-500/15 text-emerald-400" },
  rusak_ringan: { label: "Rusak Ringan", color: "bg-amber-500/15 text-amber-400" },
  rusak_berat: { label: "Rusak Berat", color: "bg-red-500/15 text-red-400" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aktif: { label: "Aktif", color: "bg-emerald-500/15 text-emerald-400" },
  non_aktif: { label: "Non-Aktif", color: "bg-red-500/15 text-red-400" },
};

export default function DaftarAsetPage() {
  const PAGE_SIZE = 10;

  // Data state
  const [asetList, setAsetList] = useState<MasterAsetRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  const [filterRuangan, setFilterRuangan] = useState("");
  const [filterKondisi, setFilterKondisi] = useState("");
  const [appliedFilter, setAppliedFilter] = useState({
    search: "",
    kategoriAsetId: "",
    ruanganId: "",
    kondisi: "",
  });

  // Options
  const [kategoriOptions, setKategoriOptions] = useState<KategoriOption[]>([]);
  const [ruanganOptions, setRuanganOptions] = useState<RuanganOption[]>([]);

  // ── Fetch data ─────────────────────────────────────────────
  const fetchAset = useCallback(
    async (f: typeof appliedFilter, p: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (f.search) params.set("search", f.search);
        if (f.kategoriAsetId) params.set("kategoriAsetId", f.kategoriAsetId);
        if (f.ruanganId) params.set("ruanganId", f.ruanganId);
        if (f.kondisi) params.set("kondisi", f.kondisi);
        params.set("page", String(p));
        params.set("pageSize", String(PAGE_SIZE));

        const res = await fetch(`/api/barang?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setAsetList(json.data);
          setTotal(json.total);
          setTotalPages(json.totalPages);
        }
      } catch (e) {
        console.error("Fetch aset error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchOptions = useCallback(async () => {
    try {
      const [katRes, ruanganRes] = await Promise.all([
        fetch("/api/kategori"),
        fetch("/api/ruangan"),
      ]);
      const [katJson, ruanganJson] = await Promise.all([
        katRes.json(),
        ruanganRes.json(),
      ]);
      if (katJson.success) setKategoriOptions(katJson.data);
      if (ruanganJson.success) setRuanganOptions(ruanganJson.data);
    } catch (e) {
      console.error("Fetch options error:", e);
    }
  }, []);

  useEffect(() => {
    fetchAset(appliedFilter, page);
  }, [appliedFilter, page, fetchAset]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // ── Filter handlers ────────────────────────────────────────
  const handleApplyFilter = () => {
    setPage(1);
    setAppliedFilter({
      search,
      kategoriAsetId: filterKategori,
      ruanganId: filterRuangan,
      kondisi: filterKondisi,
    });
  };

  const handleResetFilter = () => {
    setSearch("");
    setFilterKategori("");
    setFilterRuangan("");
    setFilterKondisi("");
    setPage(1);
    setAppliedFilter({ search: "", kategoriAsetId: "", ruanganId: "", kondisi: "" });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (appliedFilter.search) params.set("search", appliedFilter.search);
      if (appliedFilter.kategoriAsetId) params.set("kategoriAsetId", appliedFilter.kategoriAsetId);
      if (appliedFilter.ruanganId) params.set("ruanganId", appliedFilter.ruanganId);
      if (appliedFilter.kondisi) params.set("kondisi", appliedFilter.kondisi);

      const res = await fetch(`/api/barang/export?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengekspor data");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Data_Aset_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Terjadi kesalahan saat mengekspor data.");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Pagination ─────────────────────────────────────────────
  const startEntry = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, total);

  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Dashboard &rsaquo; Aset Tetap</p>
          <h1 className="text-2xl font-bold text-white">Inventaris Aset Tetap</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Daftar seluruh unit aset tetap dengan NUP masing-masing. Setiap baris = 1 unit fisik.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f2b48] hover:bg-[#143550] text-white text-sm font-semibold border border-[#1a4163] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Ekspor CSV
          </button>
          <Link
            href="/barang/tambah"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff7e47] hover:bg-[#e06833] text-white text-sm font-semibold shadow-lg shadow-[#ff7e47]/25 transition-all"
          >
            <Plus size={16} />
            Pendataan Baru
          </Link>
        </div>
      </div>

      {/* ── Filter Card ─────────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5">
        <div className="flex flex-nowrap gap-3 items-end overflow-x-auto">
          {/* Search */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cari</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
                placeholder="NUP / nama aset..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Kategori */}
          <div className="flex-none w-44 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kategori</label>
            <div className="relative">
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="w-full pl-4 pr-9 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
              >
                <option value="">Semua</option>
                {kategoriOptions.map((k) => (
                  <option key={k.id} value={k.id}>{k.namaKategori}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ruangan */}
          <div className="flex-none w-44 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ruangan</label>
            <div className="relative">
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={filterRuangan}
                onChange={(e) => setFilterRuangan(e.target.value)}
                className="w-full pl-4 pr-9 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
              >
                <option value="">Semua</option>
                {ruanganOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.namaRuangan}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kondisi */}
          <div className="flex-none w-40 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kondisi</label>
            <div className="relative">
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={filterKondisi}
                onChange={(e) => setFilterKondisi(e.target.value)}
                className="w-full pl-4 pr-9 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
              >
                <option value="">Semua</option>
                <option value="baik">Baik</option>
                <option value="rusak_ringan">Rusak Ringan</option>
                <option value="rusak_berat">Rusak Berat</option>
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
              Terapkan
            </button>
            <button
              onClick={handleResetFilter}
              title="Reset filter"
              className="p-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0f2b48]">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">No</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">NUP</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Aset</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ruangan</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Harga</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Kondisi</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0a2240]">
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-6 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-36 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-[#0f2b48] rounded ml-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-[#0f2b48] rounded mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-[#0f2b48] rounded mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-8 bg-[#0f2b48] rounded mx-auto" /></td>
                  </tr>
                ))
              ) : asetList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <PackageOpen size={40} strokeWidth={1} />
                      <p className="text-sm font-medium">Belum ada data aset tetap</p>
                      <p className="text-xs">Klik &quot;Pendataan Baru&quot; untuk memulai</p>
                    </div>
                  </td>
                </tr>
              ) : (
                asetList.map((a, idx) => {
                  const no = (page - 1) * PAGE_SIZE + idx + 1;
                  const kondisiInfo = KONDISI_LABELS[a.kondisi] || { label: a.kondisi, color: "bg-slate-700/30 text-slate-400" };
                  const statusInfo = STATUS_LABELS[a.statusAset] || { label: a.statusAset, color: "bg-slate-700/30 text-slate-400" };

                  return (
                    <tr key={a.id} className="hover:bg-[#0a2240]/50 transition-colors group">
                      <td className="px-5 py-4 text-sm text-slate-500 font-medium">{no}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Hash size={13} className="text-blue-400 shrink-0" />
                          <span className="text-sm font-bold text-blue-300 font-mono">{a.nup}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{a.batchPembelian.namaAset}</p>
                          {a.batchPembelian.merekTipe && (
                            <p className="text-xs text-slate-500 mt-0.5">{a.batchPembelian.merekTipe}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Tags size={12} className="text-slate-500" />
                          <span className="text-sm text-slate-300">{a.batchPembelian.kategori.namaKategori}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <DoorOpen size={12} className="text-slate-500" />
                          <span className="text-sm text-slate-300">{a.ruangan.namaRuangan}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-slate-300 font-medium">
                        {formatCurrency(a.batchPembelian.hargaSatuan)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${kondisiInfo.color}`}>
                          {kondisiInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <Link
                          href={`/barang/${a.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-blue-500/15 hover:text-blue-400 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={15} />
                        </Link>
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
            <span className="text-slate-300 font-semibold">{total}</span> unit aset
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

      {/* ── Stats Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
            <Package size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Unit Aset</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {total.toLocaleString("id-ID")}
              <span className="text-sm font-normal text-slate-500 ml-1">unit</span>
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Shield size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Kondisi Baik</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {asetList.filter((a) => a.kondisi === "baik").length}
              <span className="text-sm font-normal text-slate-500 ml-1">dari halaman ini</span>
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400">
            <Tags size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Kategori Terdaftar</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {kategoriOptions.length}
              <span className="text-sm font-normal text-slate-500 ml-1">kategori</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
