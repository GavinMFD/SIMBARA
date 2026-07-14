import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/barang/[id] - Detail barang (MasterAset)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const barang = await prisma.masterAset.findUnique({
      where: { id },
      include: {
        batchPembelian: { include: { kategori: true } },
        ruangan: true,
        mutasiAset: true,
      },
    });

    if (!barang) {
      return NextResponse.json(
        { success: false, error: "Barang tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: barang });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil detail barang" },
      { status: 500 }
    );
  }
}

// PUT /api/barang/[id] - Update barang (MasterAset)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const barang = await prisma.masterAset.update({
      where: { id },
      data: body,
      include: {
        batchPembelian: { include: { kategori: true } },
        ruangan: true,
      },
    });

    return NextResponse.json({ success: true, data: barang });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate barang" },
      { status: 500 }
    );
  }
}

// DELETE /api/barang/[id] - Hapus barang (MasterAset)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.masterAset.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Barang berhasil dihapus",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal menghapus barang" },
      { status: 500 }
    );
  }
}
