import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrKasubag } from "@/lib/api-auth";

// GET /api/barang/[id] — Detail single unit aset
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { id } = await params;

    const aset = await prisma.masterAset.findUnique({
      where: { id },
      include: {
        batchPembelian: {
          include: {
            kategori: true,
            pencatat: { select: { nama: true } },
          },
        },
        ruangan: true,
        mutasiAset: {
          include: {
            ruanganAsal: { select: { namaRuangan: true, kodeRuangan: true } },
            ruanganTujuan: { select: { namaRuangan: true, kodeRuangan: true } },
            pencatat: { select: { nama: true } },
          },
          orderBy: { tanggalMutasi: "desc" },
        },
        riwayatKondisiAset: {
          include: {
            pencatat: { select: { nama: true } },
          },
          orderBy: { tanggalPerubahan: "desc" },
        },
      },
    });

    if (!aset) {
      return NextResponse.json(
        { success: false, error: "Aset tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: aset });
  } catch (error) {
    console.error("GET /api/barang/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil detail aset." },
      { status: 500 }
    );
  }
}
