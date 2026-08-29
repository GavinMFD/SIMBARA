"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AsetInRuangan {
  id: string;
  nup: string;
  kondisi: string;
  batchPembelian: {
    namaAset: string;
    merekTipe: string | null;
    hargaSatuan: number | string;
    tanggalBeli: string;
    kategori: { namaKategori: string };
  };
}

interface RuanganData {
  id: string;
  kodeRuangan: string;
  namaRuangan: string;
  lantaiLokasi: string | null;
  masterAset: AsetInRuangan[];
}

interface DirData {
  ruanganList: RuanganData[];
  ttd: {
    kepala: { namaPejabat: string; nip: string; jabatan: string } | null;
    kasubag: { namaPejabat: string; nip: string; jabatan: string } | null;
  };
  generatedAt: string;
}

const KONDISI_LABELS: Record<string, string> = {
  baik: "Baik",
  rusak_ringan: "Rusak Ringan",
  rusak_berat: "Rusak Berat",
};

function formatCurrency(val: number | string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(val));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function DirContent() {
  const searchParams = useSearchParams();
  const ruanganIds = searchParams.getAll("ruanganId");

  const [data, setData] = useState<DirData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const params = ruanganIds.map((id) => `ruanganId=${id}`).join("&");
        const res = await fetch(`/api/laporan/dir?${params}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Gagal memuat data DIR.");
        }
      } catch {
        setError("Terjadi kesalahan saat memuat data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Auto-print after data loads
  useEffect(() => {
    if (data) {
      // Small delay to ensure render is complete
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white gap-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-gray-600 font-medium">Mempersiapkan dokumen DIR...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-red-600 font-medium">{error || "Data tidak ditemukan."}</p>
      </div>
    );
  }

  const printDate = new Date(data.generatedAt).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Print button - hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 flex gap-3 z-50">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-lg hover:bg-blue-700"
        >
          🖨️ Cetak / Simpan PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300"
        >
          Tutup
        </button>
      </div>

      {/* DIR Document — one per ruangan */}
      {data.ruanganList.map((ruangan, rIdx) => (
        <div
          key={ruangan.id}
          className="dir-page bg-white text-black p-10 max-w-[210mm] mx-auto print:mx-0 print:p-8"
          style={{ pageBreakAfter: rIdx < data.ruanganList.length - 1 ? "always" : "auto" }}
        >
          {/* ── KOP SURAT ─────────────────────────────────────── */}
          <div className="border-b-4 border-black pb-3 mb-6 text-center">
            <h1 className="text-lg font-bold uppercase tracking-wide">
              BADAN PUSAT STATISTIK KOTA PALU
            </h1>
            <p className="text-sm text-gray-700">
              Jl. Prof. Moh. Yamin No.19, Kota Palu, Sulawesi Tengah
            </p>
          </div>

          {/* ── JUDUL DOKUMEN ─────────────────────────────────── */}
          <div className="text-center mb-6">
            <h2 className="text-base font-bold uppercase tracking-widest">
              Daftar Inventaris Ruangan (DIR)
            </h2>
            <p className="text-sm mt-1 font-semibold">
              {ruangan.namaRuangan}
              {ruangan.lantaiLokasi ? ` — ${ruangan.lantaiLokasi}` : ""}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">Kode: {ruangan.kodeRuangan}</p>
          </div>

          {/* ── TABEL ASET ────────────────────────────────────── */}
          <table className="w-full border-collapse text-xs mb-8">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="border border-gray-400 px-2 py-1.5 text-center w-8">No</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center w-20">NUP</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left">Nama Aset</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left">Merek / Tipe</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center w-16">Thn</th>
                <th className="border border-gray-400 px-2 py-1.5 text-right w-28">Harga Satuan</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center w-20">Kondisi</th>
                <th className="border border-gray-400 px-2 py-1.5 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {ruangan.masterAset.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-gray-300 px-2 py-4 text-center text-gray-400">
                    Tidak ada aset aktif di ruangan ini.
                  </td>
                </tr>
              ) : (
                ruangan.masterAset.map((aset, aIdx) => (
                  <tr key={aset.id} className={aIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border border-gray-300 px-2 py-1 text-center">{aIdx + 1}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center font-mono font-bold">{aset.nup}</td>
                    <td className="border border-gray-300 px-2 py-1">{aset.batchPembelian.namaAset}</td>
                    <td className="border border-gray-300 px-2 py-1">{aset.batchPembelian.merekTipe || "—"}</td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {new Date(aset.batchPembelian.tanggalBeli).getFullYear()}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right">
                      {formatCurrency(aset.batchPembelian.hargaSatuan)}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {KONDISI_LABELS[aset.kondisi] ?? aset.kondisi}
                    </td>
                    <td className="border border-gray-300 px-2 py-1"></td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-100">
                <td colSpan={2} className="border border-gray-400 px-2 py-1.5 text-center">Jumlah</td>
                <td colSpan={6} className="border border-gray-400 px-2 py-1.5">
                  {ruangan.masterAset.length} unit aset aktif
                </td>
              </tr>
            </tfoot>
          </table>

          {/* ── TANDA TANGAN ──────────────────────────────────── */}
          <div className="flex justify-between mt-12 text-xs">
            <div className="text-center">
              <p>Mengetahui,</p>
              <p className="font-semibold">{data.ttd.kepala?.jabatan ?? "Kepala BPS Kota Palu"}</p>
              <div className="h-16 mt-1"></div>
              <p className="font-bold underline">{data.ttd.kepala?.namaPejabat ?? "....................................."}</p>
              <p>NIP. {data.ttd.kepala?.nip ?? "................................."}</p>
            </div>
            <div className="text-center">
              <p>Palu, {printDate}</p>
              <p className="font-semibold">{data.ttd.kasubag?.jabatan ?? "Kasubag Umum"}</p>
              <div className="h-16 mt-1"></div>
              <p className="font-bold underline">{data.ttd.kasubag?.namaPejabat ?? "....................................."}</p>
              <p>NIP. {data.ttd.kasubag?.nip ?? "................................."}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function DirPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      }
    >
      <DirContent />
    </Suspense>
  );
}
