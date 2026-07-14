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

  let barangList: Barang[] = [];
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
  } catch (error) {
    console.error("Gagal mengambil data barang:", error);
  }

  return (
    <div className="w-full">
      <PermintaanForm barangList={barangList} />
    </div>
  );
}
