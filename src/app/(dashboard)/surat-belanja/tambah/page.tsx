"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Package,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";

interface MasterBarang {
  id: string;
  namaBarang: string;
  satuan: string;
}

interface KategoriAset {
  id: string;
  namaKategori: string;
}

interface Ruangan {
  id: string;
  namaRuangan: string;
  kodeRuangan: string;
}

type ItemType = "persediaan" | "aset";

interface FormItem {
  id: string; // temp id for key
  type: ItemType;
  masterBarangId?: string;
  kategoriAsetId?: string;
  namaAset?: string;
  merekTipe?: string;
  ruanganId?: string;
  qty: number;
  hargaSatuan: number;
}

export default function TambahSuratBelanjaPage() {
  const router = useRouter();
  
  // Master data
  const [masterBarang, setMasterBarang] = useState<MasterBarang[]>([]);
  const [kategoriAset, setKategoriAset] = useState<KategoriAset[]>([]);
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form State
  const [noSuratBelanja, setNoSuratBelanja] = useState("");
  const [tanggalBelanja, setTanggalBelanja] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<FormItem[]>([
    { id: crypto.randomUUID(), type: "persediaan", qty: 1, hargaSatuan: 0 }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch master data on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      setIsLoadingData(true);
      try {
        const [resBarang, resKategori, resRuangan] = await Promise.all([
          fetch("/api/master-barang"),
          fetch("/api/kategori"),
          fetch("/api/ruangan")
        ]);
        
        const [dataBarang, dataKategori, dataRuangan] = await Promise.all([
          resBarang.json(), resKategori.json(), resRuangan.json()
        ]);
        
        if (dataBarang.success) setMasterBarang(dataBarang.data);
        if (dataKategori.success) setKategoriAset(dataKategori.data);
        if (dataRuangan.success) setRuanganList(dataRuangan.data);
      } catch (err) {
        console.error("Gagal load master data:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchMasterData();
  }, []);

  const addItem = (type: ItemType) => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), type, qty: 1, hargaSatuan: 0 }
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof FormItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // Kalkulasi total
  const totalBaris = items.length;
  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalNominal = items.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.hargaSatuan) || 0)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!noSuratBelanja.trim()) {
      setError("No. Surat Belanja wajib diisi.");
      return;
    }
    if (items.length === 0) {
      setError("Silakan tambahkan minimal 1 barang.");
      return;
    }

    // Validasi items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.qty <= 0) return setError(`Baris ${i + 1}: Qty harus lebih dari 0.`);
      if (item.hargaSatuan <= 0) return setError(`Baris ${i + 1}: Harga satuan harus lebih dari 0.`);
      
      if (item.type === "persediaan" && !item.masterBarangId) {
        return setError(`Baris ${i + 1}: Silakan pilih Master Persediaan.`);
      }
      if (item.type === "aset") {
        if (!item.kategoriAsetId) return setError(`Baris ${i + 1}: Silakan pilih Kategori Aset.`);
        if (!item.namaAset?.trim()) return setError(`Baris ${i + 1}: Nama Aset wajib diisi.`);
        if (!item.ruanganId) return setError(`Baris ${i + 1}: Silakan pilih Ruangan.`);
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        noSuratBelanja: noSuratBelanja.trim(),
        tanggalBelanja,
        items: items.map(({ id, ...rest }) => rest)
      };

      const res = await fetch("/api/surat-belanja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Gagal menyimpan data.");
      } else {
        router.push("/surat-belanja");
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/surat-belanja" className="p-2 rounded-xl bg-[#071a2e] border border-[#0f2b48] text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Input Surat Belanja</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Catat penerimaan Barang Persediaan dan Aset Tetap sekaligus dalam satu dokumen.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/40 text-sm text-red-300">
          <AlertTriangle size={16} className="shrink-0 text-red-400" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── HEADER DOKUMEN ── */}
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Informasi Dokumen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                No. Surat Belanja / Kuitansi <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={noSuratBelanja}
                onChange={(e) => setNoSuratBelanja(e.target.value)}
                placeholder="Contoh: SB-001/2026"
                className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tanggal Dokumen <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={tanggalBelanja}
                onChange={(e) => setTanggalBelanja(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {/* ── DAFTAR BARANG ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Daftar Barang (Rincian)
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addItem("persediaan")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
              >
                <Plus size={14} /> Tambah Persediaan
              </button>
              <button
                type="button"
                onClick={() => addItem("aset")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-colors"
              >
                <Plus size={14} /> Tambah Aset Tetap
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] border-dashed p-12 text-center">
              <p className="text-slate-500 text-sm">Belum ada barang ditambahkan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="relative rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5 pr-14 group transition-colors focus-within:border-[#1e4976]">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="absolute right-4 top-4 p-2 rounded-lg text-slate-600 hover:bg-red-500/15 hover:text-red-400 transition-colors"
                    title="Hapus baris"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0a2240] text-xs font-bold text-slate-400">
                      {index + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.type === "persediaan" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"
                    }`}>
                      {item.type === "persediaan" ? "Barang Persediaan" : "Aset Tetap (NUP)"}
                    </span>
                  </div>

                  {item.type === "persediaan" ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-5 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase">Pilih Master Persediaan</label>
                        <select
                          value={item.masterBarangId || ""}
                          onChange={(e) => updateItem(item.id, "masterBarangId", e.target.value)}
                          className="w-full px-3 py-2 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:border-blue-500 transition-colors"
                        >
                          <option value="">-- Pilih Barang Persediaan --</option>
                          {masterBarang.map(b => (
                            <option key={b.id} value={b.id}>{b.namaBarang} ({b.satuan})</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase">Harga Satuan</label>
                        <input
                          type="number"
                          value={item.hargaSatuan || ""}
                          onChange={(e) => updateItem(item.id, "hargaSatuan", Number(e.target.value))}
                          placeholder="Rp..."
                          className="w-full px-3 py-2 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase">Qty Masuk</label>
                        <input
                          type="number"
                          value={item.qty || ""}
                          onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1.5 pb-2">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase">Subtotal</p>
                        <p className="text-sm font-bold text-white">
                          Rp {(item.qty * item.hargaSatuan).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase">Kategori Aset</label>
                        <select
                          value={item.kategoriAsetId || ""}
                          onChange={(e) => updateItem(item.id, "kategoriAsetId", e.target.value)}
                          className="w-full px-3 py-2 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:border-blue-500 transition-colors"
                        >
                          <option value="">-- Kategori --</option>
                          {kategoriAset.map(k => (
                            <option key={k.id} value={k.id}>{k.namaKategori}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-4 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase">Nama & Merek</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={item.namaAset || ""}
                            onChange={(e) => updateItem(item.id, "namaAset", e.target.value)}
                            placeholder="Nama Aset"
                            className="w-full px-3 py-2 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:border-blue-500 transition-colors"
                          />
                          <input
                            type="text"
                            value={item.merekTipe || ""}
                            onChange={(e) => updateItem(item.id, "merekTipe", e.target.value)}
                            placeholder="Merek"
                            className="w-1/2 px-3 py-2 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase">Lokasi Ruangan</label>
                        <select
                          value={item.ruanganId || ""}
                          onChange={(e) => updateItem(item.id, "ruanganId", e.target.value)}
                          className="w-full px-3 py-2 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:border-blue-500 transition-colors"
                        >
                          <option value="">-- Pilih Ruangan --</option>
                          {ruanganList.map(r => (
                            <option key={r.id} value={r.id}>{r.kodeRuangan} - {r.namaRuangan}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-12 mt-2"></div>
                      {/* Baris 2 aset */}
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase">Harga Satuan</label>
                        <input
                          type="number"
                          value={item.hargaSatuan || ""}
                          onChange={(e) => updateItem(item.id, "hargaSatuan", Number(e.target.value))}
                          placeholder="Rp..."
                          className="w-full px-3 py-2 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase">Jumlah Unit</label>
                        <input
                          type="number"
                          value={item.qty || ""}
                          onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:border-blue-500 transition-colors"
                        />
                      </div>
                      <div className="md:col-span-4 space-y-1.5 pb-2">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase">Info NUP</p>
                        <p className="text-[11px] text-slate-400 bg-[#0a2240] p-2 rounded-lg border border-[#143550]">
                          Sistem akan otomatis me-generate <b>{item.qty || 0} NUP</b> untuk aset ini.
                        </p>
                      </div>
                      <div className="md:col-span-3 space-y-1.5 pb-2 text-right pr-4">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase">Subtotal</p>
                        <p className="text-sm font-bold text-white">
                          Rp {(item.qty * item.hargaSatuan).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER & ACTION ── */}
        <div className="rounded-2xl bg-[#0a2240] border border-[#143550] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex gap-8">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Item</p>
              <p className="text-xl font-bold text-white">{totalBaris} <span className="text-sm font-normal text-slate-500">Baris</span> / {totalQty} <span className="text-sm font-normal text-slate-500">Qty</span></p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Nilai Belanja</p>
              <p className="text-xl font-bold text-blue-400">Rp {totalNominal.toLocaleString("id-ID")}</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <Link
              href="/surat-belanja"
              className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-[#071a2e] border border-[#143550] text-sm text-slate-300 font-semibold hover:text-white hover:border-slate-500 transition-colors text-center"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingData}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Simpan Transaksi
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
