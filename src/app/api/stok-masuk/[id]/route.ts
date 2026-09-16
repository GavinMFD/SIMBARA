import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const batch = await prisma.batchSuratBelanja.findUnique({
      where: { id },
      include: {
        masterBarang: {
          select: {
            namaBarang: true,
            satuan: true,
          },
        },
        pencatat: {
          select: {
            nama: true,
          },
        },
        transaksiAtkDetail: {
          include: {
            transaksiAtk: {
              include: {
                pegawai: true,
              },
            },
          },
          orderBy: {
            transaksiAtk: {
              tanggalPengambilan: "desc",
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: batch });
  } catch (error) {
    console.error("GET /api/stok-masuk/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data batch." },
      { status: 500 }
    );
  }
}
