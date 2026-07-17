"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Edit3,
  Trash2,
  X,
  ChevronDown,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Box,
} from "lucide-react";

// ─── Interfaces ──────────────────────────────────────────────
interface KategoriBarang {
  id: string;
  namaKategori: string;
}

interface MasterBarangRow {
  id: string;
  namaBarang: string;
  satuan: string;
  stokMinimum: number;
  stokAktual: number;
  isActive: boolean;
  createdAt: string;
  kategori: { id: string; namaKategori: string };
  totalStok: number;
  isLowStock: boolean;
}

interface FormData {
  namaBarang: string;
  satuan: string;
  kategoriBarangId: string;
  stokMinimum: number;
  stokAktual: number | string;
}

const INITIAL_FORM: FormData = {
  namaBarang: "",
  satuan: "",
  kategoriBarangId: "",
  stokMinimum: 5,
  stokAktual: 0,
};

// ─── Main Page Component ─────────────────────────────────────
export default function MasterBarangPage() {
  // Data state
  const [barangList, setBarangList] = useState<MasterBarangRow[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriBarang[]>([]);
  const [lowStockItems, setLowStockItems] = useState<MasterBarangRow[]>([]);
  const [stats, setStats] = useState<{ totalBarang: number; lowStockCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStok, setEditingStok] = useState<{ totalStok: number; satuan: string } | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Kategori inline add
  const [showNewKategori, setShowNewKategori] = useState(false);
  const [newKategoriNama, setNewKategoriNama] = useState("");
  const [isAddingKategori, setIsAddingKategori] = useState(false);

  // ── Fetch Master Barang ────────────────────────────────
  const fetchBarang = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/master-barang?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setBarangList(json.data);
        setStats(json.stats);
        setLowStockItems(json.data.filter((b: MasterBarangRow) => b.isLowStock && b.isActive));
      }
    } catch (e) {
      console.error("Fetch barang error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Fetch Kategori ─────────────────────────────────────
  const fetchKategori = useCallback(async () => {
    try {
      const res = await fetch("/api/kategori-barang");
      const json = await res.json();
      if (json.success) setKategoriList(json.data);
    } catch (e) {
      console.error("Fetch kategori error:", e);
    }
  }, []);

  useEffect(() => {
    fetchBarang(appliedSearch);
    fetchKategori();
  }, [appliedSearch, fetchBarang, fetchKategori]);

  // ── Handlers ───────────────────────────────────────────
  const handleSearch = () => setAppliedSearch(search);
  const handleResetSearch = () => { setSearch(""); setAppliedSearch(""); };

  const openAddModal = () => {
    setEditingId(null);
    setEditingStok(null);
    setFormData(INITIAL_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (b: MasterBarangRow) => {
    setEditingId(b.id);
    setEditingStok({ totalStok: b.totalStok, satuan: b.satuan });
    setFormData({
      namaBarang: b.namaBarang,
      satuan: b.satuan,
      kategoriBarangId: b.kategori.id,
      stokMinimum: b.stokMinimum,
      stokAktual: b.stokAktual,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setEditingStok(null);
    setFormData(INITIAL_FORM);
    setFormError("");
    setShowNewKategori(false);
    setNewKategoriNama("");
  };

  // ── Submit Form ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      const url = editingId ? `/api/master-barang/${editingId}` : "/api/master-barang";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...formData,
        stokAktual: formData.stokAktual === "" ? 0 : Number(formData.stokAktual),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        setFormError(json.error || "Terjadi kesalahan.");
        return;
      }

      closeModal();
      fetchBarang(appliedSearch);
    } catch (e) {
      setFormError("Gagal menyimpan. Periksa koneksi Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle Active ──────────────────────────────────────
  const handleToggleActive = async (id: string) => {
    try {
      const res = await fetch(`/api/master-barang/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchBarang(appliedSearch);
    } catch (e) {
      console.error("Toggle active error:", e);
    }
  };

  // ── Add Kategori Inline ────────────────────────────────
  const handleAddKategori = async () => {
    if (!newKategoriNama.trim()) return;
    setIsAddingKategori(true);
    try {
      const res = await fetch("/api/kategori-barang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaKategori: newKategoriNama.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchKategori();
        setFormData((prev) => ({ ...prev, kategoriBarangId: json.data.id }));
        setShowNewKategori(false);
        setNewKategoriNama("");
      } else {
        setFormError(json.error || "Gagal menambah kategori.");
      }
    } catch (e) {
      setFormError("Gagal menambah kategori.");
    } finally {
      setIsAddingKategori(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Dashboard &rsaquo; Kelola Barang ATK</p>
          <h1 className="text-2xl font-bold text-white">Master Barang ATK</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Kelola daftar barang persediaan ATK dan pantau stok minimum.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all"
        >
          <Plus size={16} />
          Tambah Barang
        </button>
      </div>

      {/* ── Low-Stock Alert Banner ──────────────────────── */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-red-950/40 to-orange-950/30 border border-red-800/40 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-300">Low-Stock Alert</h3>
              <p className="text-xs text-red-400/80">{lowStockItems.length} barang di bawah stok minimum</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/50 border border-red-800/30"
              >
                <Package size={14} className="text-red-400 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-red-200">{item.namaBarang}</span>
                  <span className="text-xs text-red-400 ml-2">
                    {item.totalStok}/{item.stokMinimum} {item.satuan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Search / Filter Bar ─────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5">
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cari Barang</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Nama barang..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20"
            >
              <Search size={14} />
              Cari
            </button>
            <button
              onClick={handleResetSearch}
              title="Reset"
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
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Barang</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Satuan</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stok Min</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stok Aktual</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0a2240]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-6 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-12 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-10 bg-[#0f2b48] rounded mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-10 bg-[#0f2b48] rounded mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-5 w-16 bg-[#0f2b48] rounded-full mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-[#0f2b48] rounded mx-auto" /></td>
                  </tr>
                ))
              ) : barangList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <Box size={40} strokeWidth={1} />
                      <p className="text-sm font-medium">Belum ada data barang</p>
                      <p className="text-xs">Klik &quot;Tambah Barang&quot; untuk memulai</p>
                    </div>
                  </td>
                </tr>
              ) : (
                barangList.map((b, idx) => (
                  <tr key={b.id} className={`hover:bg-[#0a2240]/50 transition-colors ${!b.isActive ? "opacity-50" : ""}`}>
                    <td className="px-5 py-4 text-sm text-slate-500 font-medium">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                          <Package size={14} />
                        </div>
                        <span className="text-sm font-semibold text-slate-200">{b.namaBarang}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-600/20 text-violet-400 border border-violet-600/30">
                        {b.kategori.namaKategori}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">{b.satuan}</td>
                    <td className="px-5 py-4 text-center text-sm text-slate-400 font-medium">{b.stokMinimum}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-sm font-bold ${b.isLowStock ? "text-red-400" : "text-emerald-400"}`}>
                        {b.totalStok}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {!b.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-600/20 text-slate-400 border border-slate-600/30">
                          Nonaktif
                        </span>
                      ) : b.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600/20 text-red-400 border border-red-600/30">
                          <AlertTriangle size={11} />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
                          <CheckCircle2 size={11} />
                          Aman
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(b)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
                              handleToggleActive(b.id);
                            }
                          }}
                          title="Hapus"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
            <Package size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Jenis Barang</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {stats?.totalBarang ?? "—"}
              <span className="text-sm font-normal text-slate-500 ml-1">item</span>
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            stats && stats.lowStockCount > 0 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Barang Low-Stock</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {stats?.lowStockCount ?? "—"}
              <span className="text-sm font-normal text-slate-500 ml-1">perlu restock</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal Form ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-[#071a2e] border border-[#0f2b48] shadow-2xl shadow-black/50 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#0f2b48]">
              <h2 className="text-lg font-bold text-white">
                {editingId ? "Edit Barang" : "Tambah Barang Baru"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-[#0f2b48] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/40 text-sm text-red-300">
                  <AlertTriangle size={16} className="shrink-0 text-red-400" />
                  {formError}
                </div>
              )}

              {/* Nama Barang */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Nama Barang <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.namaBarang}
                  onChange={(e) => setFormData((f) => ({ ...f, namaBarang: e.target.value }))}
                  placeholder="Contoh: Kertas HVS A4"
                  required
                  className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Kategori */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Kategori <span className="text-red-400">*</span>
                </label>
                {!showNewKategori ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <select
                        value={formData.kategoriBarangId}
                        onChange={(e) => setFormData((f) => ({ ...f, kategoriBarangId: e.target.value }))}
                        required
                        className="w-full pl-4 pr-9 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
                      >
                        <option value="">Pilih kategori...</option>
                        {kategoriList.map((k) => (
                          <option key={k.id} value={k.id}>{k.namaKategori}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNewKategori(true)}
                      className="px-3 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-colors text-xs font-semibold whitespace-nowrap"
                    >
                      + Baru
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newKategoriNama}
                      onChange={(e) => setNewKategoriNama(e.target.value)}
                      placeholder="Nama kategori baru..."
                      className="flex-1 px-4 py-2.5 bg-[#0a2240] border border-blue-500/50 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKategori())}
                    />
                    <button
                      type="button"
                      onClick={handleAddKategori}
                      disabled={isAddingKategori}
                      className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
                    >
                      {isAddingKategori ? <Loader2 size={14} className="animate-spin" /> : "Simpan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewKategori(false); setNewKategoriNama(""); }}
                      className="p-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-slate-400 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Satuan & Stok Minimum */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Satuan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.satuan}
                    onChange={(e) => setFormData((f) => ({ ...f, satuan: e.target.value }))}
                    placeholder="pcs, rim, buah..."
                    required
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Stok Minimum <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.stokMinimum}
                    onChange={(e) => setFormData((f) => ({ ...f, stokMinimum: parseInt(e.target.value) || 0 }))}
                    min={0}
                    required
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Alert tampil jika stok di bawah nilai ini</p>
                </div>
              </div>

              {/* Stok Aktual Input (Hanya untuk Tambah) */}
              {!editingId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Stok Aktual
                  </label>
                  <input
                    type="number"
                    value={formData.stokAktual}
                    onChange={(e) => setFormData((f) => ({ ...f, stokAktual: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0) }))}
                    min={0}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              {/* Stok Aktual — read-only, hanya tampil saat edit */}
              {editingId && editingStok && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Stok Aktual
                  </label>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0a2240]/60 border border-[#143550] rounded-xl">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      editingStok.totalStok < formData.stokMinimum
                        ? "bg-red-500/20 text-red-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      <Package size={14} />
                    </div>
                    <div>
                      <span className={`text-lg font-bold ${
                        editingStok.totalStok < formData.stokMinimum ? "text-red-400" : "text-emerald-400"
                      }`}>
                        {editingStok.totalStok}
                      </span>
                      <span className="text-sm text-slate-500 ml-1.5">{editingStok.satuan}</span>
                    </div>
                    {editingStok.totalStok < formData.stokMinimum && (
                      <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-600/20 text-red-400 border border-red-600/30">
                        <AlertTriangle size={10} />
                        Di bawah minimum
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Stok dikelola melalui menu Stok Masuk & Transaksi ATK</p>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {editingId ? "Simpan Perubahan" : "Tambah Barang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
