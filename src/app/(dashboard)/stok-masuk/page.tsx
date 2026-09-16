"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Package,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  CheckCircle2,
  X,
  AlertTriangle,
  FileText,
  TrendingUp,
  PackageOpen,
  Trash2,
  Eye,
} from "lucide-react";

// ─── Interfaces ──────────────────────────────────────────────
interface MasterBarangOption {
  id: string;
  namaBarang: string;
  satuan: string;
}

interface BatchRow {
  id: string;
  noSuratBelanja: string;
  tanggalBelanja: string;
  hargaSatuan: number | string;
  qtyMasuk: number;
  sisaQty: number;
  createdAt: string;
  masterBarang: { namaBarang: string; satuan: string };
  pencatat: { nama: string };
}

interface StokMasukItem {
  masterBarangId: string;
  hargaSatuan: number | string;
  qtyMasuk: number | string;
}

export default function StokMasukPage() {
  const PAGE_SIZE = 10;

  // Data state
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [barangOptions, setBarangOptions] = useState<MasterBarangOption[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<{ totalStokMasukBulanIni: number; totalNilaiSisaFilterAktif?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterBarangId, setFilterBarangId] = useState("");
  const [appliedFilter, setAppliedFilter] = useState({
    search: "",
    startDate: "",
    endDate: "",
    masterBarangId: "",
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noSuratBelanja, setNoSuratBelanja] = useState("");
  const [tanggalBelanja, setTanggalBelanja] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<StokMasukItem[]>([{ masterBarangId: "", hargaSatuan: "", qtyMasuk: "" }]);
  
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ── Fetch Batches ──────────────────────────────────────
  const fetchBatches = useCallback(
    async (f: typeof appliedFilter, p: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (f.search) params.set("search", f.search);
        if (f.startDate) params.set("startDate", f.startDate);
        if (f.endDate) params.set("endDate", f.endDate);
        if (f.masterBarangId) params.set("masterBarangId", f.masterBarangId);
        params.set("page", String(p));
        params.set("pageSize", String(PAGE_SIZE));

        const res = await fetch(`/api/stok-masuk?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setBatches(json.data);
          setTotal(json.total);
          setTotalPages(json.totalPages);
          if (json.stats) setStats(json.stats);
        }
      } catch (e) {
        console.error("Fetch batches error:", e);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Fetch Barang Options (for dropdown) ────────────────
  const fetchBarangOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/master-barang");
      const json = await res.json();
      if (json.success) {
        setBarangOptions(
          json.data
            .filter((b: any) => b.isActive)
            .map((b: any) => ({ id: b.id, namaBarang: b.namaBarang, satuan: b.satuan }))
        );
      }
    } catch (e) {
      console.error("Fetch barang options error:", e);
    }
  }, []);

  useEffect(() => {
    fetchBatches(appliedFilter, page);
  }, [appliedFilter, page, fetchBatches]);

  useEffect(() => {
    fetchBarangOptions();
  }, [fetchBarangOptions]);

  // ── Filter Handlers ────────────────────────────────────
  const handleApplyFilter = () => {
    setPage(1);
    setAppliedFilter({ search, startDate, endDate, masterBarangId: filterBarangId });
  };

  const handleResetFilter = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setFilterBarangId("");
    setPage(1);
    setAppliedFilter({ search: "", startDate: "", endDate: "", masterBarangId: "" });
  };

  // ── Modal Handlers ─────────────────────────────────────
  const openModal = () => {
    setNoSuratBelanja("");
    setTanggalBelanja(new Date().toISOString().slice(0, 10));
    setItems([{ masterBarangId: "", hargaSatuan: "", qtyMasuk: "" }]);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormError("");
  };

  const handleAddItem = () => {
    setItems([...items, { masterBarangId: "", hargaSatuan: "", qtyMasuk: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof StokMasukItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // ── Submit Form ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!noSuratBelanja.trim() || !tanggalBelanja) {
      setFormError("No Surat Belanja dan Tanggal wajib diisi.");
      return;
    }

    if (items.length === 0) {
      setFormError("Minimal satu barang harus ditambahkan.");
      return;
    }

    const payloadItems = items.map((item, idx) => {
      const harga = Number(item.hargaSatuan);
      const qty = Number(item.qtyMasuk);

      if (!item.masterBarangId) throw new Error(`Barang pada baris ke-${idx + 1} belum dipilih.`);
      if (!harga || harga <= 0) throw new Error(`Harga satuan pada baris ke-${idx + 1} harus lebih dari 0.`);
      if (!qty || qty <= 0) throw new Error(`Qty pada baris ke-${idx + 1} harus lebih dari 0.`);

      return { masterBarangId: item.masterBarangId, hargaSatuan: harga, qtyMasuk: qty };
    });

    setIsSaving(true);

    try {
      const res = await fetch("/api/stok-masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noSuratBelanja,
          tanggalBelanja,
          items: payloadItems,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setFormError(json.error || "Terjadi kesalahan.");
        return;
      }

      closeModal();
      fetchBatches(appliedFilter, page);
    } catch (e: any) {
      setFormError(e.message || "Gagal menyimpan. Periksa koneksi Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Pagination helpers ─────────────────────────────────
  const startEntry = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endEntry = Math.min(page * PAGE_SIZE, total);

  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Makassar",
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Dashboard &rsaquo; Stok Masuk</p>
          <h1 className="text-2xl font-bold text-white">Pencatatan Stok Masuk</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Catat barang masuk berdasarkan Surat Belanja. Setiap pencatatan menjadi batch terpisah untuk FIFO.
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all"
        >
          <Plus size={16} />
          Catat Stok Masuk
        </button>
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
                placeholder="No surat / nama barang..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Filter Barang */}
          <div className="flex-none w-48 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Barang</label>
            <div className="relative">
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={filterBarangId}
                onChange={(e) => setFilterBarangId(e.target.value)}
                className="w-full pl-4 pr-9 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
              >
                <option value="">Semua Barang</option>
                {barangOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.namaBarang}
                  </option>
                ))}
              </select>
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
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">No Surat Belanja</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Barang</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Harga Satuan</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Qty Masuk</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Sisa Qty</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai Sisa (Rp)</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Dicatat Oleh</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0a2240]">
              {isLoading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-6 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-[#0f2b48] rounded ml-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-10 bg-[#0f2b48] rounded mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-10 bg-[#0f2b48] rounded mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-[#0f2b48] rounded ml-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-6 w-6 bg-[#0f2b48] rounded mx-auto" /></td>
                  </tr>
                ))
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <PackageOpen size={40} strokeWidth={1} />
                      <p className="text-sm font-medium">Belum ada data stok masuk</p>
                      <p className="text-xs">Klik &quot;Catat Stok Masuk&quot; untuk memulai</p>
                    </div>
                  </td>
                </tr>
              ) : (
                batches.map((b, idx) => {
                  const no = (page - 1) * PAGE_SIZE + idx + 1;
                  const usagePercent = b.qtyMasuk > 0 ? ((b.qtyMasuk - b.sisaQty) / b.qtyMasuk) * 100 : 0;
                  return (
                    <tr key={b.id} className="hover:bg-[#0a2240]/50 transition-colors">
                      <td className="px-5 py-4 text-sm text-slate-500 font-medium">{no}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-blue-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-200">{b.noSuratBelanja}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-300 font-medium">
                        {formatDate(b.tanggalBelanja)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Package size={13} className="text-slate-500 shrink-0" />
                          <span className="text-sm text-slate-300">{b.masterBarang.namaBarang}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-slate-300 font-medium">
                        {formatCurrency(b.hargaSatuan)}
                      </td>
                      <td className="px-5 py-4 text-center text-sm text-slate-300 font-medium">
                        {b.qtyMasuk} <span className="text-slate-500">{b.masterBarang.satuan}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-sm font-bold ${b.sisaQty === 0 ? "text-red-400" : "text-emerald-400"}`}>
                            {b.sisaQty}
                          </span>
                          {/* Usage bar */}
                          <div className="w-14 h-1.5 bg-[#0f2b48] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePercent >= 100 ? "bg-red-500" : usagePercent >= 50 ? "bg-orange-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-bold text-emerald-400">
                        {formatCurrency(Number(b.hargaSatuan) * b.sisaQty)}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">{b.pencatat.nama}</td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => window.location.href = `/stok-masuk/${b.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-950/50 transition-colors"
                          title="Lihat Detail Batch"
                        >
                          <Eye size={16} />
                        </button>
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

      {/* ── Stats Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Stok Masuk (Bulan Ini)</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {stats ? stats.totalStokMasukBulanIni.toLocaleString("id-ID") : "—"}
              <span className="text-sm font-normal text-slate-500 ml-1">unit</span>
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
            <FileText size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Batch (Filter Aktif)</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {total.toLocaleString("id-ID")}
              <span className="text-sm font-normal text-slate-500 ml-1">batch</span>
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400">
            <Package size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Nilai Sisa (Filter Aktif)</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {stats?.totalNilaiSisaFilterAktif !== undefined ? formatCurrency(stats.totalNilaiSisaFilterAktif) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal Form ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative w-full max-w-3xl mx-4 rounded-2xl bg-[#071a2e] border border-[#0f2b48] shadow-2xl shadow-black/50 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#0f2b48]">
              <div>
                <h2 className="text-lg font-bold text-white">Catat Stok Masuk Massal</h2>
                <p className="text-xs text-slate-400 mt-0.5">Input banyak barang sekaligus untuk 1 Nomor Surat Belanja.</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-[#0f2b48] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/40 text-sm text-red-300">
                  <AlertTriangle size={16} className="shrink-0 text-red-400" />
                  {formError}
                </div>
              )}

              {/* No Surat Belanja & Tanggal (Umum) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    No. Surat Belanja <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={noSuratBelanja}
                    onChange={(e) => setNoSuratBelanja(e.target.value)}
                    placeholder="SB-2026-001"
                    required
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tanggal Belanja <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={tanggalBelanja}
                    onChange={(e) => setTanggalBelanja(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              {/* Garis Pembatas */}
              <div className="border-t border-[#0f2b48]"></div>

              {/* Daftar Barang */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Daftar Barang <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Plus size={16} /> Tambah Baris
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-wrap sm:flex-nowrap gap-3 items-end p-4 rounded-xl bg-[#0a2240] border border-[#143550]">
                      {/* Barang Select */}
                      <div className="flex-1 min-w-[200px] space-y-1.5">
                        <label className="text-xs text-slate-400">Barang</label>
                        <div className="relative">
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                          <select
                            value={item.masterBarangId}
                            onChange={(e) => handleItemChange(index, "masterBarangId", e.target.value)}
                            required
                            className="w-full pl-4 pr-9 py-2 bg-[#041424] border border-[#0f2b48] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
                          >
                            <option value="">Pilih barang...</option>
                            {barangOptions.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.namaBarang} ({b.satuan})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Harga Satuan */}
                      <div className="w-full sm:w-32 space-y-1.5">
                        <label className="text-xs text-slate-400">Harga (Rp)</label>
                        <input
                          type="number"
                          value={item.hargaSatuan}
                          onChange={(e) => handleItemChange(index, "hargaSatuan", e.target.value)}
                          placeholder="Harga"
                          min={1}
                          required
                          className="w-full px-3 py-2 bg-[#041424] border border-[#0f2b48] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>

                      {/* Qty */}
                      <div className="w-full sm:w-24 space-y-1.5">
                        <label className="text-xs text-slate-400">Qty Masuk</label>
                        <input
                          type="number"
                          value={item.qtyMasuk}
                          onChange={(e) => handleItemChange(index, "qtyMasuk", e.target.value)}
                          placeholder="Qty"
                          min={1}
                          required
                          className="w-full px-3 py-2 bg-[#041424] border border-[#0f2b48] rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>

                      {/* Delete Button */}
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2.5 mb-0.5 rounded-lg text-slate-400 hover:bg-red-950/50 hover:text-red-400 transition-colors"
                          title="Hapus baris"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[#0f2b48] bg-[#0a2240]/50 gap-4">
              <div className="flex items-center gap-2 text-xs text-blue-300/80">
                <Package size={14} className="shrink-0 text-blue-400" />
                <span>Setiap baris barang akan menjadi <strong>batch terpisah</strong>.</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-transparent border border-[#143550] text-sm text-slate-400 hover:text-white hover:bg-[#143550] transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Simpan Stok Masuk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
