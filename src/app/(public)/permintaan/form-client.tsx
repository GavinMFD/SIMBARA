"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, CheckCircle2, Search, ChevronDown, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface Barang {
  id: string;
  nama: string;
  satuan: string;
  stok: number;
}

interface FormClientProps {
  barangList?: Barang[];
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

// Custom Searchable Dropdown Component
function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: Barang[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedItem = options.find((o) => o.id === value);
  const filteredOptions = options.filter(
    (o) => o.nama.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 cursor-pointer flex items-center justify-between transition-all hover:border-blue-400"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
      >
        <span className={selectedItem ? "text-slate-900 text-[14px]" : "text-slate-400 text-[14px]"}>
          {selectedItem ? selectedItem.nama : placeholder}
        </span>
        <ChevronDown size={18} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          <div className="sticky top-0 p-2 bg-white border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                placeholder="Ketik untuk mencari barang..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <div className="p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => {
                const isOutOfStock = item.stok === 0;
                return (
                  <div
                    key={item.id}
                    className={`px-3 py-2 cursor-pointer rounded-lg text-sm flex justify-between items-center transition-colors ${
                      isOutOfStock ? "hover:bg-red-50 text-slate-400" : "hover:bg-slate-50 text-slate-700"
                    }`}
                    onClick={() => {
                      // Allow selecting even if out of stock, so real-time fetch can confirm.
                      onChange(item.id);
                      setIsOpen(false);
                    }}
                  >
                    <span className="font-medium">{item.nama}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-medium ${
                        isOutOfStock
                          ? "bg-red-100 text-red-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isOutOfStock ? "Stok Habis" : `Stok: ${item.stok} ${item.satuan}`}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-sm text-slate-500">
                Barang tidak ditemukan.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PermintaanForm({ barangList = [] }: FormClientProps) {
  const [namaPegawai, setNamaPegawai] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [unitKerja, setUnitKerja] = useState("");
  const [items, setItems] = useState<SelectedItem[]>([{ barangId: "", quantity: 1 }]);
  const [realtimeStock, setRealtimeStock] = useState<Record<string, number>>({});
  const [isFetchingStock, setIsFetchingStock] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { barangId: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = async (index: number, barangId: string) => {
    const newItems = [...items];
    newItems[index].barangId = barangId;
    newItems[index].quantity = 1;
    setItems(newItems);

    if (!barangId) return;

    // Fetch real-time stock
    setIsFetchingStock((prev) => ({ ...prev, [barangId]: true }));
    try {
      const res = await fetch(`/api/barang/${barangId}`);
      const json = await res.json();
      if (json.success) {
        setRealtimeStock((prev) => ({ ...prev, [barangId]: json.data.stok }));
        // If stock is 0, update quantity to 0
        if (json.data.stok === 0) {
          const updatedItems = [...newItems];
          updatedItems[index].quantity = 0;
          setItems(updatedItems);
        }
      }
    } catch (err) {
      console.error("Gagal memuat stok real-time", err);
    } finally {
      setIsFetchingStock((prev) => ({ ...prev, [barangId]: false }));
    }
  };

  const handleQtyChange = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!namaPegawai.trim() || !tanggal || !unitKerja) {
      setError("Data pemohon (Nama, Tanggal, Unit Kerja) wajib diisi.");
      return;
    }

    if (items.length === 0) {
      setError("Minimal harus memilih satu barang.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.barangId) {
        setError(`Silakan pilih barang pada baris ke-${i + 1}.`);
        return;
      }
      
      const details = barangList.find((b) => b.id === item.barangId);
      if (!details) continue;

      const currentStock = realtimeStock[item.barangId] !== undefined ? realtimeStock[item.barangId] : details.stok;

      if (currentStock === 0) {
        setError(`Maaf, stok untuk "${details.nama}" sedang habis.`);
        return;
      }

      if (item.quantity <= 0) {
        setError(`Jumlah untuk "${details.nama}" harus lebih besar dari 0.`);
        return;
      }
      
      if (item.quantity > currentStock) {
        setError(`Stok tidak mencukupi untuk "${details.nama}". Stok tersedia: ${currentStock} ${details.satuan}.`);
        return;
      }
    }

    // Simulate submission
    setTimeout(() => {
      setSuccess(true);
    }, 500);
  };

  if (success) {
    return (
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl mx-auto border border-slate-100 text-center animate-in fade-in zoom-in duration-300">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-6">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Permintaan Berhasil Dikirim!</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Terima kasih, permintaan Alat Tulis Kantor Anda telah dicatat dan akan segera diproses oleh admin BMN.
        </p>
        <button
          onClick={() => {
            setSuccess(false);
            setNamaPegawai("");
            setTanggal("");
            setUnitKerja("");
            setItems([{ barangId: "", quantity: 1 }]);
          }}
          className="bg-[#001D3D] hover:bg-[#001D3D]/90 text-white font-medium py-3 px-8 rounded-xl transition-all"
        >
          Ajukan Permintaan Lain
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-2xl mx-auto border border-slate-100 relative">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <div className="relative h-20 w-full max-w-[160px]">
            <Image
              src="/logo-simbara.png"
              alt="Logo SIMBARA"
              fill
              sizes="(max-width: 768px) 160px, 160px"
              className="object-contain"
              priority
            />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
          Form Pengambilan ATK
        </h1>
        <p className="text-slate-500 text-[15px]">
          Silakan isi data di bawah ini untuk melakukan permintaan pengambilan Alat Tulis Kantor.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="namaPegawai" className="block text-sm font-bold text-slate-700">
              Nama Pegawai <span className="text-red-500">*</span>
            </label>
            <input
              id="namaPegawai"
              type="text"
              value={namaPegawai}
              onChange={(e) => setNamaPegawai(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400 transition-all text-[14px]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tanggal" className="block text-sm font-bold text-slate-700">
              Tanggal Pengambilan <span className="text-red-500">*</span>
            </label>
            <input
              id="tanggal"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[14px]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="unitKerja" className="block text-sm font-bold text-slate-700">
            Unit/Bidang <span className="text-red-500">*</span>
          </label>
          <select
            id="unitKerja"
            value={unitKerja}
            onChange={(e) => setUnitKerja(e.target.value)}
            className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[14px] appearance-none cursor-pointer"
          >
            <option value="" disabled className="text-slate-400">Pilih Unit/Bidang</option>
            {UNIT_KERJA.map((unit) => (
              <option key={unit} value={unit} className="text-slate-900">
                {unit}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic ATK Items Selection */}
        <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-700">
              Daftar Barang <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus size={16} /> Tambah Barang
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const selectedDetails = barangList.find((b) => b.id === item.barangId);
              const isFetching = item.barangId && isFetchingStock[item.barangId];
              const stockValue = item.barangId && realtimeStock[item.barangId] !== undefined 
                ? realtimeStock[item.barangId] 
                : selectedDetails?.stok;
              const isOutOfStock = stockValue === 0;

              return (
                <div key={index} className="flex flex-col gap-1 p-1">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
                    <div className="flex-1">
                      <SearchableDropdown
                        options={barangList}
                        value={item.barangId}
                        onChange={(val) => handleItemChange(index, val)}
                        placeholder="Cari & Pilih Barang BMN..."
                      />
                      {/* Real-time stock indicator */}
                      {item.barangId && (
                        <div className="mt-1.5 ml-1 flex items-center">
                          {isFetching ? (
                            <span className="text-[13px] text-slate-500 animate-pulse flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Memeriksa stok live...
                            </span>
                          ) : (
                            <span className={`text-[13px] font-medium flex items-center gap-1.5 ${isOutOfStock ? "text-red-500" : "text-emerald-600"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? "bg-red-500" : "bg-emerald-500"}`}></span>
                              {isOutOfStock ? "Stok Habis" : `Tersedia: ${stockValue} ${selectedDetails?.satuan}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="number"
                          min={isOutOfStock ? "0" : "1"}
                          max={stockValue}
                          value={item.quantity}
                          onChange={(e) => handleQtyChange(index, parseInt(e.target.value) || 0)}
                          placeholder="Qty"
                          className={`w-20 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[14px] text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
                          disabled={!item.barangId || isOutOfStock}
                        />
                      </div>
                      
                      <div className="py-3 flex items-center">
                        <span className="text-[13px] font-semibold text-slate-500 w-12 truncate">
                          {selectedDetails ? selectedDetails.satuan : "satuan"}
                        </span>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="mt-1 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Hapus Baris"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            className="w-full py-4 bg-[#001D3D] hover:bg-[#001D3D]/90 text-white font-semibold text-[15px] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#001D3D]/20"
          >
            <Send size={18} /> Kirim Permintaan
          </button>
        </div>
      </form>
    </div>
  );
}
