import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/laporan/rekap-atk?bulan=2025-01
// Menghasilkan rekap ATK bulanan (masuk & keluar per surat belanja)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan"); // format: YYYY-MM

    let dateFilter: { gte: Date; lte: Date } | undefined;
    if (bulan) {
      const [year, month] = bulan.split("-").map(Number);
      dateFilter = {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59),
      };
    }

    // Ambil semua batch surat belanja dalam periode
    const batches = await prisma.batchSuratBelanja.findMany({
      where: dateFilter ? { tanggalBelanja: dateFilter } : undefined,
      include: {
        masterBarang: { select: { namaBarang: true, satuan: true } },
        transaksiAtkDetail: {
          select: { qtyDipakai: true, hargaSaatPakai: true },
        },
      },
      orderBy: { tanggalBelanja: "asc" },
    });

    const rekap = batches.map((b) => {
      const nilaiMasuk = Number(b.hargaSatuan) * b.qtyMasuk;
      const totalQtyKeluar = b.transaksiAtkDetail.reduce(
        (sum, d) => sum + d.qtyDipakai,
        0
      );
      const totalNilaiKeluar = b.transaksiAtkDetail.reduce(
        (sum, d) => sum + Number(d.hargaSaatPakai) * d.qtyDipakai,
        0
      );

      return {
        id: b.id,
        noSuratBelanja: b.noSuratBelanja,
        tanggalBelanja: b.tanggalBelanja,
        namaBarang: b.masterBarang.namaBarang,
        satuan: b.masterBarang.satuan,
        hargaSatuan: Number(b.hargaSatuan),
        qtyMasuk: b.qtyMasuk,
        nilaiMasuk,
        qtyKeluar: totalQtyKeluar,
        nilaiKeluar: totalNilaiKeluar,
        sisaQty: b.sisaQty,
        sisaNilai: Number(b.hargaSatuan) * b.sisaQty,
      };
    });

    return NextResponse.json({ success: true, data: rekap });
  } catch (error) {
    console.error("GET /api/laporan/rekap-atk error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil rekap ATK." },
      { status: 500 }
    );
  }
}
