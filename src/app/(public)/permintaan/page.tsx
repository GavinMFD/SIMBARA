import React from "react";
import prisma from "@/lib/prisma";
import PermintaanForm from "./form-client";

export const dynamic = "force-dynamic";

export default async function PermintaanBarangPage() {
  // Ambil daftar barang aktif dari database untuk stok real-time
  interface Barang {
    id: string;
    nama: string;
    satuan: string;
    stok: number;
  }

  let barangList: Barang[] = [];
  try {
    const items = await prisma.masterBarang.findMany({
      where: { isActive: true },
      include: {
        batchSuratBelanja: {
          select: {
            sisaQty: true,
          },
        },
      },
      orderBy: {
        namaBarang: "asc",
      },
    });

    barangList = items.map((item) => {
      const stok = item.batchSuratBelanja.reduce((sum, batch) => sum + batch.sisaQty, 0);
      return {
        id: item.id,
        nama: item.namaBarang,
        satuan: item.satuan,
        stok: stok,
      };
    });
  } catch (error) {
    console.error("Gagal mengambil data barang:", error);
  }

  // Jika database kosong/belum di-seed, berikan data default agar UI bekerja
  if (barangList.length === 0) {
    barangList = [
      { id: "1", nama: "Kertas HVS A4 80gr (Rim)", satuan: "Rim", stok: 120 },
      { id: "2", nama: "Pulpen Gel Pilot G2 0.5 Black (Pcs)", satuan: "Pcs", stok: 45 },
      { id: "3", nama: "Tinta Printer Canon GI-790 Black (Botol)", satuan: "Botol", stok: 15 },
      { id: "4", nama: "Spidol Whiteboard Snowman Blue (Pcs)", satuan: "Pcs", stok: 30 },
      { id: "5", nama: "Buku Catatan F4 Hardcover (Buku)", satuan: "Buku", stok: 25 },
      { id: "6", nama: "Paper Clip No. 3100 Joyko (Kotak)", satuan: "Kotak", stok: 80 },
    ];
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      {/* Header Halaman */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
          Form Permintaan Barang Habis Pakai
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
          Silakan isi formulir di bawah ini untuk mengajukan permintaan ATK. Stok akan langsung terpotong secara otomatis tanpa antrean approval.
        </p>
      </div>

      {/* Client-side Form Container */}
      <PermintaanForm barangList={barangList} />
    </div>
  );
}
