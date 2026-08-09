"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Hash,
  Tags,
  DoorOpen,
  FileText,
  CalendarRange,
  Shield,
  Activity,
  ArrowLeftRight,
  Clock,
  AlertTriangle,
  Loader2,
  PackageOpen,
} from "lucide-react";

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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white transition-colors"
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
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">
            <Link href="/barang" className="hover:text-slate-300 transition-colors">Aset Tetap</Link> &rsaquo; Detail Unit
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{aset.batchPembelian.namaAset}</h1>
            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            {aset.batchPembelian.merekTipe || "—"} · {aset.batchPembelian.kategori.namaKategori}
          </p>
        </div>
        <Link
          href="/barang"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0a2240] border border-[#143550] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors font-semibold"
        >
          <ArrowLeft size={14} />
          Kembali
        </Link>
      </div>

      {/* ── Main Info Card ─────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#0f2b48] flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Package size={16} className="text-blue-400" />
            Informasi Unit
          </h2>
          <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ring-1 ${kondisiInfo.color}`}>
            {kondisiInfo.label}
          </span>
        </div>

        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-5">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Hash size={10} /> NUP
            </p>
            <p className="text-lg text-blue-300 font-bold font-mono">{aset.nup}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
              <DoorOpen size={10} /> Ruangan
            </p>
            <p className="text-sm text-slate-200 font-medium">{aset.ruangan.namaRuangan}</p>
            <p className="text-xs text-slate-500">{aset.ruangan.kodeRuangan}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Tags size={10} /> Kategori
            </p>
            <p className="text-sm text-slate-200 font-medium">{aset.batchPembelian.kategori.namaKategori}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Shield size={10} /> Kondisi
            </p>
            <p className={`text-sm font-semibold ${kondisiInfo.color.includes("emerald") ? "text-emerald-400" : kondisiInfo.color.includes("amber") ? "text-amber-400" : "text-red-400"}`}>
              {kondisiInfo.label}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Activity size={10} /> Status
            </p>
            <p className={`text-sm font-semibold ${statusInfo.color.includes("emerald") ? "text-emerald-400" : "text-red-400"}`}>
              {statusInfo.label}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Clock size={10} /> Terdaftar
            </p>
            <p className="text-sm text-slate-300 font-medium">{formatDate(aset.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* ── Purchase Info Card ─────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#0f2b48]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText size={16} className="text-purple-400" />
            Informasi Pembelian
          </h2>
        </div>

        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-5">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">No. Surat Belanja</p>
            <p className="text-sm text-slate-200 font-semibold">{aset.batchPembelian.noSuratBelanja}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tanggal Beli</p>
            <p className="text-sm text-slate-200 font-medium">{formatDate(aset.batchPembelian.tanggalBeli)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Harga Satuan</p>
            <p className="text-sm text-emerald-400 font-bold">{formatCurrency(aset.batchPembelian.hargaSatuan)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Jumlah Unit (Batch)</p>
            <p className="text-sm text-slate-200 font-medium">{aset.batchPembelian.jumlahUnit} unit</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Dicatat Oleh</p>
            <p className="text-sm text-slate-200 font-medium capitalize">{aset.batchPembelian.pencatat.nama}</p>
          </div>
        </div>
      </div>

      {/* ── Riwayat Mutasi ─────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#0f2b48]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-amber-400" />
            Riwayat Mutasi Ruangan
          </h2>
        </div>

        {aset.mutasiAset.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-2 text-slate-600">
              <ArrowLeftRight size={28} strokeWidth={1} />
              <p className="text-sm font-medium">Belum ada riwayat mutasi</p>
              <p className="text-xs">Unit ini masih berada di ruangan awal penempatan</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#0a2240]">
            {aset.mutasiAset.map((m) => (
              <div key={m.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
                  <ArrowLeftRight size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 font-medium">
                    <span className="text-slate-400">{m.ruanganAsal.namaRuangan}</span>
                    <span className="mx-2 text-slate-600">→</span>
                    <span className="text-amber-300">{m.ruanganTujuan.namaRuangan}</span>
                  </p>
                  {m.keterangan && <p className="text-xs text-slate-500 mt-0.5">{m.keterangan}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400 font-medium">{formatDate(m.tanggalMutasi)}</p>
                  <p className="text-[10px] text-slate-600 capitalize">oleh {m.pencatat.nama}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Riwayat Kondisi ────────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#0f2b48]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity size={16} className="text-emerald-400" />
            Riwayat Perubahan Kondisi
          </h2>
        </div>

        {aset.riwayatKondisiAset.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center gap-2 text-slate-600">
              <Activity size={28} strokeWidth={1} />
              <p className="text-sm font-medium">Belum ada perubahan kondisi</p>
              <p className="text-xs">Kondisi unit masih dalam keadaan awal</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#0a2240]">
            {aset.riwayatKondisiAset.map((r) => {
              const lamaInfo = KONDISI_LABELS[r.kondisiLama] || { label: r.kondisiLama, color: "" };
              const baruInfo = KONDISI_LABELS[r.kondisiBaru] || { label: r.kondisiBaru, color: "" };
              return (
                <div key={r.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                    <Activity size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 font-medium">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${lamaInfo.color}`}>{lamaInfo.label}</span>
                      <span className="mx-2 text-slate-600">→</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${baruInfo.color}`}>{baruInfo.label}</span>
                    </p>
                    {r.keterangan && <p className="text-xs text-slate-500 mt-0.5">{r.keterangan}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400 font-medium">{formatDate(r.tanggalPerubahan)}</p>
                    <p className="text-[10px] text-slate-600 capitalize">oleh {r.pencatat.nama}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
