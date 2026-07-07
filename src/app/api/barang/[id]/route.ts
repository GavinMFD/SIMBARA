import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/barang/[id] - Detail barang
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const barang = await prisma.barang.findUnique({
      where: { id },
      include: { kategori: true, ruangan: true, mutasi: true },
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

// PUT /api/barang/[id] - Update barang
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const barang = await prisma.barang.update({
      where: { id },
      data: body,
      include: { kategori: true, ruangan: true },
    });

    return NextResponse.json({ success: true, data: barang });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate barang" },
      { status: 500 }
    );
  }
}

// DELETE /api/barang/[id] - Hapus barang
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.barang.delete({ where: { id } });

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
