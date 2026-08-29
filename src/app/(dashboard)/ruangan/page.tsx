"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  X,
  Building2,
  MapPin,
  Package,
} from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

// ─── Interfaces ──────────────────────────────────────────────
interface RuanganRow {
  id: string;
  kodeRuangan: string;
  namaRuangan: string;
  lantaiLokasi: string | null;
  keterangan: string | null;
  createdAt: string;
  _count: { masterAset: number };
}

interface FormData {
  kodeRuangan: string;
  namaRuangan: string;
  lantaiLokasi: string;
  keterangan: string;
}

const EMPTY_FORM: FormData = {
  kodeRuangan: "",
  namaRuangan: "",
  lantaiLokasi: "",
  keterangan: "",
};

export default function RuanganPage() {
  // Data state
  const [ruanganList, setRuanganList] = useState<RuanganRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<RuanganRow | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // ── Fetch data ─────────────────────────────────────────────
  const fetchRuangan = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ruangan");
      const json = await res.json();
      if (json.success) {
        setRuanganList(json.data);
      }
    } catch (e) {
      console.error("Fetch ruangan error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuangan();
  }, [fetchRuangan]);

  // ── Filtered list ──────────────────────────────────────────
  const filteredList = ruanganList.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.kodeRuangan.toLowerCase().includes(q) ||
      r.namaRuangan.toLowerCase().includes(q) ||
      (r.lantaiLokasi && r.lantaiLokasi.toLowerCase().includes(q))
    );
  });

  // ── Form handlers ──────────────────────────────────────────
  const openAddDialog = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowFormDialog(true);
  };

  const openEditDialog = (ruangan: RuanganRow) => {
    setEditingId(ruangan.id);
    setFormData({
      kodeRuangan: ruangan.kodeRuangan,
      namaRuangan: ruangan.namaRuangan,
      lantaiLokasi: ruangan.lantaiLokasi || "",
      keterangan: ruangan.keterangan || "",
    });
    setFormError("");
    setShowFormDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.kodeRuangan.trim()) {
      setFormError("Kode ruangan wajib diisi.");
      return;
    }
    if (!formData.namaRuangan.trim()) {
      setFormError("Nama ruangan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/ruangan/${editingId}` : "/api/ruangan";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        setShowFormDialog(false);
        fetchRuangan();
      } else {
        setFormError(json.error || "Terjadi kesalahan.");
      }
    } catch {
      setFormError("Gagal menyimpan data ruangan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete handler ─────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");

    try {
      const res = await fetch(`/api/ruangan/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        setDeleteTarget(null);
        fetchRuangan();
      } else {
        setDeleteError(json.error || "Gagal menghapus ruangan.");
      }
    } catch {
      setDeleteError("Gagal menghapus ruangan.");
    }
  };

  // ── Stats ──────────────────────────────────────────────────
  const totalRuangan = ruanganList.length;
  const ruanganTerisi = ruanganList.filter(
    (r) => r._count.masterAset > 0
  ).length;
  const ruanganKosong = totalRuangan - ruanganTerisi;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">
            Dashboard &rsaquo; Master Data
          </p>
          <h1 className="text-2xl font-bold text-white">Data Ruangan</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Kelola data ruangan untuk penempatan aset tetap
          </p>
        </div>
        <button
          onClick={openAddDialog}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ff7e47] hover:bg-[#e06833] text-white text-sm font-semibold shadow-lg shadow-[#ff7e47]/25 transition-all"
        >
          <Plus size={16} />
          Tambah Ruangan
        </button>
      </div>

      {/* ── Search Bar ────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5">
        <div className="flex flex-nowrap gap-3 items-end">
          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cari Ruangan
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
                placeholder="Kode / nama / lantai ruangan..."
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
                  Kode
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nama Ruangan
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Lantai / Lokasi
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Keterangan
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Jumlah Aset
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
                      <div className="h-4 w-20 bg-[#0f2b48] rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-36 bg-[#0f2b48] rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 bg-[#0f2b48] rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 bg-[#0f2b48] rounded" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-12 bg-[#0f2b48] rounded mx-auto" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-16 bg-[#0f2b48] rounded mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-600">
                      <DoorOpen size={40} strokeWidth={1} />
                      <p className="text-sm font-medium">
                        {search
                          ? "Tidak ada ruangan yang cocok"
                          : "Belum ada data ruangan"}
                      </p>
                      <p className="text-xs">
                        {search
                          ? "Coba ubah kata kunci pencarian"
                          : 'Klik "Tambah Ruangan" untuk memulai'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[#0a2240]/50 transition-colors group"
                  >
                    <td className="px-5 py-4 text-sm text-slate-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-blue-300 font-mono">
                        {r.kodeRuangan}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <DoorOpen
                          size={14}
                          className="text-slate-500 shrink-0"
                        />
                        <span className="text-sm font-semibold text-slate-200">
                          {r.namaRuangan}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-400">
                        {r.lantaiLokasi || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-400 line-clamp-1">
                        {r.keterangan || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          r._count.masterAset > 0
                            ? "bg-blue-500/15 text-blue-400"
                            : "bg-slate-700/30 text-slate-500"
                        }`}
                      >
                        <Package size={11} />
                        {r._count.masterAset}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditDialog(r)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-blue-500/15 hover:text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError("");
                            setDeleteTarget(r);
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
              ruangan
              {search && (
                <>
                  {" "}
                  dari{" "}
                  <span className="text-slate-300 font-semibold">
                    {ruanganList.length}
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
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Ruangan</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {totalRuangan}
              <span className="text-sm font-normal text-slate-500 ml-1">
                ruangan
              </span>
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Package size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Ruangan Terisi
            </p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {ruanganTerisi}
              <span className="text-sm font-normal text-slate-500 ml-1">
                ruangan
              </span>
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <MapPin size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">
              Ruangan Kosong
            </p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {ruanganKosong}
              <span className="text-sm font-normal text-slate-500 ml-1">
                ruangan
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
                <DoorOpen size={18} className="text-blue-400" />
                {editingId ? "Edit Ruangan" : "Tambah Ruangan Baru"}
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
                    Kode Ruangan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kodeRuangan}
                    onChange={(e) =>
                      setFormData({ ...formData, kodeRuangan: e.target.value })
                    }
                    placeholder="Contoh: R-001"
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Nama Ruangan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.namaRuangan}
                    onChange={(e) =>
                      setFormData({ ...formData, namaRuangan: e.target.value })
                    }
                    placeholder="Contoh: Ruang Server"
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Lantai / Lokasi
                  </label>
                  <input
                    type="text"
                    value={formData.lantaiLokasi}
                    onChange={(e) =>
                      setFormData({ ...formData, lantaiLokasi: e.target.value })
                    }
                    placeholder="Contoh: Lantai 2"
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Keterangan
                  </label>
                  <textarea
                    value={formData.keterangan}
                    onChange={(e) =>
                      setFormData({ ...formData, keterangan: e.target.value })
                    }
                    placeholder="Catatan tambahan (opsional)"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
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
                  {editingId ? "Simpan Perubahan" : "Tambah Ruangan"}
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
                Hapus Ruangan
              </h3>
              <p className="text-sm text-slate-400">
                Apakah Anda yakin ingin menghapus ruangan{" "}
                <span className="font-semibold text-white">
                  &quot;{deleteTarget.namaRuangan}&quot;
                </span>{" "}
                ({deleteTarget.kodeRuangan})?
              </p>
              {deleteTarget._count.masterAset > 0 && (
                <div className="mt-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400 font-medium">
                  ⚠️ Ruangan ini masih ditempati{" "}
                  {deleteTarget._count.masterAset} unit aset. Ruangan tidak
                  dapat dihapus selama masih ada aset di dalamnya.
                </div>
              )}
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
              {deleteTarget._count.masterAset === 0 && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-red-600/20"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
