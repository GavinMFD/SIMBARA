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

  useEffect(() => {
    if (data) {
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
    month: "2-digit",
    year: "numeric",
  }).replace(/\//g, '-');

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white flex flex-col items-center gap-6">
      {/* Print button - hidden when printing */}
      <div className="print:hidden w-full max-w-[210mm] flex justify-end gap-2 px-4 md:px-0">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold shadow hover:bg-blue-700 flex items-center gap-2"
        >
          🖨️ Cetak / Simpan PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-xs font-semibold hover:bg-gray-50"
        >
          Tutup
        </button>
      </div>

      {/* DIR Document — one per ruangan */}
      {data.ruanganList.map((ruangan, rIdx) => (
        <div
          key={ruangan.id}
          className="bg-white text-black font-sans w-full max-w-[210mm] min-h-[297mm] p-8 print:p-0 print:w-full print:h-full flex flex-col shadow-lg print:shadow-none"
          style={{ pageBreakAfter: rIdx < data.ruanganList.length - 1 ? "always" : "auto" }}
        >
          {/* Top sections */}
          <div className="flex justify-between items-start text-[11px] font-bold leading-tight mb-6">
            <div>
              <p>BADAN PUSAT STATISTIK</p>
              <p>BADAN PUSAT STATISTIK</p>
              <p>BPS KOTA PALU</p>
            </div>
            <div>
              <table className="text-[11px]">
                <tbody>
                  <tr>
                    <td className="pr-4 pb-0.5">Tgl Cetak</td>
                    <td className="pb-0.5">: {printDate}</td>
                  </tr>
                  <tr>
                    <td className="pr-4">Halaman</td>
                    <td>: 1</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-base font-bold mb-4 uppercase">DAFTAR BARANG RUANGAN</h1>
          </div>

          <div className="flex justify-between items-end text-[10px] font-bold mb-1">
            <div className="w-1/2">
              <table className="text-[10px]">
                <tbody>
                  <tr>
                    <td className="pr-2 pb-0.5">NAMA UPB</td>
                    <td className="pb-0.5">: BPS KOTA PALU</td>
                  </tr>
                  <tr>
                    <td className="pr-2">KODE UPB</td>
                    <td>: 054.01.18.675547.000.KD</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="w-1/2">
              <table className="text-[10px]">
                <tbody>
                  <tr>
                    <td className="pr-2 pb-0.5">NAMA RUANGAN</td>
                    <td className="pb-0.5">: {ruangan.namaRuangan.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td className="pr-2">KODE RUANGAN</td>
                    <td>: {ruangan.kodeRuangan}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-[10px] text-center mb-1">
            <thead>
              <tr>
                <th className="border border-black p-1 w-6" rowSpan={2}>No.</th>
                <th className="border border-black p-1 w-10" rowSpan={2}>No Urut<br/>Pendaft</th>
                <th className="border border-black p-1" rowSpan={2}>Nama Barang</th>
                <th className="border border-black p-1" colSpan={3}>Identitas Barang</th>
                <th className="border border-black p-1 w-12" rowSpan={2}>Jumlah<br/>Barang</th>
                <th className="border border-black p-1 w-16" rowSpan={2}>Penguasaan</th>
                <th className="border border-black p-1 w-16" rowSpan={2}>Keterangan</th>
              </tr>
              <tr>
                <th className="border border-black p-1 w-24">Merk/Type</th>
                <th className="border border-black p-1 w-24">Kd Barang</th>
                <th className="border border-black p-1 w-12">Th.Pbln</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black p-0.5 text-center font-normal text-[9px]">1</th>
                <th className="border border-black p-0.5 text-center font-normal text-[9px]">2</th>
                <th className="border border-black p-0.5 text-center font-normal text-[9px]">3</th>
                <th className="border border-black p-0.5 text-center font-normal text-[9px]">4</th>
                <th className="border border-black p-0.5 text-center font-normal text-[9px]">5</th>
                <th className="border border-black p-0.5 text-center font-normal text-[9px]">6</th>
                <th className="border border-black p-0.5 text-center font-normal text-[9px]">7</th>
                <th className="border border-black p-0.5 text-center font-normal text-[9px]">8</th>
                <th className="border border-black p-0.5 text-center font-normal text-[9px]">9</th>
              </tr>
            </thead>
            <tbody>
              {ruangan.masterAset.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-black p-4 text-center">
                    Tidak ada aset di ruangan ini.
                  </td>
                </tr>
              ) : (
                ruangan.masterAset.map((aset, aIdx) => (
                  <tr key={aset.id}>
                    <td className="border-x border-black px-1 py-1 text-center align-top">{aIdx + 1}</td>
                    <td className="border-x border-black px-1 py-1 text-center align-top">{aset.nup}</td>
                    <td className="border-x border-black px-1 py-1 text-left align-top">{aset.batchPembelian.namaAset}</td>
                    <td className="border-x border-black px-1 py-1 text-left align-top">{aset.batchPembelian.merekTipe || "-"}</td>
                    <td className="border-x border-black px-1 py-1 text-center align-top">-</td>
                    <td className="border-x border-black px-1 py-1 text-center align-top">
                      {new Date(aset.batchPembelian.tanggalBeli).getFullYear()}
                    </td>
                    <td className="border-x border-black px-1 py-1 text-center align-top">
                      <div className="flex justify-between w-full px-0.5">
                        <span>1</span>
                        <span>Buah</span>
                      </div>
                    </td>
                    <td className="border-x border-black px-1 py-1 text-center align-top">Milik Sendiri</td>
                    <td className="border-x border-black px-1 py-1 text-left align-top"></td>
                  </tr>
                ))
              )}
              {/* Force bottom border */}
              <tr className="border-t border-black">
                <td colSpan={9} className="p-0 border-0 h-0"></td>
              </tr>
            </tbody>
          </table>

          <div className="border border-black p-1 text-[9px] text-center mb-6">
            Tidak dibenarkan memindahkan barang-barang yang ada pada daftar ini tanpa sepengetahuan penanggung jawab Unit Akuntansi Kuasa<br/>
            Pengguna Barang (UAKPB) dan penanggung jawab ruangan ini
          </div>

          <div className="flex justify-between text-[11px] px-8 mt-auto pt-6">
            <div className="text-center">
              <p>Penanggung Jawab UAKPB,</p>
              <p>{data.ttd.kepala?.jabatan ?? "Kepala BPS Kota Palu"}</p>
              <div className="h-16 mt-1"></div>
              <p className="font-bold underline">{data.ttd.kepala?.namaPejabat ?? "....................................."}</p>
              <p>NIP. {data.ttd.kepala?.nip ?? "................................."}</p>
            </div>
            <div className="text-center">
              <p>Palu, &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {new Date().getFullYear()}</p>
              <p>{data.ttd.kasubag?.jabatan ?? "Penanggung Jawab Ruangan"}</p>
              <div className="h-16 mt-1"></div>
              <p className="font-bold underline">{data.ttd.kasubag?.namaPejabat ?? "....................................."}</p>
              <p>NIP. {data.ttd.kasubag?.nip ?? "................................."}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
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
