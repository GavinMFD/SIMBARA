import React from "react";
import prisma from "@/lib/prisma";
import PermintaanForm from "./form-client";

export const dynamic = "force-dynamic";

export default async function PermintaanBarangPage() {
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

  let barangList: Barang[] = [];
  let pegawaiList: Pegawai[] = [];
  try {
    const items = await prisma.masterBarang.findMany({
      where: { isActive: true },
      include: {
        batchSuratBelanja: {
          select: { sisaQty: true },
        },
      },
      orderBy: { namaBarang: "asc" },
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

    const pegawais = await prisma.pegawai.findMany({
      where: { isActive: true },
      orderBy: { nama: "asc" },
      select: { id: true, nama: true, unitKerja: true }
    });
    pegawaiList = pegawais;
  } catch (error) {
    console.error("Gagal mengambil data barang:", error);
  }

  return (
    <div className="min-h-screen bg-[#020b14] bg-grid-dots flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <PermintaanForm barangList={barangList} pegawaiList={pegawaiList} />
      </div>
    </div>
  );
}
