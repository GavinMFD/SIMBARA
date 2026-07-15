import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/atk/[id] - Detail ATK (MasterBarang)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const barang = await prisma.masterBarang.findUnique({
      where: { id },
      include: {
        batchSuratBelanja: {
          select: { sisaQty: true },
        },
      },
    });

    if (!barang) {
      return NextResponse.json(
        { success: false, error: "Barang tidak ditemukan" },
        { status: 404 }
      );
    }

    const stok = barang.batchSuratBelanja.reduce((sum, batch) => sum + batch.sisaQty, 0);

    return NextResponse.json({ success: true, data: { stok } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil detail ATK" },
      { status: 500 }
    );
  }
}
