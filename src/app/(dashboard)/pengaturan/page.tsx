"use client";

import React, { useState, useEffect } from "react";
import { Save, Settings2, Loader2, UserCircle, Briefcase, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function PengaturanPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [kepala, setKepala] = useState({ namaPejabat: "", nip: "", jabatan: "" });
  const [kasubag, setKasubag] = useState({ namaPejabat: "", nip: "", jabatan: "" });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/pengaturan/ttd");
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setKepala(json.data.kepala);
            setKasubag(json.data.kasubag);
          }
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/pengaturan/ttd", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kepala, kasubag }),
      });
      const json = await res.json();

      if (json.success) {
        setSuccessMsg("Pengaturan berhasil disimpan.");
        setKepala(json.data.kepala);
        setKasubag(json.data.kasubag);
      } else {
        setErrorMsg(json.error || "Gagal menyimpan pengaturan.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings2 className="text-blue-500" />
          Pengaturan Sistem
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Kelola master data yang digunakan pada keseluruhan aplikasi.
        </p>
      </div>

      <Card className="bg-[#071829] border-border">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold text-white">
            Pengaturan Pejabat Penandatangan
          </CardTitle>
          <p className="text-sm text-slate-400">
            Data ini akan dicetak pada bagian penandatangan dokumen (seperti Daftar Inventaris Ruangan).
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          {successMsg && (
            <div className="mb-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4">
              <p className="text-sm font-semibold text-emerald-500">{successMsg}</p>
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 rounded-md bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm font-semibold text-red-500">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Kepala BPS Form */}
              <div className="space-y-4 bg-[#030d1a]/50 p-4 rounded-xl border border-border/40">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-border/50 pb-2">
                  Kepala BPS
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="kepala_nama" className="text-slate-300">Nama Pejabat</Label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      id="kepala_nama"
                      value={kepala.namaPejabat}
                      onChange={(e) => setKepala({ ...kepala, namaPejabat: e.target.value })}
                      placeholder="Masukkan nama kepala BPS..."
                      className="pl-9 bg-[#0b2136] border-slate-700 focus:border-blue-500 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kepala_nip" className="text-slate-300">NIP</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      id="kepala_nip"
                      value={kepala.nip}
                      onChange={(e) => setKepala({ ...kepala, nip: e.target.value })}
                      placeholder="Masukkan NIP..."
                      className="pl-9 bg-[#0b2136] border-slate-700 focus:border-blue-500 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kepala_jabatan" className="text-slate-300">Jabatan TTD</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      id="kepala_jabatan"
                      value={kepala.jabatan}
                      onChange={(e) => setKepala({ ...kepala, jabatan: e.target.value })}
                      placeholder="Contoh: Kepala BPS Kota Palu"
                      className="pl-9 bg-[#0b2136] border-slate-700 focus:border-blue-500 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Kasubag Form */}
              <div className="space-y-4 bg-[#030d1a]/50 p-4 rounded-xl border border-border/40">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 border-b border-border/50 pb-2">
                  Kasubag Umum
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="kasubag_nama" className="text-slate-300">Nama Pejabat</Label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      id="kasubag_nama"
                      value={kasubag.namaPejabat}
                      onChange={(e) => setKasubag({ ...kasubag, namaPejabat: e.target.value })}
                      placeholder="Masukkan nama kasubag..."
                      className="pl-9 bg-[#0b2136] border-slate-700 focus:border-blue-500 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kasubag_nip" className="text-slate-300">NIP</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      id="kasubag_nip"
                      value={kasubag.nip}
                      onChange={(e) => setKasubag({ ...kasubag, nip: e.target.value })}
                      placeholder="Masukkan NIP..."
                      className="pl-9 bg-[#0b2136] border-slate-700 focus:border-blue-500 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kasubag_jabatan" className="text-slate-300">Jabatan TTD</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      id="kasubag_jabatan"
                      value={kasubag.jabatan}
                      onChange={(e) => setKasubag({ ...kasubag, jabatan: e.target.value })}
                      placeholder="Contoh: Kasubag Umum BPS Kota Palu"
                      className="pl-9 bg-[#0b2136] border-slate-700 focus:border-blue-500 text-white"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-border/50 pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Simpan Pengaturan
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
