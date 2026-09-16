"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MutasiData {
  id: string;
  tanggalMutasi: string;
  keterangan: string | null;
  aset: {
    nup: string;
    batchPembelian: {
      namaAset: string;
    };
  };
  ruanganAsal: {
    namaRuangan: string;
  };
  ruanganTujuan: {
    namaRuangan: string;
  };
  pencatat: {
    nama: string;
  };
}

export default function MutasiPage() {
  const [data, setData] = useState<MutasiData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMutasi() {
      try {
        const res = await fetch("/api/mutasi?pageSize=100");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMutasi();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Riwayat Mutasi
          </h1>
          <p className="text-sm text-slate-500">
            Riwayat perpindahan barang antar ruangan
          </p>
        </div>
        <Link href="/mutasi/tambah">
          <Button>
            <Plus size={16} className="mr-2" />
            Tambah Mutasi
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Tanggal</th>
                <th className="px-6 py-4">Aset</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Perpindahan</th>
                <th className="px-6 py-4">Pencatat</th>
                <th className="px-6 py-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Belum ada riwayat mutasi aset.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {new Date(item.tanggalMutasi).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.aset.batchPembelian.namaAset}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-mono">
                        NUP: {item.aset.nup}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium dark:bg-slate-800 dark:text-slate-300 max-w-[120px] truncate" title={item.ruanganAsal.namaRuangan}>
                          {item.ruanganAsal.namaRuangan}
                        </span>
                        <ArrowRight size={14} className="text-slate-400 shrink-0" />
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium dark:bg-blue-500/10 dark:text-blue-400 max-w-[120px] truncate" title={item.ruanganTujuan.namaRuangan}>
                          {item.ruanganTujuan.namaRuangan}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {item.pencatat.nama}
                    </td>
                    <td className="px-6 py-4 text-slate-500 italic">
                      {item.keterangan || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
