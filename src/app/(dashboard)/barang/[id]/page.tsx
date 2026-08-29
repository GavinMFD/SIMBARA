"use client";

import React, { useState, useEffect, useCallback, use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Hash,
  Tags,
  DoorOpen,
  FileText,
  Shield,
  Activity,
  ArrowLeftRight,
  Clock,
  Loader2,
  PackageOpen,
  Printer,
  ShoppingCart,
  Pencil,
  X
} from "lucide-react";
import Image from "next/image";

// ─── Interfaces ──────────────────────────────────────────────
interface AsetDetail {
  id: string;
  nup: string;
  kondisi: string;
  statusAset: string;
  createdAt: string;
  batchPembelian: {
    namaAset: string;
    merekTipe: string | null;
    hargaSatuan: number | string;
    noSuratBelanja: string;
    tanggalBeli: string;
    jumlahUnit: number;
    kategori: { namaKategori: string };
    pencatat: { nama: string };
  };
  ruangan: {
    kodeRuangan: string;
    namaRuangan: string;
  };
  mutasiAset: Array<{
    id: string;
    tanggalMutasi: string;
    keterangan: string | null;
    ruanganAsal: { namaRuangan: string; kodeRuangan: string };
    ruanganTujuan: { namaRuangan: string; kodeRuangan: string };
    pencatat: { nama: string };
  }>;
  riwayatKondisiAset: Array<{
    id: string;
    kondisiLama: string;
    kondisiBaru: string;
    tanggalPerubahan: string;
    keterangan: string | null;
    pencatat: { nama: string };
  }>;
}

const KONDISI_LABELS: Record<string, { label: string; color: string }> = {
  baik: { label: "Baik", color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20" },
  rusak_ringan: { label: "Rusak Ringan", color: "bg-amber-500/15 text-amber-400 ring-amber-500/20" },
  rusak_berat: { label: "Rusak Berat", color: "bg-red-500/15 text-red-400 ring-red-500/20" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aktif: { label: "Aktif", color: "bg-emerald-500/15 text-emerald-400" },
  non_aktif: { label: "Non-Aktif", color: "bg-red-500/15 text-red-400" },
};

export default function DetailAsetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [aset, setAset] = useState<AsetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal Kondisi state
  const [isKondisiOpen, setIsKondisiOpen] = useState(false);
  const [kondisiBaru, setKondisiBaru] = useState("");
  const [keteranganKondisi, setKeteranganKondisi] = useState("");
  const [tanggalKondisi, setTanggalKondisi] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmittingKondisi, setIsSubmittingKondisi] = useState(false);
  const [errorKondisi, setErrorKondisi] = useState("");

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/barang/${id}`);
      const json = await res.json();
      if (json.success) {
        setAset(json.data);
      } else {
        setError(json.error || "Aset tidak ditemukan.");
      }
    } catch {
      setError("Gagal memuat data aset.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleUpdateKondisi = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorKondisi("");

    if (!kondisiBaru) return setErrorKondisi("Pilih kondisi baru.");
    if (!keteranganKondisi.trim()) return setErrorKondisi("Keterangan wajib diisi.");

    setIsSubmittingKondisi(true);
    try {
      const res = await fetch(`/api/barang/${id}/kondisi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kondisiBaru,
          keterangan: keteranganKondisi,
          tanggalPerubahan: tanggalKondisi,
          dicatatOleh: "user-placeholder", // placeholder
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsKondisiOpen(false);
        fetchDetail(); // Refresh data and timeline
      } else {
        setErrorKondisi(json.error || "Gagal update kondisi.");
      }
    } catch {
      setErrorKondisi("Kesalahan jaringan.");
    } finally {
      setIsSubmittingKondisi(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Makassar",
    });
  };

  // ── Timeline Data ──────────────────────────────────────────
  const timelineEvents = useMemo(() => {
    if (!aset) return [];
    
    const events: any[] = [];
    
    // 1. Pembelian
    events.push({
      id: `beli-${aset.id}`,
      type: 'pembelian',
      date: aset.batchPembelian.tanggalBeli,
      timestamp: new Date(aset.batchPembelian.tanggalBeli).getTime(),
      title: 'Pembelian Aset',
      pencatat: aset.batchPembelian.pencatat.nama,
      icon: <ShoppingCart size={16} />,
      iconBg: 'bg-purple-500/15 text-purple-400',
      content: (
        <div className="text-sm">
          <p className="text-slate-300 print:text-black">Dicatat dari surat belanja No: <span className="font-semibold text-slate-200 print:text-black">{aset.batchPembelian.noSuratBelanja}</span></p>
          <p className="text-slate-400 mt-1 print:text-slate-700">Harga Satuan: {formatCurrency(aset.batchPembelian.hargaSatuan)}</p>
        </div>
      )
    });
    
    // 2. Mutasi
    aset.mutasiAset.forEach(m => {
      events.push({
        id: `mutasi-${m.id}`,
        type: 'mutasi',
        date: m.tanggalMutasi,
        timestamp: new Date(m.tanggalMutasi).getTime(),
        title: 'Mutasi Ruangan',
        pencatat: m.pencatat.nama,
        icon: <ArrowLeftRight size={16} />,
        iconBg: 'bg-amber-500/15 text-amber-400',
        content: (
          <div className="text-sm">
            <p className="text-slate-300 print:text-black">
              Dipindahkan dari <span className="font-semibold text-slate-200 print:text-black">{m.ruanganAsal.namaRuangan}</span> ke <span className="font-semibold text-amber-300 print:text-black">{m.ruanganTujuan.namaRuangan}</span>
            </p>
            {m.keterangan && <p className="text-slate-400 mt-1 italic print:text-slate-700">&quot;{m.keterangan}&quot;</p>}
          </div>
        )
      });
    });
    
    // 3. Kondisi
    aset.riwayatKondisiAset.forEach(r => {
      const lamaInfo = KONDISI_LABELS[r.kondisiLama] || { label: r.kondisiLama, color: "" };
      const baruInfo = KONDISI_LABELS[r.kondisiBaru] || { label: r.kondisiBaru, color: "" };
      events.push({
        id: `kondisi-${r.id}`,
        type: 'kondisi',
        date: r.tanggalPerubahan,
        timestamp: new Date(r.tanggalPerubahan).getTime(),
        title: 'Perubahan Kondisi',
        pencatat: r.pencatat.nama,
        icon: <Activity size={16} />,
        iconBg: 'bg-emerald-500/15 text-emerald-400',
        content: (
          <div className="text-sm">
            <p className="text-slate-300 print:text-black flex items-center gap-2 flex-wrap">
              Kondisi diperbarui dari
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${lamaInfo.color} print:border print:border-black print:text-black print:bg-transparent`}>{lamaInfo.label}</span>
              menjadi
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${baruInfo.color} print:border print:border-black print:text-black print:bg-transparent`}>{baruInfo.label}</span>
            </p>
            {r.keterangan && <p className="text-slate-400 mt-1 italic print:text-slate-700">&quot;{r.keterangan}&quot;</p>}
          </div>
        )
      });
    });
    
    // Sort descending (terbaru di atas)
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [aset]);

  // ── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm font-medium">Memuat detail aset...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error || !aset) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <PackageOpen size={40} strokeWidth={1} />
          <p className="text-sm font-medium">{error || "Aset tidak ditemukan."}</p>
          <Link
            href="/barang"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white transition-colors print:hidden"
          >
            <ArrowLeft size={14} />
            Kembali ke Daftar
          </Link>
        </div>
      </div>
    );
  }

  const kondisiInfo = KONDISI_LABELS[aset.kondisi] || { label: aset.kondisi, color: "bg-slate-700/30 text-slate-400 ring-slate-700/20" };
  const statusInfo = STATUS_LABELS[aset.statusAset] || { label: aset.statusAset, color: "bg-slate-700/30 text-slate-400" };

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:max-w-none print:m-0 print:space-y-8">
      {/* ── Print Header (Only visible when printing) ──────── */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-black pb-4 mb-8">
        <div className="flex items-center gap-4">
          <Image src="/logo-simbara.png" alt="Logo" width={50} height={50} className="grayscale" />
          <div>
            <h1 className="text-xl font-bold text-black tracking-wider uppercase">SIMBARA</h1>
            <p className="text-sm text-gray-700">Sistem Informasi Manajemen BMN Terpadu</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-black uppercase">Riwayat Aset Individual</h2>
          <p className="text-sm text-gray-700">Dicetak pada: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}</p>
        </div>
      </div>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1 print:hidden">
            <Link href="/barang" className="hover:text-slate-300 transition-colors">Aset Tetap</Link> &rsaquo; Detail Unit
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white print:text-black">{aset.batchPembelian.namaAset}</h1>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.color} print:border print:border-black print:text-black print:bg-transparent`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5 print:text-gray-700">
            {aset.batchPembelian.merekTipe || "—"} · {aset.batchPembelian.kategori.namaKategori}
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={() => {
              setKondisiBaru(aset.kondisi);
              setKeteranganKondisi("");
              setErrorKondisi("");
              setIsKondisiOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-colors"
          >
            <Pencil size={16} />
            Update Kondisi
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-colors"
          >
            <Printer size={16} />
            Cetak Riwayat
          </button>
          <Link
            href="/barang"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors font-semibold"
          >
            <ArrowLeft size={14} />
            Kembali
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
        {/* ── Main Info Card ─────────────────────────────── */}
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden print:bg-transparent print:border-black print:rounded-none">
          <div className="px-6 py-4 border-b border-[#0f2b48] print:border-black flex items-center justify-between">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <Package size={16} className="text-blue-400 print:text-black" />
              Informasi Unit
            </h2>
            <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ring-1 ${kondisiInfo.color} print:border-black print:text-black print:bg-transparent`}>
              {kondisiInfo.label}
            </span>
          </div>
          <div className="p-6 grid grid-cols-2 gap-5 print:p-4">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 print:text-gray-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Hash size={10} /> NUP
              </p>
              <p className="text-lg text-blue-300 print:text-black font-bold font-mono">{aset.nup}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 print:text-gray-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                <DoorOpen size={10} /> Ruangan
              </p>
              <p className="text-sm text-slate-200 print:text-black font-medium">{aset.ruangan.namaRuangan}</p>
              <p className="text-xs text-slate-500 print:text-gray-600">{aset.ruangan.kodeRuangan}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 print:text-gray-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Clock size={10} /> Terdaftar
              </p>
              <p className="text-sm text-slate-300 print:text-black font-medium">{formatDate(aset.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* ── Purchase Info Card ─────────────────────────── */}
        <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden print:bg-transparent print:border-black print:rounded-none">
          <div className="px-6 py-4 border-b border-[#0f2b48] print:border-black">
            <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
              <FileText size={16} className="text-purple-400 print:text-black" />
              Informasi Pembelian
            </h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-5 print:p-4">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 print:text-gray-600 font-semibold uppercase tracking-wider">No. Surat Belanja</p>
              <p className="text-sm text-slate-200 print:text-black font-semibold">{aset.batchPembelian.noSuratBelanja}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 print:text-gray-600 font-semibold uppercase tracking-wider">Tanggal Beli</p>
              <p className="text-sm text-slate-200 print:text-black font-medium">{formatDate(aset.batchPembelian.tanggalBeli)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 print:text-gray-600 font-semibold uppercase tracking-wider">Harga Satuan</p>
              <p className="text-sm text-emerald-400 print:text-black font-bold">{formatCurrency(aset.batchPembelian.hargaSatuan)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 print:text-gray-600 font-semibold uppercase tracking-wider">Dicatat Oleh</p>
              <p className="text-sm text-slate-200 print:text-black font-medium capitalize">{aset.batchPembelian.pencatat.nama}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Unified Timeline ─────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden print:bg-transparent print:border-black print:rounded-none">
        <div className="px-6 py-4 border-b border-[#0f2b48] print:border-black">
          <h2 className="text-base font-bold text-white print:text-black flex items-center gap-2">
            <Clock size={16} className="text-blue-400 print:text-black" />
            Riwayat Aset (Timeline)
          </h2>
        </div>

        <div className="p-6 print:p-4">
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#143550] before:to-transparent print:before:bg-black">
            {timelineEvents.map((event, idx) => (
              <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#071a2e] print:border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${event.iconBg} print:bg-white print:text-black print:border-2 print:border-solid print:border-black z-10`}>
                  {event.icon}
                </div>
                
                {/* Content Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0a2240] print:bg-transparent print:border print:border-black p-4 rounded-xl border border-[#143550] shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-200 print:text-black">{event.title}</h3>
                    <time className="text-xs font-semibold text-slate-500 print:text-gray-700 bg-[#071a2e] print:bg-transparent px-2 py-1 rounded-md print:p-0">
                      {formatDate(event.date)}
                    </time>
                  </div>
                  <div className="mb-3">
                    {event.content}
                  </div>
                  <div className="text-[10px] text-slate-500 print:text-gray-600 font-medium uppercase tracking-wider flex items-center gap-1 mt-3 pt-3 border-t border-[#143550] print:border-gray-300">
                    Dicatat oleh: <span className="text-slate-300 print:text-black capitalize">{event.pencatat}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal Update Kondisi ── */}
      {isKondisiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmittingKondisi && setIsKondisiOpen(false)} />
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#071a2e] border border-[#0f2b48] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#0f2b48]">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity size={18} className="text-emerald-400" />
                Update Kondisi Fisik
              </h2>
              <button onClick={() => !isSubmittingKondisi && setIsKondisiOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-[#0f2b48] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateKondisi}>
              <div className="p-6 space-y-4">
                {errorKondisi && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium">
                    {errorKondisi}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kondisi Baru <span className="text-red-400">*</span></label>
                  <select
                    value={kondisiBaru}
                    onChange={(e) => setKondisiBaru(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="baik">Baik</option>
                    <option value="rusak_ringan">Rusak Ringan</option>
                    <option value="rusak_berat">Rusak Berat</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal <span className="text-red-400">*</span></label>
                  <input
                    type="date"
                    value={tanggalKondisi}
                    onChange={(e) => setTanggalKondisi(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Keterangan / Alasan <span className="text-red-400">*</span></label>
                  <textarea
                    value={keteranganKondisi}
                    onChange={(e) => setKeteranganKondisi(e.target.value)}
                    rows={3}
                    placeholder="Wajib diisi..."
                    className="w-full px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#0f2b48]">
                <button type="button" onClick={() => setIsKondisiOpen(false)} disabled={isSubmittingKondisi} className="px-4 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white transition-colors font-semibold">Batal</button>
                <button type="submit" disabled={isSubmittingKondisi} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                  {isSubmittingKondisi && <Loader2 size={14} className="animate-spin" />}
                  Simpan Kondisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
