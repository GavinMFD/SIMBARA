"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, CheckCircle2, Search, ChevronDown, Plus, Trash2, AlertCircle, X, User, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Barang {
  id: string;
  nama: string;
  satuan: string;
  stok: number;
}

interface Pegawai {
  id: string;
  nama: string;
  unitKerja: string;
}

interface FormClientProps {
  barangList?: Barang[];
  pegawaiList?: Pegawai[];
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

// Custom Searchable Dropdown Component for Barang
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
        className="w-full px-4 py-3 bg-[#0a2240] border border-[#143550] rounded-xl text-slate-200 cursor-pointer flex items-center justify-between transition-all hover:border-blue-500 focus-within:border-blue-500"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
      >
        <span className={selectedItem ? "text-slate-200 text-sm font-medium" : "text-slate-500 text-sm"}>
          {selectedItem ? selectedItem.nama : placeholder}
        </span>
        <ChevronDown size={18} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0a2240] border border-[#143550] rounded-xl shadow-2xl shadow-black/50 max-h-60 overflow-y-auto">
          <div className="sticky top-0 p-2 bg-[#0a2240] border-b border-[#143550]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-[#071a2e] border border-[#143550] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                placeholder="Kari nama barang..."
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
                    className={`px-3 py-2.5 cursor-pointer rounded-lg text-sm flex justify-between items-center transition-colors ${
                      isOutOfStock ? "opacity-50 hover:bg-[#143550]/30" : "hover:bg-[#143550]/50"
                    }`}
                    onClick={() => {
                      onChange(item.id);
                      setIsOpen(false);
                    }}
                  >
                    <span className="font-medium text-slate-200">{item.nama}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                        isOutOfStock
                          ? "bg-red-500/10 text-red-400"
                          : "bg-blue-500/10 text-blue-400"
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

// Custom Searchable Dropdown for Pegawai with Free-Text Support
function PegawaiAutocomplete({
  pegawaiList,
  selectedId,
  typedName,
  onSelectPegawai,
  onTypeNewName,
}: {
  pegawaiList: Pegawai[];
  selectedId: string;
  typedName: string;
  onSelectPegawai: (id: string, nama: string) => void;
  onTypeNewName: (nama: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = pegawaiList.filter((p) =>
    p.nama.toLowerCase().includes(typedName.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={typedName}
          onChange={(e) => {
            onTypeNewName(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Ketik nama Anda..."
          className={`w-full pl-11 py-3.5 bg-[#0a2240] border border-[#143550] rounded-xl text-slate-200 focus:border-blue-500 outline-none placeholder:text-slate-500 transition-all text-sm font-medium ${typedName ? 'pr-28' : 'pr-4'}`}
        />
        {typedName && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
            {selectedId ? (
              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">Terdaftar</span>
            ) : (
              <span className="text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded">Pegawai Baru</span>
            )}
          </div>
        )}
      </div>

      {isOpen && typedName && (
        <div className="absolute z-50 w-full mt-2 bg-[#0a2240] border border-[#143550] rounded-xl shadow-2xl shadow-black/50 max-h-60 overflow-y-auto p-1">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 cursor-pointer rounded-lg hover:bg-[#143550]/50 transition-colors"
                onClick={() => {
                  onSelectPegawai(item.id, item.nama);
                  setIsOpen(false);
                }}
              >
                <div className="font-semibold text-slate-200 text-sm">{item.nama}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.unitKerja}</div>
              </div>
            ))
          ) : (
            <div className="px-4 py-4 text-sm text-slate-400 text-center bg-[#071a2e] rounded-lg border border-[#143550] border-dashed m-2">
              Nama tidak ditemukan. Sistem akan mendaftarkan Anda sebagai pegawai baru saat disimpan.
            </div>
          )}
        </div>
      )}
      
      {isOpen && !typedName && (
        <div className="absolute z-50 w-full mt-2 bg-[#0a2240] border border-[#143550] rounded-xl shadow-2xl shadow-black/50 max-h-60 overflow-y-auto p-1">
          <div className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Saran Pegawai
          </div>
          {pegawaiList.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="px-4 py-2.5 cursor-pointer rounded-lg hover:bg-[#143550]/50 transition-colors"
              onClick={() => {
                onSelectPegawai(item.id, item.nama);
                setIsOpen(false);
              }}
            >
              <div className="font-semibold text-slate-200 text-sm">{item.nama}</div>
              <div className="text-xs text-slate-400 mt-0.5">{item.unitKerja}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PermintaanForm({ barangList = [], pegawaiList = [] }: FormClientProps) {
  const [pegawaiId, setPegawaiId] = useState("");
  const [namaPegawai, setNamaPegawai] = useState("");
  const [unitKerja, setUnitKerja] = useState("");
  
  const [tanggal, setTanggal] = useState("");
  const [items, setItems] = useState<SelectedItem[]>([{ barangId: "", quantity: 1 }]);
  const [realtimeStock, setRealtimeStock] = useState<Record<string, number>>({});
  const [isFetchingStock, setIsFetchingStock] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waktuSubmit, setWaktuSubmit] = useState<string | null>(null);

  const showToast = (message: string) => setToast({ message, visible: true });
  const dismissToast = () => setToast((t) => ({ ...t, visible: false }));

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => dismissToast(), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, toast.message]);

  const handleAddItem = () => setItems([...items, { barangId: "", quantity: 1 }]);
  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleItemChange = async (index: number, barangId: string) => {
    const newItems = [...items];
    newItems[index].barangId = barangId;
    newItems[index].quantity = 1;
    setItems(newItems);

    if (!barangId) return;

    setIsFetchingStock((prev) => ({ ...prev, [barangId]: true }));
    try {
      const res = await fetch(`/api/persediaan/${barangId}`);
      const json = await res.json();
      if (json.success) {
        setRealtimeStock((prev) => ({ ...prev, [barangId]: json.data.stok }));
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

  const handleQtyChange = (index: number, qty: number, maxStock?: number) => {
    const newItems = [...items];
    if (maxStock !== undefined && qty > maxStock) qty = maxStock;
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  const handleSelectPegawai = (id: string, nama: string) => {
    setPegawaiId(id);
    setNamaPegawai(nama);
    const peg = pegawaiList.find((p) => p.id === id);
    if (peg) setUnitKerja(peg.unitKerja);
  };

  const handleTypeNewName = (nama: string) => {
    setNamaPegawai(nama);
    const exactMatch = pegawaiList.find((p) => p.nama.toLowerCase() === nama.toLowerCase());
    if (exactMatch) {
      setPegawaiId(exactMatch.id);
      setUnitKerja(exactMatch.unitKerja);
    } else {
      setPegawaiId("");
      setUnitKerja("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!namaPegawai.trim() || !tanggal || !unitKerja) {
      return setError("Data pemohon (Nama Pegawai, Tanggal, dan Unit Kerja) wajib diisi.");
    }
    if (items.length === 0) {
      return setError("Minimal harus memilih satu barang.");
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.barangId) return setError(`Silakan pilih barang pada baris ke-${i + 1}.`);
      
      const details = barangList.find((b) => b.id === item.barangId);
      if (!details) continue;

      const currentStock = realtimeStock[item.barangId] !== undefined ? realtimeStock[item.barangId] : details.stok;
      if (currentStock === 0) return setError(`Maaf, stok untuk "${details.nama}" sedang habis.`);
      if (item.quantity <= 0) return setError(`Jumlah untuk "${details.nama}" harus lebih dari 0.`);
      if (item.quantity > currentStock) return setError(`Stok tidak cukup untuk "${details.nama}". Sisa: ${currentStock} ${details.satuan}.`);
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        tanggal,
        items: items.map((item) => ({ barangId: item.barangId, quantity: item.quantity })),
      };

      if (pegawaiId) payload.pegawaiId = pegawaiId;
      else {
        payload.namaPegawai = namaPegawai;
        payload.unitKerja = unitKerja;
      }

      const res = await fetch("/api/transaksi-persediaan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        return showToast(json.error || "Terjadi kesalahan sistem.");
      }
      
      setWaktuSubmit(json.waktuSubmit);
      setSuccess(true);
    } catch (err) {
      showToast("Gagal terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    const formattedTime = waktuSubmit
      ? new Date(waktuSubmit).toLocaleString("id-ID", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : "-";

    return (
      <div className="bg-[#071a2e] rounded-3xl p-8 md:p-12 shadow-2xl max-w-2xl mx-auto border border-[#0f2b48] text-center animate-in fade-in zoom-in duration-300">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/20">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Permintaan Berhasil!</h2>
        
        <div className="bg-[#0a2240] border border-[#143550] rounded-2xl p-6 mb-8 text-left space-y-3">
          <p className="text-emerald-400 font-bold text-sm flex items-center gap-2">
            <CheckCircle2 size={18} /> Silakan ambil barang di bagian Gudang.
          </p>
          <div className="h-px w-full bg-[#143550] my-2"></div>
          <p className="text-slate-400 text-sm">
            Tercatat pada: <span className="font-semibold text-white">{formattedTime}</span>
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tunjukkan halaman konfirmasi ini atau sebutkan nama Anda kepada petugas admin persediaan.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setSuccess(false);
              setWaktuSubmit(null);
              setItems([{ barangId: "", quantity: 1 }]);
            }}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
          >
            Input Permintaan Lain
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-[#0a2240] hover:bg-[#143550] border border-[#143550] text-slate-300 font-semibold text-sm transition-all"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#071a2e] rounded-3xl p-6 md:p-10 shadow-2xl shadow-black/50 max-w-2xl mx-auto border border-[#0f2b48] relative">
      {/* Toast Notification */}
      <div
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          toast.visible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-start gap-3 bg-red-500/90 backdrop-blur-md text-white text-sm font-medium px-5 py-4 rounded-2xl shadow-2xl border border-red-500/50 max-w-md">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <span className="flex-1">{toast.message}</span>
          <button onClick={dismissToast} className="ml-2 text-white/80 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* HEADER */}
      <div className="mb-10 flex flex-col items-center relative text-center">
        <Link 
          href="/" 
          className="absolute left-0 top-0 hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-[#0a2240] hover:bg-[#143550] px-3 py-1.5 rounded-lg border border-[#143550] transition-colors"
        >
          <ArrowLeft size={14} /> Beranda
        </Link>
        
        <div className="h-20 w-20 mb-6 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 shadow-xl shadow-blue-500/20 relative">
          <div className="w-full h-full bg-[#0a2240] rounded-full flex items-center justify-center overflow-hidden">
            <Image
              src="/logo-sipandai.png"
              alt="Logo SIPANDAI"
              width={48}
              height={48}
              className="object-contain"
              priority
            />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
          Form Pengambilan Barang
        </h1>
        <p className="text-slate-400 text-sm max-w-md">
          Lengkapi form di bawah untuk mencatat pengambilan barang persediaan BPS Kota Palu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-medium border border-red-500/20 flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION 1: PEMOHON */}
        <div className="p-6 rounded-2xl bg-[#0a2240] border border-[#143550] space-y-5">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            Data Pemohon
          </h2>
          
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Nama Pegawai <span className="text-red-400">*</span>
              </label>
              <PegawaiAutocomplete
                pegawaiList={pegawaiList}
                selectedId={pegawaiId}
                typedName={namaPegawai}
                onSelectPegawai={handleSelectPegawai}
                onTypeNewName={handleTypeNewName}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tanggal Ambil <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a2240] border border-[#143550] rounded-xl text-slate-200 focus:border-blue-500 outline-none transition-all text-sm font-medium [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Unit/Bidang <span className="text-red-400">*</span>
            </label>
            {pegawaiId ? (
              <input
                type="text"
                value={unitKerja}
                readOnly
                className="w-full px-4 py-3 bg-[#071a2e] border border-[#143550] rounded-xl text-slate-400 outline-none transition-all text-sm font-medium cursor-not-allowed"
              />
            ) : (
              <select
                value={unitKerja}
                onChange={(e) => setUnitKerja(e.target.value)}
                className="w-full px-4 py-3 bg-[#0a2240] border border-[#143550] rounded-xl text-slate-200 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              >
                <option value="" disabled className="text-slate-500">Pilih Unit/Bidang Anda</option>
                {UNIT_KERJA.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* SECTION 2: BARANG */}
        <div className="p-6 rounded-2xl bg-[#0a2240] border border-[#143550] space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              Rincian Barang
            </h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
            >
              <Plus size={14} /> Tambah Baris
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const selectedDetails = barangList.find((b) => b.id === item.barangId);
              const isFetching = item.barangId && isFetchingStock[item.barangId];
              const stockValue = item.barangId && realtimeStock[item.barangId] !== undefined 
                ? realtimeStock[item.barangId] 
                : selectedDetails?.stok;
              const isOutOfStock = stockValue === 0;

              return (
                <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-[#071a2e] border border-[#143550]">
                  <div className="flex-1">
                    <SearchableDropdown
                      options={barangList}
                      value={item.barangId}
                      onChange={(val) => handleItemChange(index, val)}
                      placeholder="Pilih Barang..."
                    />
                    {item.barangId && (
                      <div className="mt-2 ml-1">
                        {isFetching ? (
                          <span className="text-[11px] text-slate-400 animate-pulse font-medium">Memeriksa stok...</span>
                        ) : (
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${isOutOfStock ? "text-red-400" : "text-emerald-400"}`}>
                            {isOutOfStock ? "❌ Stok Habis" : `✓ Sisa: ${stockValue} ${selectedDetails?.satuan}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-24">
                      <input
                        type="number"
                        min={isOutOfStock ? "0" : "1"}
                        max={stockValue ?? undefined}
                        value={item.quantity || ""}
                        onChange={(e) => handleQtyChange(index, parseInt(e.target.value) || 0, stockValue)}
                        placeholder="Qty"
                        className={`w-full px-3 py-3 bg-[#0a2240] border rounded-xl text-sm font-bold text-center outline-none transition-colors ${
                          isOutOfStock
                            ? 'border-[#143550] opacity-50 cursor-not-allowed text-slate-500'
                            : stockValue !== undefined && item.quantity > stockValue
                            ? 'border-red-500/50 bg-red-500/10 text-red-400'
                            : 'border-[#143550] text-white focus:border-blue-500'
                        }`}
                        disabled={!item.barangId || isOutOfStock}
                      />
                    </div>
                    
                    <div className="py-3 flex items-center justify-center w-14">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                        {selectedDetails ? selectedDetails.satuan : "-"}
                      </span>
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-3 mt-0.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Link 
            href="/" 
            className="md:hidden flex-1 py-4 flex items-center justify-center rounded-xl bg-[#0a2240] border border-[#143550] text-slate-300 font-bold text-sm"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] md:w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              <><Send size={18} /> Simpan Permintaan</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
