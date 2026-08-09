"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Package,
  ChevronDown,
  Tags,
  FileText,
  CalendarRange,
  Hash,
  DoorOpen,
  X,
  Info,
  Sparkles,
} from "lucide-react";

// ─── Interfaces ──────────────────────────────────────────────
interface KategoriAset {
  id: string;
  namaKategori: string;
}

interface Ruangan {
  id: string;
  kodeRuangan: string;
  namaRuangan: string;
}

interface UnitRow {
  nup: string;
  ruanganId: string;
}

interface FormDataStep1 {
  kategoriAsetId: string;
  namaAset: string;
  merekTipe: string;
  noSuratBelanja: string;
  tanggalBeli: string;
  hargaSatuan: number | string;
  jumlahUnit: number | string;
}

const INITIAL_STEP1: FormDataStep1 = {
  kategoriAsetId: "",
  namaAset: "",
  merekTipe: "",
  noSuratBelanja: "",
  tanggalBeli: new Date().toISOString().slice(0, 10),
  hargaSatuan: "",
  jumlahUnit: "",
};

export default function TambahAsetPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [formStep1, setFormStep1] = useState<FormDataStep1>(INITIAL_STEP1);
  const [step1Error, setStep1Error] = useState("");

  // Step 2 state
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [step2Error, setStep2Error] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Dropdown options
  const [kategoriOptions, setKategoriOptions] = useState<KategoriAset[]>([]);
  const [ruanganOptions, setRuanganOptions] = useState<Ruangan[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  // ── Fetch options ──────────────────────────────────────────
  const fetchOptions = useCallback(async () => {
    setIsLoadingOptions(true);
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
    } finally {
      setIsLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // ── Step 1 → Step 2 transition ─────────────────────────────
  const handleGoToStep2 = async () => {
    setStep1Error("");

    // Validate
    if (!formStep1.kategoriAsetId) { setStep1Error("Kategori aset wajib dipilih."); return; }
    if (!formStep1.namaAset.trim()) { setStep1Error("Nama aset wajib diisi."); return; }
    if (!formStep1.noSuratBelanja.trim()) { setStep1Error("No. Surat Belanja wajib diisi."); return; }
    if (!formStep1.tanggalBeli) { setStep1Error("Tanggal beli wajib diisi."); return; }
    if (!formStep1.hargaSatuan || Number(formStep1.hargaSatuan) <= 0) { setStep1Error("Harga satuan harus lebih dari 0."); return; }
    if (!formStep1.jumlahUnit || Number(formStep1.jumlahUnit) <= 0) { setStep1Error("Jumlah unit harus lebih dari 0."); return; }

    const count = Number(formStep1.jumlahUnit);

    // Fetch next NUP values
    try {
      const res = await fetch(`/api/aset-masuk/next-nup?count=${count}`);
      const json = await res.json();

      if (json.success) {
        const defaultRuanganId = ruanganOptions.length > 0 ? ruanganOptions[0].id : "";
        const newUnits = json.data.map((nup: string) => ({
          nup,
          ruanganId: defaultRuanganId,
        }));
        setUnits(newUnits);
      } else {
        // Fallback: generate placeholder NUPs
        const defaultRuanganId = ruanganOptions.length > 0 ? ruanganOptions[0].id : "";
        const newUnits: UnitRow[] = [];
        for (let i = 0; i < count; i++) {
          newUnits.push({
            nup: `NUP-${String(i + 1).padStart(6, "0")}`,
            ruanganId: defaultRuanganId,
          });
        }
        setUnits(newUnits);
      }
    } catch {
      const defaultRuanganId = ruanganOptions.length > 0 ? ruanganOptions[0].id : "";
      const newUnits: UnitRow[] = [];
      for (let i = 0; i < count; i++) {
        newUnits.push({
          nup: `NUP-${String(i + 1).padStart(6, "0")}`,
          ruanganId: defaultRuanganId,
        });
      }
      setUnits(newUnits);
    }

    setStep(2);
  };

  // ── Update unit row ────────────────────────────────────────
  const updateUnit = (index: number, field: keyof UnitRow, value: string) => {
    setUnits((prev) =>
      prev.map((u, i) => (i === index ? { ...u, [field]: value } : u))
    );
  };

  // ── Apply ruangan to all rows ──────────────────────────────
  const [bulkRuanganId, setBulkRuanganId] = useState("");
  const applyBulkRuangan = () => {
    if (!bulkRuanganId) return;
    setUnits((prev) => prev.map((u) => ({ ...u, ruanganId: bulkRuanganId })));
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setStep2Error("");

    // Validate units
    for (let i = 0; i < units.length; i++) {
      if (!units[i].nup.trim()) {
        setStep2Error(`NUP untuk unit ${i + 1} wajib diisi.`);
        return;
      }
      if (!units[i].ruanganId) {
        setStep2Error(`Ruangan untuk unit ${i + 1} wajib dipilih.`);
        return;
      }
    }

    // Check NUP uniqueness within input
    const nupSet = new Set<string>();
    for (let i = 0; i < units.length; i++) {
      const nup = units[i].nup.trim();
      if (nupSet.has(nup)) {
        setStep2Error(`NUP "${nup}" duplikat pada unit ${i + 1}.`);
        return;
      }
      nupSet.add(nup);
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/aset-masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategoriAsetId: formStep1.kategoriAsetId,
          noSuratBelanja: formStep1.noSuratBelanja.trim(),
          tanggalBeli: formStep1.tanggalBeli,
          namaAset: formStep1.namaAset.trim(),
          merekTipe: formStep1.merekTipe.trim() || undefined,
          hargaSatuan: Number(formStep1.hargaSatuan),
          jumlahUnit: Number(formStep1.jumlahUnit),
          units: units.map((u) => ({
            nup: u.nup.trim(),
            ruanganId: u.ruanganId,
          })),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setStep2Error(json.error || "Terjadi kesalahan saat menyimpan.");
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/barang");
      }, 2000);
    } catch {
      setStep2Error("Gagal menyimpan. Periksa koneksi Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────
  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    if (isNaN(num) || num === 0) return "—";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  const selectedKategori = kategoriOptions.find((k) => k.id === formStep1.kategoriAsetId);

  // ── Success overlay ────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-4 ring-emerald-500/10">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white">Berhasil!</h2>
          <p className="text-sm text-slate-400 max-w-sm">
            {Number(formStep1.jumlahUnit)} unit <strong className="text-slate-200">{formStep1.namaAset}</strong> berhasil dicatat dengan NUP unik.
          </p>
          <p className="text-xs text-slate-600">Mengalihkan ke daftar aset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-1">Dashboard &rsaquo; Aset Tetap &rsaquo; Pendataan Baru</p>
        <h1 className="text-2xl font-bold text-white">Pendataan Aset Baru</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Catat pembelian aset beserta detail unit dan NUP masing-masing.
        </p>
      </div>

      {/* ── Stepper ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          step === 1
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
            : "bg-[#0a2240] text-slate-400 border border-[#143550]"
        }`}>
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            step === 1 ? "bg-white/20 text-white" : step > 1 ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"
          }`}>
            {step > 1 ? <CheckCircle2 size={14} /> : "1"}
          </div>
          Data Umum Pembelian
        </div>

        <div className="h-px w-8 bg-[#143550]" />

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          step === 2
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
            : "bg-[#0a2240] text-slate-400 border border-[#143550]"
        }`}>
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            step === 2 ? "bg-white/20 text-white" : "bg-slate-700 text-slate-400"
          }`}>
            2
          </div>
          Detail Per Unit
        </div>
      </div>

      {/* ── Step 1: Data Umum ──────────────────────────── */}
      {step === 1 && (
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#0f2b48]">
            <h2 className="text-base font-bold text-white">Informasi Pembelian</h2>
            <p className="text-xs text-slate-500 mt-0.5">Data umum yang berlaku untuk semua unit dalam pembelian ini</p>
          </div>

          <div className="p-6 space-y-5">
            {step1Error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/40 text-sm text-red-300">
                <AlertTriangle size={16} className="shrink-0 text-red-400" />
                {step1Error}
              </div>
            )}

            {/* Kategori */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tags size={12} />
                Kategori Aset <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <select
                  value={formStep1.kategoriAsetId}
                  onChange={(e) => setFormStep1((f) => ({ ...f, kategoriAsetId: e.target.value }))}
                  disabled={isLoadingOptions}
                  className="w-full pl-4 pr-9 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none transition-colors disabled:opacity-50"
                >
                  <option value="">Pilih kategori aset...</option>
                  {kategoriOptions.map((k) => (
                    <option key={k.id} value={k.id}>{k.namaKategori}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nama & Merek */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={12} />
                  Nama Aset <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formStep1.namaAset}
                  onChange={(e) => setFormStep1((f) => ({ ...f, namaAset: e.target.value }))}
                  placeholder="Contoh: Laptop Lenovo ThinkPad"
                  className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Merek / Tipe
                </label>
                <input
                  type="text"
                  value={formStep1.merekTipe}
                  onChange={(e) => setFormStep1((f) => ({ ...f, merekTipe: e.target.value }))}
                  placeholder="Opsional, contoh: ThinkPad L14 Gen3"
                  className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* No Surat & Tanggal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={12} />
                  No. Surat Belanja <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formStep1.noSuratBelanja}
                  onChange={(e) => setFormStep1((f) => ({ ...f, noSuratBelanja: e.target.value }))}
                  placeholder="SB-2026-001"
                  className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarRange size={12} />
                  Tanggal Beli <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formStep1.tanggalBeli}
                  onChange={(e) => setFormStep1((f) => ({ ...f, tanggalBeli: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Harga & Jumlah */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Harga Satuan (Rp) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formStep1.hargaSatuan}
                  onChange={(e) => setFormStep1((f) => ({ ...f, hargaSatuan: e.target.value }))}
                  placeholder="15000000"
                  min={1}
                  className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash size={12} />
                  Jumlah Unit <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formStep1.jumlahUnit}
                  onChange={(e) => setFormStep1((f) => ({ ...f, jumlahUnit: e.target.value }))}
                  placeholder="10"
                  min={1}
                  max={100}
                  className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-950/30 border border-blue-800/30 text-xs text-blue-300/80">
              <Info size={14} className="shrink-0 mt-0.5 text-blue-400" />
              <span>
                Setelah mengisi data umum, sistem akan otomatis membuat baris input untuk setiap unit sesuai
                <strong> jumlah unit</strong> yang Anda tentukan, masing-masing dengan NUP yang di-generate otomatis.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => router.push("/barang")}
                className="px-5 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleGoToStep2}
                disabled={isLoadingOptions}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all"
              >
                Lanjut ke Detail Unit
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Detail Per Unit ────────────────────── */}
      {step === 2 && (
        <>
          {/* Summary card */}
          <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{formStep1.namaAset}</h3>
                <p className="text-xs text-slate-500">
                  {selectedKategori?.namaKategori || "—"} · {formStep1.merekTipe || "—"} · {formatCurrency(formStep1.hargaSatuan)}/unit
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#0a2240] p-3">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Surat Belanja</p>
                <p className="text-sm text-slate-200 font-medium mt-0.5">{formStep1.noSuratBelanja}</p>
              </div>
              <div className="rounded-xl bg-[#0a2240] p-3">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tanggal Beli</p>
                <p className="text-sm text-slate-200 font-medium mt-0.5">{formStep1.tanggalBeli}</p>
              </div>
              <div className="rounded-xl bg-[#0a2240] p-3">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Nilai</p>
                <p className="text-sm text-emerald-400 font-bold mt-0.5">{formatCurrency(Number(formStep1.hargaSatuan) * Number(formStep1.jumlahUnit))}</p>
              </div>
            </div>
          </div>

          {/* Bulk ruangan apply */}
          <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#0f2b48] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  Detail {units.length} Unit
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">NUP sudah di-generate otomatis. Anda bisa mengedit NUP dan ruangan per-unit.</p>
              </div>
            </div>

            {/* Bulk action */}
            <div className="px-6 py-3 border-b border-[#0a2240] bg-[#061625] flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold shrink-0">Terapkan ruangan ke semua:</span>
              <div className="relative flex-1 max-w-xs">
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <select
                  value={bulkRuanganId}
                  onChange={(e) => setBulkRuanganId(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 bg-[#0a2240] border border-[#143550] rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
                >
                  <option value="">Pilih ruangan...</option>
                  {ruanganOptions.map((r) => (
                    <option key={r.id} value={r.id}>{r.kodeRuangan} — {r.namaRuangan}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={applyBulkRuangan}
                disabled={!bulkRuanganId}
                className="px-3 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 disabled:opacity-40 text-white text-xs font-semibold transition-all"
              >
                Terapkan
              </button>
            </div>

            {step2Error && (
              <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/50 border border-red-800/40 text-sm text-red-300">
                <AlertTriangle size={16} className="shrink-0 text-red-400" />
                {step2Error}
              </div>
            )}

            {/* Unit rows */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#0f2b48]">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">No</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-56">NUP</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ruangan Penempatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0a2240]">
                  {units.map((u, idx) => (
                    <tr key={idx} className="hover:bg-[#0a2240]/30 transition-colors">
                      <td className="px-5 py-3 text-sm text-slate-500 font-medium">{idx + 1}</td>
                      <td className="px-5 py-3">
                        <div className="relative">
                          <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            value={u.nup}
                            onChange={(e) => updateUnit(idx, "nup", e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[#0a2240] border border-[#143550] rounded-lg text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="relative">
                          <DoorOpen size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                          <select
                            value={u.ruanganId}
                            onChange={(e) => updateUnit(idx, "ruanganId", e.target.value)}
                            className="w-full pl-9 pr-9 py-2 bg-[#0a2240] border border-[#143550] rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500 appearance-none transition-colors"
                          >
                            <option value="">Pilih ruangan...</option>
                            {ruanganOptions.map((r) => (
                              <option key={r.id} value={r.id}>{r.kodeRuangan} — {r.namaRuangan}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#0f2b48]">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors font-semibold"
              >
                <ArrowLeft size={14} />
                Kembali
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Simpan Semua Unit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
