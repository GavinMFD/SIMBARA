"use client";

import React, { useState, useEffect } from "react";
import {
  FileDown,
  Printer,
  Building2,
  Package,
  ArrowLeftRight,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface RuanganOption {
  id: string;
  namaRuangan: string;
  kodeRuangan: string;
  _count: { masterAset: number };
}

type ExportStatus = "idle" | "loading" | "success" | "error";

function useExportStatus() {
  const [status, setStatus] = useState<ExportStatus>("idle");

  const trigger = async (url: string, filename?: string) => {
    setStatus("loading");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename ?? "export.xlsx";
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return { status, trigger };
}

function ExportButton({
  label,
  icon,
  color,
  status,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  status: ExportStatus;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={status === "loading" || disabled}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white transition-all shadow-lg disabled:opacity-50 ${color}`}
    >
      {status === "loading" ? (
        <Loader2 size={16} className="animate-spin" />
      ) : status === "success" ? (
        <CheckCircle2 size={16} />
      ) : status === "error" ? (
        <AlertCircle size={16} />
      ) : (
        icon
      )}
      {status === "success" ? "Berhasil!" : status === "error" ? "Gagal" : label}
    </button>
  );
}

export default function LaporanPage() {
  const [ruanganOptions, setRuanganOptions] = useState<RuanganOption[]>([]);
  const [isLoadingRuangan, setIsLoadingRuangan] = useState(true);
  const [selectedRuangan, setSelectedRuangan] = useState<string[]>([]);

  // Filter states
  const [bulanAtk, setBulanAtk] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [periodeAsetDari, setPeriodeAsetDari] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [periodeAsetSampai, setPeriodeAsetSampai] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Export status per section
  const atkExport = useExportStatus();
  const asetExport = useExportStatus();
  const saktiExport = useExportStatus();

  useEffect(() => {
    fetch("/api/ruangan")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRuanganOptions(j.data);
      })
      .finally(() => setIsLoadingRuangan(false));
  }, []);

  const toggleRuangan = (id: string) => {
    setSelectedRuangan((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openDirPrint = () => {
    const ids = selectedRuangan.length > 0 ? selectedRuangan : ruanganOptions.map((r) => r.id);
    const params = ids.map((id) => `ruanganId=${id}`).join("&");
    window.open(`/laporan/dir?${params}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <p className="text-xs text-slate-500 font-medium mb-1">
          Dashboard &rsaquo; Laporan
        </p>
        <h1 className="text-2xl font-bold text-white">Laporan & Ekspor</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Cetak DIR, ekspor rekap ATK, dan laporan aset tetap
        </p>
      </div>

      {/* ── Section 1: Cetak DIR ───────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#0f2b48] flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Cetak DIR (Daftar Inventaris Ruangan)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              US-032 & US-033 — Pilih satu atau lebih ruangan, lalu cetak dokumen DIR resmi ke PDF
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Pilih Ruangan (kosongkan untuk cetak semua)
            </p>
            {isLoadingRuangan ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Memuat data ruangan...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {ruanganOptions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => toggleRuangan(r.id)}
                    className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all ${
                      selectedRuangan.includes(r.id)
                        ? "border-blue-500 bg-blue-500/15 text-blue-300"
                        : "border-[#143550] bg-[#0a2240] text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        selectedRuangan.includes(r.id)
                          ? "border-blue-400 bg-blue-400"
                          : "border-slate-600"
                      }`}
                    >
                      {selectedRuangan.includes(r.id) && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          viewBox="0 0 10 8"
                          fill="none"
                        >
                          <path
                            d="M1 4l3 3 5-6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight truncate">
                        {r.namaRuangan}
                      </p>
                      <p className="text-[10px] opacity-60 mt-0.5">
                        {r.kodeRuangan} · {r._count.masterAset} aset
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={openDirPrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
            >
              <Printer size={16} />
              {selectedRuangan.length > 0
                ? `Cetak DIR (${selectedRuangan.length} ruangan)`
                : "Cetak Semua DIR"}
            </button>
            {selectedRuangan.length > 0 && (
              <button
                onClick={() => setSelectedRuangan([])}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Reset pilihan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Rekap ATK Bulanan ──────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#0f2b48] flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
            <Package size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Rekap ATK Bulanan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              US-034 — Qty & nilai masuk/keluar per No. Surat Belanja, diekspor ke Excel
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Periode Bulan
              </label>
              <input
                type="month"
                value={bulanAtk}
                onChange={(e) => setBulanAtk(e.target.value)}
                className="px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <ExportButton
              label="Export Excel"
              icon={<FileSpreadsheet size={16} />}
              color="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              status={atkExport.status}
              onClick={() =>
                atkExport.trigger(
                  `/api/laporan/rekap-atk/export?bulan=${bulanAtk}`,
                  `rekap-atk-${bulanAtk}.xlsx`
                )
              }
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Rekap Aset Tetap ───────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#0f2b48] flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
            <ArrowLeftRight size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Rekap Aset Tetap (Mutasi & Kondisi)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              US-035 — Riwayat mutasi & perubahan kondisi dalam 1 file Excel (2 sheet)
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={periodeAsetDari}
                onChange={(e) => setPeriodeAsetDari(e.target.value)}
                className="px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={periodeAsetSampai}
                onChange={(e) => setPeriodeAsetSampai(e.target.value)}
                className="px-4 py-2.5 bg-[#0a2240] border border-[#143550] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <ExportButton
              label="Export Excel (2 Sheet)"
              icon={<FileSpreadsheet size={16} />}
              color="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
              status={asetExport.status}
              onClick={() =>
                asetExport.trigger(
                  `/api/laporan/rekap-aset/export?dari=${periodeAsetDari}&sampai=${periodeAsetSampai}`,
                  `rekap-aset-${periodeAsetDari}-${periodeAsetSampai}.xlsx`
                )
              }
            />
          </div>
        </div>
      </div>

      {/* ── Section 4: Format SAKTI ────────────────────────── */}
      <div className="rounded-2xl bg-[#071a2e] border border-[#0f2b48] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#0f2b48] flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
            <FileDown size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Rekap Format SAKTI
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              US-036 — Export seluruh aset aktif dalam format kolom standar aplikasi SAKTI
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-xs text-purple-300">
              File Excel ini mengikuti struktur kolom SAKTI: <strong>Kode Barang (NUP)</strong>, Nama BMN, Kategori, Merek/Tipe, Tahun Perolehan, Satuan, Jumlah, Harga Satuan, Nilai Perolehan, Kondisi, Lokasi Ruangan.
            </p>
          </div>
          <ExportButton
            label="Export Format SAKTI (.xlsx)"
            icon={<FileSpreadsheet size={16} />}
            color="bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
            status={saktiExport.status}
            onClick={() =>
              saktiExport.trigger(
                `/api/laporan/sakti/export`,
                `rekap-sakti-${new Date().toISOString().slice(0, 10)}.xlsx`
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
