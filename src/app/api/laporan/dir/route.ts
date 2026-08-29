import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/laporan/dir?ruanganId=id1&ruanganId=id2
// Mengembalikan data aset aktif per ruangan untuk cetak DIR
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruanganIds = searchParams.getAll("ruanganId");

    // Ambil data PengaturanTtd untuk kop surat
    const [ttdKepala, ttdKasubag, ruanganList] = await Promise.all([
      prisma.pengaturanTtd.findFirst({
        where: { jenisJabatan: "kepala_bps", isActive: true },
      }),
      prisma.pengaturanTtd.findFirst({
        where: { jenisJabatan: "kasubag", isActive: true },
      }),
      prisma.ruangan.findMany({
        where: ruanganIds.length > 0 ? { id: { in: ruanganIds } } : undefined,
        include: {
          masterAset: {
            where: { statusAset: "aktif" },
            include: {
              batchPembelian: {
                include: { kategori: true },
              },
            },
            orderBy: { nup: "asc" },
          },
        },
        orderBy: { namaRuangan: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ruanganList,
        ttd: { kepala: ttdKepala, kasubag: ttdKasubag },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/laporan/dir error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data DIR." },
      { status: 500 }
    );
  }
}
