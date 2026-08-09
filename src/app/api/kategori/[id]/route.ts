import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PUT /api/kategori/[id] — Update nama kategori
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.namaKategori || typeof body.namaKategori !== "string" || body.namaKategori.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Nama kategori wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await prisma.kategoriAset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    const kategori = await prisma.kategoriAset.update({
      where: { id },
      data: { namaKategori: body.namaKategori.trim() },
    });

    return NextResponse.json({ success: true, data: kategori });
  } catch (error) {
    console.error("PUT /api/kategori/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate kategori." },
      { status: 500 }
    );
  }
}

// DELETE /api/kategori/[id] — Hapus kategori (dengan proteksi referential)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.kategoriAset.findUnique({
      where: { id },
      include: { _count: { select: { batchPembelianAset: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    // Proteksi: tidak bisa hapus jika masih ada aset aktif
    if (existing._count.batchPembelianAset > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Kategori "${existing.namaKategori}" tidak dapat dihapus karena masih digunakan oleh ${existing._count.batchPembelianAset} data pembelian aset.`,
        },
        { status: 409 }
      );
    }

    await prisma.kategoriAset.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Kategori "${existing.namaKategori}" berhasil dihapus.`,
    });
  } catch (error) {
    console.error("DELETE /api/kategori/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus kategori." },
      { status: 500 }
    );
  }
}
