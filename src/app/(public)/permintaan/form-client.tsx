"use client";

import React, { useState } from "react";
import { Plus, Trash2, Calendar, FileText, CheckCircle2, User, Building, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Barang {
  id: string;
  nama: string;
  satuan: string;
  stok: number;
}

interface FormClientProps {
  barangList: Barang[];
}

interface SelectedItem {
  barangId: string;
  quantity: number;
}

const UNIT_KERJA = [
  "Subbagian Umum",
  "Fungsi Statistik Sosial",
  "Fungsi Statistik Produksi",
  "Fungsi Statistik Distribusi",
  "Fungsi IPDS (Integrasi Pengolahan & Diseminasi Statistik)",
  "Fungsi Neraca Wilayah & Analisis Statistik",
];

export default function PermintaanForm({ barangList }: FormClientProps) {
  const [namaPegawai, setNamaPegawai] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().substring(0, 10));
  const [unitKerja, setUnitKerja] = useState("");
  const [items, setItems] = useState<SelectedItem[]>([{ barangId: "", quantity: 1 }]);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<any>(null);

  const handleAddItem = () => {
    setItems([...items, { barangId: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, barangId: string) => {
    const newItems = [...items];
    newItems[index].barangId = barangId;
    newItems[index].quantity = 1; // reset qty to 1
    setItems(newItems);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validasi dasar
    if (!namaPegawai.trim()) {
      setError("Nama pegawai harus diisi.");
      return;
    }
    if (!unitKerja) {
      setError("Unit kerja harus dipilih.");
      return;
    }
    if (items.length === 0) {
      setError("Minimal harus memilih satu barang.");
      return;
    }

    // Validasi items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.barangId) {
        setError(`Pilihlah barang pada baris ke-${i + 1}.`);
        return;
      }
      
      const details = barangList.find((b) => b.id === item.barangId);
      if (!details) continue;

      if (item.quantity <= 0) {
        setError(`Jumlah untuk "${details.nama}" harus lebih besar dari 0.`);
        return;
      }
      if (item.quantity > details.stok) {
        setError(`Stok tidak mencukupi untuk "${details.nama}". Stok tersedia: ${details.stok} ${details.satuan}.`);
        return;
      }
    }

    // Simulasi pengiriman data
    const ticketId = "REQ-" + Math.floor(100000 + Math.random() * 900000);
    const detailRes = items.map((item) => {
      const det = barangList.find((b) => b.id === item.barangId)!;
      return {
        nama: det.nama,
        qty: item.quantity,
        satuan: det.satuan,
      };
    });

    setSuccessData({
      ticketId,
      namaPegawai,
      unitKerja,
      tanggal,
      items: detailRes,
    });
  };

  if (successData) {
    return (
      <Card className="bg-[#071829] border-border text-slate-300 overflow-hidden shadow-2xl shadow-blue-950/20 max-w-lg mx-auto animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-600/10 border-b border-emerald-500/20 p-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">Pengajuan Sukses!</h2>
          <p className="text-xs text-slate-400 mt-1">Barang Anda siap diambil di gudang logistik.</p>
        </div>
        <CardContent className="p-6 space-y-6">
          {/* Receipt Info */}
          <div className="bg-[#030d1a] border border-border/40 rounded-xl p-4 space-y-3 relative font-mono text-xs">
            <div className="absolute top-0 left-4 right-4 h-px bg-dashed bg-slate-700"></div>
            <div className="flex justify-between">
              <span className="text-slate-500">TICKET NO:</span>
              <span className="text-emerald-400 font-extrabold">{successData.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">NAMA:</span>
              <span className="text-white font-bold">{successData.namaPegawai}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UNIT KERJA:</span>
              <span className="text-white font-bold truncate max-w-[180px]">{successData.unitKerja}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TANGGAL:</span>
              <span className="text-white font-bold">{successData.tanggal}</span>
            </div>
            <div className="border-t border-dashed border-slate-700 my-2 pt-2">
              <div className="text-[10px] text-slate-500 mb-2 font-bold uppercase">Daftar Barang Belanjaan:</div>
              <div className="space-y-1.5">
                {successData.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-300">
                    <span className="truncate max-w-[200px]">{item.nama}</span>
                    <span className="text-white font-bold font-sans">{item.qty} {item.satuan}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-xs text-slate-400">
              Tunjukkan nomor tiket di atas kepada staf gudang logistik BPS Kota Palu untuk serah terima fisik barang.
            </p>
            <button
              onClick={() => {
                setSuccessData(null);
                setItems([{ barangId: "", quantity: 1 }]);
                setNamaPegawai("");
                setUnitKerja("");
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg active:scale-95 transition-all w-full"
            >
              Ajukan Permintaan Baru
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#071829] border-border shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <FileText size={18} className="text-blue-400" />
          Formulir Permintaan
        </CardTitle>
        <CardDescription className="text-slate-400">
          Masukkan informasi diri dan pilih barang BMN habis pakai yang diperlukan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs font-semibold text-red-400">
              {error}
            </div>
          )}

          {/* Pegawai Metadata fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="namaPegawai" className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <User size={14} /> Nama Lengkap Pegawai
              </label>
              <input
                id="namaPegawai"
                type="text"
                value={namaPegawai}
                onChange={(e) => setNamaPegawai(e.target.value)}
                placeholder="Masukkan nama Anda..."
                className="w-full px-3.5 py-2.5 bg-[#030d1a] border border-border/80 rounded-lg text-sm text-white focus:border-blue-500 outline-none placeholder:text-slate-600 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tanggal" className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Calendar size={14} /> Tanggal Pengambilan
              </label>
              <input
                id="tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#030d1a] border border-border/80 rounded-lg text-sm text-white focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="unitKerja" className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Building size={14} /> Unit Kerja / Fungsi
            </label>
            <select
              id="unitKerja"
              value={unitKerja}
              onChange={(e) => setUnitKerja(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#030d1a] border border-border/80 rounded-lg text-sm text-white focus:border-blue-500 outline-none transition-colors appearance-none cursor-pointer"
              required
            >
              <option value="" disabled className="text-slate-600">Pilih Unit Kerja Anda...</option>
              {UNIT_KERJA.map((unit) => (
                <option key={unit} value={unit} className="bg-[#071829] text-white">
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic ATK Items Selection list */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Layers size={14} className="text-blue-400" /> Daftar Barang yang Diminta
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Plus size={14} /> Tambah Baris
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const selectedDetails = barangList.find((b) => b.id === item.barangId);
                return (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-[#030d1a]/40 border border-border/50 rounded-xl"
                  >
                    {/* Item Dropdown */}
                    <div className="flex-1 min-w-0">
                      <select
                        value={item.barangId}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        className="w-full px-3 py-2 bg-[#030d1a] border border-border/80 rounded-lg text-xs text-white focus:border-blue-500 outline-none cursor-pointer"
                      >
                        <option value="" disabled>Pilih Barang BMN...</option>
                        {barangList.map((b) => (
                          <option key={b.id} value={b.id} className="bg-[#071829]">
                            {b.nama} (Stok: {b.stok} {b.satuan})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity Input & Satuan */}
                    <div className="flex items-center gap-3 sm:w-44">
                      <input
                        type="number"
                        min="1"
                        max={selectedDetails ? selectedDetails.stok : undefined}
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(index, parseInt(e.target.value) || 0)}
                        placeholder="Jumlah"
                        className="w-20 px-3 py-2 bg-[#030d1a] border border-border/80 rounded-lg text-xs text-white focus:border-blue-500 outline-none text-center"
                        disabled={!item.barangId}
                      />
                      <span className="text-xs font-semibold text-slate-500 truncate max-w-[80px]">
                        {selectedDetails ? selectedDetails.satuan : "satuan"}
                      </span>
                    </div>

                    {/* Remove Action Button */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all self-end sm:self-center"
                        title="Hapus Baris"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-border/40">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg active:scale-98 shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-2"
            >
              Kirim Permintaan Barang
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
