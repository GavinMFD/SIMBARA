"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Users,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  X,
  UserCheck,
  UserX,
  Briefcase
} from "lucide-react";

// ─── Interfaces ──────────────────────────────────────────────
interface PegawaiRow {
  id: string;
  nama: string;
  unitKerja: string;
  isActive: boolean;
  createdAt: string;
}

interface FormData {
  nama: string;
  unitKerja: string;
  isActive: boolean;
}

const EMPTY_FORM: FormData = {
  nama: "",
  unitKerja: "",
  isActive: true,
};

export default function PegawaiPage() {
  // Data state
  const [pegawaiList, setPegawaiList] = useState<PegawaiRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<PegawaiRow | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // ── Fetch data ─────────────────────────────────────────────
  const fetchPegawai = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/pegawai");
      const json = await res.json();
      if (json.success) {
        setPegawaiList(json.data);
      }
    } catch (e) {
      console.error("Fetch pegawai error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPegawai();
  }, [fetchPegawai]);

  // ── Filtered list ──────────────────────────────────────────
  const filteredList = pegawaiList.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.nama.toLowerCase().includes(q) ||
      p.unitKerja.toLowerCase().includes(q)
    );
  });

  // ── Form handlers ──────────────────────────────────────────
  const openAddDialog = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowFormDialog(true);
  };

  const openEditDialog = (pegawai: PegawaiRow) => {
    setEditingId(pegawai.id);
    setFormData({
      nama: pegawai.nama,
      unitKerja: pegawai.unitKerja,
      isActive: pegawai.isActive,
    });
    setFormError("");
    setShowFormDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.nama.trim()) {
      setFormError("Nama pegawai wajib diisi.");
      return;
    }
    if (!formData.unitKerja.trim()) {
      setFormError("Unit kerja wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/pegawai/${editingId}` : "/api/pegawai";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        setShowFormDialog(false);
        fetchPegawai();
      } else {
        setFormError(json.error || "Terjadi kesalahan.");
      }
    } catch {
      setFormError("Gagal menyimpan data pegawai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete handler ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");

    try {
      const res = await fetch(`/api/pegawai/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        setDeleteTarget(null);
        fetchPegawai();
      } else {
        setDeleteError(json.error || "Gagal menghapus pegawai.");
      }
    } catch {
      setDeleteError("Gagal menghapus pegawai.");
    }
  };

  // ── Stats ──────────────────────────────────────────────────
  const totalPegawai = pegawaiList.length;
  const pegawaiAktif = pegawaiList.filter((p) => p.isActive).length;
  const pegawaiNonAktif = totalPegawai - pegawaiAktif;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">
            Dashboard &rsaquo; Master Data
          </p>
          <h1 className="text-2xl font-bold text-white">Data Pegawai</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Kelola data pegawai untuk pencatatan transaksi persediaan
          </p>
        </div>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff7e47] hover:bg-[#e06833] text-white text-sm font-semibold shadow-lg shadow-[#ff7e47]/25 transition-all shrink-0 whitespace-nowrap"
        >
          <Plus size={16} />
          Tambah Pegawai
        </button>
      </div>

      {/* ── Search Bar ────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end w-full">
          <div className="flex-1 w-full sm:w-auto min-w-0 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cari Pegawai
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nama / Unit Kerja..."
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-[22px]">
            <button
              onClick={() => setSearch("")}
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
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">
                  No
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nama Pegawai
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Unit Kerja
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-28">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0a2240]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 w-6 bg-[#0f2b48] rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 bg-[#0f2b48] rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-32 bg-[#0f2b48] rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-16 bg-[#0f2b48] rounded mx-auto" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-16 bg-[#0f2b48] rounded mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <Users size={40} strokeWidth={1} />
                      <p className="text-sm font-medium">
                        {search
                          ? "Tidak ada pegawai yang cocok"
                          : "Belum ada data pegawai"}
                      </p>
                      <p className="text-xs">
                        {search
                          ? "Coba ubah kata kunci pencarian"
                          : 'Klik "Tambah Pegawai" untuk memulai'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#0a2240]/50 transition-colors group"
                  >
                    <td className="px-5 py-4 text-sm text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-slate-200">
                        {p.nama}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Briefcase size={14} className="shrink-0" />
                        {p.unitKerja}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.isActive
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-slate-700/30 text-slate-500"
                        }`}
                      >
                        {p.isActive ? "Aktif" : "Non-aktif"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditDialog(p)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-blue-500/15 hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError("");
                            setDeleteTarget(p);
                          }}
                          className="p-2 rounded-lg text-slate-500 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        {!isLoading && filteredList.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#0f2b48]">
            <p className="text-xs text-slate-500">
              Menampilkan{" "}
              <span className="text-slate-300 font-semibold">
                {filteredList.length}
              </span>{" "}
              pegawai
              {search && (
                <>
                  {" "}
                  dari{" "}
                  <span className="text-slate-300 font-semibold">
                    {pegawaiList.length}
                  </span>{" "}
                  total
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Stats Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Pegawai</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {totalPegawai}
              <span className="text-sm font-normal text-slate-500 ml-1">
                orang
              </span>
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Pegawai Aktif
            </p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {pegawaiAktif}
              <span className="text-sm font-normal text-slate-500 ml-1">
                orang
              </span>
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/20 text-slate-400">
            <UserX size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Pegawai Non-aktif
            </p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {pegawaiNonAktif}
              <span className="text-sm font-normal text-slate-500 ml-1">
                orang
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Form Dialog (Tambah / Edit) ───────────────────── */}
      {showFormDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isSubmitting && setShowFormDialog(false)}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-[#071a2e] border border-[#0f2b48] shadow-2xl shadow-black/40">
            {/* Dialog header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#0f2b48]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                {editingId ? "Edit Data Pegawai" : "Tambah Pegawai Baru"}
              </h2>
              <button
                onClick={() => !isSubmitting && setShowFormDialog(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-[#0f2b48] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dialog body */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {formError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Nama Pegawai <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) =>
                      setFormData({ ...formData, nama: e.target.value })
                    }
                    placeholder="Masukkan nama pegawai..."
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Unit Kerja <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.unitKerja}
                    onChange={(e) =>
                      setFormData({ ...formData, unitKerja: e.target.value })
                    }
                    placeholder="Contoh: Subbagian Umum, BPS Kota Palu..."
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-500 bg-[#0a2240] border-[#143550] focus:ring-blue-500 focus:ring-offset-[#071a2e]"
                    />
                    <span className="text-sm font-semibold text-slate-300">
                      Status Pegawai Aktif
                    </span>
                  </label>
                </div>
              </div>

              {/* Dialog footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#0f2b48]">
                <button
                  type="button"
                  onClick={() => setShowFormDialog(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors font-semibold disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {isSubmitting && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {editingId ? "Simpan Perubahan" : "Tambah Pegawai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ─────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#071a2e] border border-[#0f2b48] shadow-2xl shadow-black/40">
            <div className="px-6 py-5">
              <h3 className="text-base font-bold text-white mb-2">
                Hapus Pegawai
              </h3>
              <p className="text-sm text-slate-400">
                Apakah Anda yakin ingin menghapus pegawai{" "}
                <span className="font-semibold text-white">
                  &quot;{deleteTarget.nama}&quot;
                </span>
                ?
              </p>
              {deleteError && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium">
                  {deleteError}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#0f2b48]">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20"
              >
                <Trash2 size={14} />
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
