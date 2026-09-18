"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Package, 
  FileText, 
  Calendar, 
  Tag, 
  User, 
  Loader2,
  AlertCircle
} from "lucide-react";

export default function BatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchBatchDetails();
    }
  }, [id]);

  const fetchBatchDetails = async () => {
    try {
      const res = await fetch(`/api/stok-masuk/${id}`);
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Gagal memuat detail batch.");
      }
    } catch (e) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm font-medium">Memuat detail batch...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-400">
          <AlertCircle size={48} />
        </div>
        <p className="text-lg font-bold text-white">{error || "Data tidak ditemukan."}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl bg-[#0a2240] text-slate-300 hover:text-white hover:bg-[#0f2b48] transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(val));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Makassar",
    });
  };

  const usagePercent = data.qtyMasuk > 0 ? ((data.qtyMasuk - data.sisaQty) / data.qtyMasuk) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium mb-3 transition-colors"
        >
          <ArrowLeft size={14} /> Kembali
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Detail Batch Stok Masuk</h1>
            <p className="text-sm text-slate-400 mt-1">
              Rincian batch beserta riwayat transaksi yang memanfaatkannya.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Kolom Kiri: Informasi Batch ──────────────────── */}
        <div className="space-y-6">
          <div className="bg-[#071a2e] border border-[#0f2b48] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#0f2b48] bg-[#0a2240]/50 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Package size={18} />
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">Informasi Batch</h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Barang</label>
                <div className="font-semibold text-white text-base">
                  {data.masterBarang.namaBarang}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">No Surat Belanja</label>
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-blue-400" />
                  <span className="font-semibold text-slate-200">{data.noSuratBelanja}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Tanggal Belanja</label>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="font-medium text-slate-300">{formatDate(data.tanggalBelanja).split(' ')[0]}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Harga Satuan</label>
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-amber-400" />
                  <span className="font-medium text-slate-300">{formatCurrency(data.hargaSatuan)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Dicatat Oleh</label>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-purple-400" />
                  <span className="font-medium text-slate-300">{data.pencatat.nama}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#0f2b48]">
                <div className="flex items-end justify-between mb-2">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-medium">Qty Awal</label>
                    <div className="font-bold text-white text-lg">{data.qtyMasuk} <span className="text-xs font-normal text-slate-400">{data.masterBarang.satuan}</span></div>
                  </div>
                  <div className="space-y-1 text-right">
                    <label className="text-xs text-slate-500 font-medium">Sisa Qty</label>
                    <div className={`font-bold text-lg ${data.sisaQty === 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {data.sisaQty} <span className="text-xs font-normal text-slate-400">{data.masterBarang.satuan}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#0a2240] rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full transition-all duration-500 ${usagePercent >= 100 ? "bg-red-500" : usagePercent >= 50 ? "bg-orange-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-right text-slate-500 mt-1">{usagePercent.toFixed(1)}% Terpakai</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Kolom Kanan: Tabel Riwayat Pemakaian ────────── */}
        <div className="lg:col-span-2">
          <div className="bg-[#071a2e] border border-[#0f2b48] rounded-2xl overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 border-b border-[#0f2b48] bg-[#0a2240]/50">
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">Riwayat Pemakaian (Transaksi)</h2>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#0a2240] border-b border-[#0f2b48] text-xs uppercase text-slate-400 sticky top-0">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Waktu Transaksi</th>
                    <th className="px-5 py-3 font-semibold">Pegawai / Pemohon</th>
                    <th className="px-5 py-3 font-semibold">Unit Kerja</th>
                    <th className="px-5 py-3 font-semibold text-center">Qty Terpakai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0f2b48]">
                  {data.transaksiPersediaanDetail.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <Package size={32} className="text-slate-600 mb-2" />
                          <p>Belum ada transaksi yang menggunakan batch ini.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.transaksiPersediaanDetail.map((detail: any) => (
                      <tr key={detail.id} className="hover:bg-[#0a2240]/50 transition-colors">
                        <td className="px-5 py-3 text-xs">
                          {formatDate(detail.transaksiPersediaan.tanggalPengambilan)}
                        </td>
                        <td className="px-5 py-3 font-medium text-white">
                          {detail.transaksiPersediaan.pegawai.nama}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400">
                          {detail.transaksiPersediaan.pegawai.unitKerja}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-xs rounded-lg">
                            {detail.qtyDipakai} {data.masterBarang.satuan}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
