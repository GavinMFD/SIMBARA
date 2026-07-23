"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Download, Printer, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";

export default function BarangKritisPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"kritis" | "nama">("kritis");

  useEffect(() => {
    async function fetchKritis() {
      try {
        const res = await fetch("/api/master-barang?lowStockOnly=true");
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setItems(json.data);
          }
        }
      } catch (error) {
        console.error("Error fetching barang kritis:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchKritis();
  }, []);

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "kritis") {
      const deficitA = a.stokMinimum - a.totalStok;
      const deficitB = b.stokMinimum - b.totalStok;
      if (deficitB !== deficitA) return deficitB - deficitA;
      return a.namaBarang.localeCompare(b.namaBarang);
    } else {
      return a.namaBarang.localeCompare(b.namaBarang);
    }
  });

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Barang Kritis");

    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Barang", key: "namaBarang", width: 35 },
      { header: "Kategori", key: "kategori", width: 25 },
      { header: "Satuan", key: "satuan", width: 10 },
      { header: "Stok Minimum", key: "stokMinimum", width: 15 },
      { header: "Sisa Stok", key: "totalStok", width: 15 },
      { header: "Kekurangan", key: "deficit", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };

    sortedItems.forEach((item, idx) => {
      sheet.addRow({
        no: idx + 1,
        namaBarang: item.namaBarang,
        kategori: item.kategori?.namaKategori || "-",
        satuan: item.satuan,
        stokMinimum: item.stokMinimum,
        totalStok: item.totalStok,
        deficit: item.stokMinimum - item.totalStok,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Barang_Kritis_${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            Barang Kritis
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Daftar barang yang jumlah stoknya berada di bawah batas minimum.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0f2b48] text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-full sm:w-auto"
          >
            <option value="kritis">Urutkan: Paling Kritis</option>
            <option value="nama">Urutkan: Nama Barang</option>
          </select>
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <Download size={16} />
            Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <Printer size={16} />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Print Title (Only visible during print) */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-black mb-2">Laporan Barang Kritis</h1>
        <p className="text-sm text-black">Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
      </div>

      {/* Table */}
      <div className="bg-[#071829] border border-border rounded-xl overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-[#0b2136] print:bg-gray-100 print:text-black">
              <tr>
                <th className="px-4 py-3 print:border-b print:border-black">No</th>
                <th className="px-4 py-3 print:border-b print:border-black">Nama Barang</th>
                <th className="px-4 py-3 print:border-b print:border-black">Kategori</th>
                <th className="px-4 py-3 text-right print:border-b print:border-black">Stok Minimum</th>
                <th className="px-4 py-3 text-right print:border-b print:border-black">Sisa Stok</th>
                <th className="px-4 py-3 text-right print:border-b print:border-black">Kekurangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border print:divide-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Memuat data...
                  </td>
                </tr>
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada barang kritis saat ini. Stok dalam kondisi aman.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-[#0f2b48]/50 print:hover:bg-transparent">
                    <td className="px-4 py-3 font-medium text-slate-300 print:text-black">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white print:text-black">{item.namaBarang}</td>
                    <td className="px-4 py-3 text-slate-400 print:text-black">{item.kategori?.namaKategori || "-"}</td>
                    <td className="px-4 py-3 text-right text-slate-400 print:text-black">
                      {item.stokMinimum} <span className="text-[10px]">{item.satuan}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-400 print:text-red-700">
                      {item.totalStok} <span className="text-[10px]">{item.satuan}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-orange-400 print:text-orange-700">
                      {item.stokMinimum - item.totalStok} <span className="text-[10px]">{item.satuan}</span>
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
