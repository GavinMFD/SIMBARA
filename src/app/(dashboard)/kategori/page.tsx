"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Tags,
  Pencil,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  Package,
  ClipboardList
} from "lucide-react";

type CategoryType = "aset" | "persediaan";

interface KategoriItem {
  id: string;
  namaKategori: string;
  _count?: {
    batchPembelianAset?: number;
    masterBarang?: number;
  };
}

type ModalMode = "create" | "edit" | null;

export default function UnifiedKategoriPage() {
  const [activeTab, setActiveTab] = useState<CategoryType>("aset");
  const [kategoriList, setKategoriList] = useState<KategoriItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<KategoriItem | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchKategori = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = activeTab === "aset" ? "/api/kategori" : "/api/kategori-barang";
      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.success) {
        setKategoriList(json.data);
      }
    } catch (e) {
      console.error(`Fetch kategori ${activeTab} error:`, e);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchKategori();
  }, [fetchKategori]);

  // ── Filtered list ──────────────────────────────────────────
  const filteredList = kategoriList.filter((k) =>
    k.namaKategori.toLowerCase().includes(search.toLowerCase())
  );

  // ── Modal handlers ─────────────────────────────────────────
  const openCreateModal = () => {
    setFormName("");
    setFormError("");
    setEditingId(null);
    setModalMode("create");
  };

  const openEditModal = (k: KategoriItem) => {
    setFormName(k.namaKategori);
    setFormError("");
    setEditingId(k.id);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setFormName("");
    setFormError("");
    setEditingId(null);
  };

  // ── Submit (create / edit) ─────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Nama kategori wajib diisi.");
      return;
    }
    setFormError("");
    setIsSaving(true);

    try {
      const endpoint = activeTab === "aset" ? "/api/kategori" : "/api/kategori-barang";
      const url = modalMode === "edit" ? `${endpoint}/${editingId}` : endpoint;
      const method = modalMode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaKategori: formName.trim() }),
      });

      const json = await res.json();

      if (!json.success) {
        setFormError(json.error || "Terjadi kesalahan.");
        return;
      }

      closeModal();
      fetchKategori();
    } catch {
      setFormError("Gagal menyimpan. Periksa koneksi Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const openDeleteDialog = (k: KategoriItem) => {
    setDeleteTarget(k);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError("");

    try {
      const endpoint = activeTab === "aset" ? "/api/kategori" : "/api/kategori-barang";
      const res = await fetch(`${endpoint}/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();

      if (!json.success) {
        setDeleteError(json.error || "Gagal menghapus kategori.");
        return;
      }

      setDeleteTarget(null);
      fetchKategori();
    } catch {
      setDeleteError("Gagal menghapus. Periksa koneksi Anda.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRelationCount = (k: KategoriItem) => {
    if (activeTab === "aset") return k._count?.batchPembelianAset || 0;
    return k._count?.masterBarang || 0;
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">Dashboard &rsaquo; Kategori</p>
          <h1 className="text-2xl font-bold text-white">Master Kategori</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Kelola kategori untuk Aset Tetap maupun Barang Persediaan.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all"
        >
          <Plus size={16} />
          Tambah Kategori
        </button>
      </div>

      {/* ── Tabs ──────────────────────────────────────── */}
      <div className="flex border-b border-[#0f2b48]">
        <button
          onClick={() => { setActiveTab("aset"); setSearch(""); }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "aset" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <Package size={16} />
          Kategori Aset Tetap
        </button>
        <button
          onClick={() => { setActiveTab("persediaan"); setSearch(""); }}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === "persediaan" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <ClipboardList size={16} />
          Kategori Persediaan
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5">
        <div className="flex gap-3 items-end">
          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cari Kategori {activeTab === "aset" ? "Aset" : "Persediaan"}
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Ketik nama kategori ${activeTab}...`}
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={() => setSearch("")}
            title="Reset filter"
            className="p-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0f2b48]">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">No</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Kategori</th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {activeTab === "aset" ? "Jumlah Pembelian" : "Data Master Barang"}
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0a2240]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-6 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-40 bg-[#0f2b48] rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-[#0f2b48] rounded mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-[#0f2b48] rounded mx-auto" /></td>
                  </tr>
                ))
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <FolderOpen size={40} strokeWidth={1} />
                      <p className="text-sm font-medium">
                        {search ? "Tidak ada kategori yang cocok" : "Belum ada data kategori"}
                      </p>
                      <p className="text-xs">
                        {search ? "Coba ubah kata pencarian" : 'Klik "Tambah Kategori" untuk memulai'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((k, idx) => {
                  const relCount = getRelationCount(k);
                  return (
                    <tr key={k.id} className="hover:bg-[#0a2240]/50 transition-colors group">
                      <td className="px-5 py-4 text-sm text-slate-500 font-medium">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                            <Tags size={14} />
                          </div>
                          <span className="text-sm font-semibold text-slate-200">{k.namaKategori}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          relCount > 0
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-slate-700/30 text-slate-500"
                        }`}>
                          {relCount}
                          <span className="font-normal">{activeTab === "aset" ? "batch" : "barang"}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(k)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-blue-500/15 hover:text-blue-400 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(k)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#0f2b48]">
          <p className="text-xs text-slate-500">
            Menampilkan <span className="text-slate-300 font-semibold">{filteredList.length}</span> kategori
          </p>
        </div>
      </div>

      {/* ── Create / Edit Modal ────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#071a2e] border border-[#0f2b48] shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#0f2b48]">
              <h2 className="text-lg font-bold text-white">
                {modalMode === "edit" ? "Edit Kategori" : `Tambah Kategori ${activeTab === "aset" ? "Aset" : "Persediaan"}`}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-slate-400 hover:bg-[#0f2b48] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/40 text-sm text-red-300">
                  <AlertTriangle size={16} className="shrink-0 text-red-400" />
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Nama Kategori <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Elektronik, Tinta, dll..."
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white transition-colors font-semibold">
                  Batal
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setDeleteTarget(null); setDeleteError(""); }} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#071a2e] border border-[#0f2b48] shadow-2xl shadow-black/50 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Hapus Kategori</h3>
                  <p className="text-sm text-slate-400">
                    Yakin ingin menghapus <span className="text-red-300 font-semibold">&quot;{deleteTarget.namaKategori}&quot;</span>?
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/40 text-sm text-red-300">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
                  <span>{deleteError}</span>
                </div>
              )}

              {getRelationCount(deleteTarget) > 0 && !deleteError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-950/40 border border-amber-800/30 text-sm text-amber-300/80">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    Kategori ini memiliki <strong>{getRelationCount(deleteTarget)}</strong> data terkait.
                    Penghapusan mungkin akan ditolak.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button onClick={() => { setDeleteTarget(null); setDeleteError(""); }} className="px-5 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white transition-colors font-semibold">
                  Batal
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-red-600/25 transition-all">
                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
