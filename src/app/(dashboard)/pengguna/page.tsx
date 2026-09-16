"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, ShieldAlert, KeyRound, Loader2, Trash2, PowerOff, ShieldCheck, Mail, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  nama: string;
  email: string;
  role: "super_admin" | "admin" | "kasubag";
  isActive: boolean;
  needsPasswordReset: boolean;
  createdAt: string;
}

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ nama: "", email: "", role: "admin" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/pengguna");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/pengguna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setFormData({ nama: "", email: "", role: "admin" });
        fetchUsers(); // refresh
      } else {
        alert(json.error || "Gagal membuat pengguna");
      }
    } catch (err) {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Yakin ingin ${currentStatus ? "menonaktifkan" : "mengaktifkan"} pengguna ini?`)) return;
    try {
      const res = await fetch(`/api/pengguna/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm("Yakin ingin me-reset password pengguna ini menjadi BpsPalu123! ? Pengguna akan diminta mengubahnya saat login berikutnya.")) return;
    try {
      const res = await fetch(`/api/pengguna/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });
      const json = await res.json();
      if (json.success) {
        alert("Password berhasil direset!");
        fetchUsers();
      } else {
        alert(json.error || "Gagal mereset password");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("PERINGATAN: Menghapus pengguna bersifat permanen. Jika pengguna memiliki riwayat transaksi, penghapusan akan gagal. Sebaiknya nonaktifkan saja akun tersebut. Lanjutkan hapus?")) return;
    try {
      const res = await fetch(`/api/pengguna/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
      } else {
        alert(json.error || "Gagal menghapus pengguna");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-emerald-500" />
            Manajemen Pengguna
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Kelola hak akses, status akun, dan reset password (Khusus Super Admin).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Plus size={16} /> Tambah Akun
        </button>
      </div>

      <Card className="bg-[#071a2e] border-[#0f2b48] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0a2240] border-b border-[#0f2b48] text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama / Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Password Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0f2b48]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-3" />
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Belum ada pengguna.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#0a2240]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{u.nama}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.role === "super_admin" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                          <ShieldAlert size={12} /> Super Admin
                        </span>
                      )}
                      {u.role === "admin" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <ShieldCheck size={12} /> Admin
                        </span>
                      )}
                      {u.role === "kasubag" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Users size={12} /> Kasubag
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-md ${
                        u.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                      }`}>
                        {u.isActive ? "Aktif" : "Non-aktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.needsPasswordReset ? (
                        <span className="text-amber-400 text-xs font-medium flex items-center gap-1">
                          <KeyRound size={12} /> Wajib Reset
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                          <ShieldCheck size={12} /> Aman
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {u.role !== "super_admin" && (
                          <>
                            <button
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                              title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                u.isActive 
                                  ? "border-amber-500/30 text-amber-500 hover:bg-amber-500/10" 
                                  : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                              }`}
                            >
                              <PowerOff size={16} />
                            </button>
                            <button
                              onClick={() => handleResetPassword(u.id)}
                              title="Reset Password ke default"
                              className="p-1.5 rounded-lg border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 transition-colors"
                            >
                              <KeyRound size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              title="Hapus Akun"
                              className="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#071a2e] border border-[#0f2b48] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#0f2b48]">
              <h3 className="text-lg font-bold text-white">Tambah Pengguna Baru</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-slate-300">Nama Lengkap</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="bg-[#0a2240] border-[#143550] text-white focus:border-emerald-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email (Untuk Login)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="budi@bps.go.id"
                  className="bg-[#0a2240] border-[#143550] text-white focus:border-emerald-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-300">Role / Hak Akses</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-md border border-[#143550] bg-[#0a2240] px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="admin">Admin (Operasional)</option>
                  <option value="kasubag">Kasubag (Eksekutif/Read-only)</option>
                  <option value="super_admin">Super Admin (Akses Penuh)</option>
                </select>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                <strong>Catatan:</strong> Akun baru akan mendapatkan password sementara <code className="bg-black/30 px-1 py-0.5 rounded">BpsPalu123!</code> dan diwajibkan untuk mengganti password saat login pertama.
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Buat Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
