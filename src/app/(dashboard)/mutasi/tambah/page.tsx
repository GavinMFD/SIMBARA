"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Printer,
  Save,
  Search,
  Package,
  MapPin,
  Loader2
} from "lucide-react";

interface AsetOption {
  id: string;
  nup: string;
  ruanganId: string;
  batchPembelian: {
    namaAset: string;
  };
  ruangan: {
    id: string;
    namaRuangan: string;
    kodeRuangan: string;
  };
}

interface RuanganOption {
  id: string;
  namaRuangan: string;
  kodeRuangan: string;
}

export default function TambahMutasiPage() {
  const router = useRouter();

  const [asetOptions, setAsetOptions] = useState<AsetOption[]>([]);
  const [ruanganOptions, setRuanganOptions] = useState<RuanganOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [selectedAsetId, setSelectedAsetId] = useState("");
  const [selectedRuanganId, setSelectedRuanganId] = useState("");
  const [tanggalMutasi, setTanggalMutasi] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [keterangan, setKeterangan] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Success state (US-031)
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    ruanganAsal: string;
    ruanganTujuan: string;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [asetRes, ruanganRes] = await Promise.all([
          fetch("/api/barang?pageSize=1000"), // simplify for now
          fetch("/api/ruangan"),
        ]);
        const asetJson = await asetRes.json();
        const ruanganJson = await ruanganRes.json();

        if (asetJson.success) setAsetOptions(asetJson.data);
        if (ruanganJson.success) setRuanganOptions(ruanganJson.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const selectedAset = asetOptions.find((a) => a.id === selectedAsetId);
  const selectedTujuan = ruanganOptions.find((r) => r.id === selectedRuanganId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedAsetId || !selectedRuanganId) {
      setError("Aset dan Ruangan Tujuan wajib dipilih.");
      return;
    }
    if (selectedAset?.ruanganId === selectedRuanganId) {
      setError("Ruangan tujuan tidak boleh sama dengan ruangan asal.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Temporary mocked user ID for "dicatatOleh"
      // In a real app, we get this from the session
      const res = await fetch("/api/mutasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asetId: selectedAsetId,
          ruanganAsalId: selectedAset?.ruanganId,
          ruanganTujuanId: selectedRuanganId,
          tanggalMutasi,
          keterangan,
          dicatatOleh: "user-placeholder", // placeholder until session hook is integrated
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessData({
          ruanganAsal: selectedAset?.ruangan.namaRuangan || "",
          ruanganTujuan: selectedTujuan?.namaRuangan || "",
        });
        setIsSuccess(true);
      } else {
        setError(json.error || "Gagal menyimpan mutasi.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess && successData) {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="rounded-2xl bg-[#071a2e] border border-emerald-500/30 overflow-hidden shadow-2xl shadow-emerald-500/10">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle2 size={40} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Mutasi Berhasil Disimpan</h2>
            
            {/* DIR Notification US-031 */}
            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Printer className="text-amber-400" size={20} />
                </div>
                <div>
                  <h3 className="text-amber-400 font-semibold mb-1">Perhatian: Sinkronisasi Dokumen DIR</h3>
                  <p className="text-sm text-slate-300">
                    Aset telah dipindahkan dari <strong className="text-white">{successData.ruanganAsal}</strong> ke <strong className="text-white">{successData.ruanganTujuan}</strong>. 
                    Daftar Inventaris Ruangan (DIR) untuk kedua ruangan tersebut kini <strong>tidak sinkron</strong> dengan kondisi fisik dan perlu dicetak ulang.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <button 
                onClick={() => window.print()} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-300 hover:text-white transition-colors"
              >
                <Printer size={16} />
                Cetak DIR {successData.ruanganAsal}
              </button>
              <button 
                onClick={() => window.print()} 
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-300 hover:text-white transition-colors"
              >
                <Printer size={16} />
                Cetak DIR {successData.ruanganTujuan}
              </button>
            </div>
          </div>
          
          <div className="px-8 py-5 border-t border-[#0f2b48] bg-[#030d1a] text-center">
            <Link 
              href="/mutasi"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              Kembali ke Daftar Mutasi <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">
            <Link href="/mutasi" className="hover:text-slate-300 transition-colors">Mutasi</Link> &rsaquo; Tambah
          </p>
          <h1 className="text-2xl font-bold text-white">Catat Mutasi Baru</h1>
        </div>
        <Link
          href="/mutasi"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white transition-colors font-semibold"
        >
          <ArrowLeft size={14} />
          Kembali
        </Link>
      </div>

      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex flex-col items-center justify-center text-slate-500">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p className="text-sm font-medium">Memuat data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium">
                  {error}
                </div>
              )}

              {/* Pilih Aset */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Package size={16} className="text-blue-400" />
                  Pilih Aset yang akan dipindah
                </label>
                <div className="relative">
                  <select
                    value={selectedAsetId}
                    onChange={(e) => setSelectedAsetId(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    required
                  >
                    <option value="">-- Cari NUP atau Nama Aset --</option>
                    {asetOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nup} - {a.batchPembelian.namaAset}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Info Ruangan Asal (Read-only) */}
                {selectedAset && (
                  <div className="mt-3 p-3 rounded-lg bg-[#0a2240]/50 border border-[#143550]/50 flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-md text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Lokasi Saat Ini</p>
                      <p className="text-sm font-semibold text-slate-200">{selectedAset.ruangan.namaRuangan}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-[#143550]"></div>
                <ArrowRight className="text-slate-600" size={18} />
                <div className="flex-1 h-px bg-[#143550]"></div>
              </div>

              {/* Ruangan Tujuan */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <MapPin size={16} className="text-amber-400" />
                  Pilih Ruangan Tujuan
                </label>
                <select
                  value={selectedRuanganId}
                  onChange={(e) => setSelectedRuanganId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                  required
                >
                  <option value="">-- Pilih Ruangan --</option>
                  {ruanganOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.namaRuangan} ({r.kodeRuangan})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Keterangan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Tanggal Mutasi
                  </label>
                  <input
                    type="date"
                    value={tanggalMutasi}
                    onChange={(e) => setTanggalMutasi(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Keterangan / Alasan
                  </label>
                  <input
                    type="text"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Opsional"
                    className="w-full px-4 py-3 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#0f2b48] bg-[#030d1a]/50 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !selectedAsetId || !selectedRuanganId}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Simpan Mutasi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
