import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrKasubag } from "@/lib/api-auth";

// GET /api/ruangan/[id] — Detail satu ruangan
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { id } = await params;

    const ruangan = await prisma.ruangan.findUnique({
      where: { id },
      include: { _count: { select: { masterAset: true } } },
    });

    if (!ruangan) {
      return NextResponse.json(
        { success: false, error: "Ruangan tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ruangan });
  } catch (error) {
    console.error("GET /api/ruangan/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data ruangan." },
      { status: 500 }
    );
  }
}

// PUT /api/ruangan/[id] — Update ruangan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { id } = await params;
    const body = await request.json();

    // Validasi required fields
    if (
      !body.kodeRuangan ||
      typeof body.kodeRuangan !== "string" ||
      body.kodeRuangan.trim().length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Kode ruangan wajib diisi." },
        { status: 400 }
      );
    }

    if (
      !body.namaRuangan ||
      typeof body.namaRuangan !== "string" ||
      body.namaRuangan.trim().length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Nama ruangan wajib diisi." },
        { status: 400 }
      );
    }

    // Cek ruangan ada
    const existing = await prisma.ruangan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Ruangan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cek unique kodeRuangan (kecuali milik sendiri)
    const duplicate = await prisma.ruangan.findFirst({
      where: {
        kodeRuangan: body.kodeRuangan.trim(),
        NOT: { id },
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `Kode ruangan "${body.kodeRuangan.trim()}" sudah digunakan oleh ruangan lain.`,
        },
        { status: 409 }
      );
    }

    const ruangan = await prisma.ruangan.update({
      where: { id },
      data: {
        kodeRuangan: body.kodeRuangan.trim(),
        namaRuangan: body.namaRuangan.trim(),
        lantaiLokasi: body.lantaiLokasi?.trim() || null,
        keterangan: body.keterangan?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: ruangan });
  } catch (error) {
    console.error("PUT /api/ruangan/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate ruangan." },
      { status: 500 }
    );
  }
}

// DELETE /api/ruangan/[id] — Hapus ruangan (dengan proteksi referential)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { id } = await params;

    const existing = await prisma.ruangan.findUnique({
      where: { id },
      include: { _count: { select: { masterAset: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Ruangan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Proteksi: tidak bisa hapus jika masih ada aset di ruangan
    if (existing._count.masterAset > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Ruangan "${existing.namaRuangan}" tidak dapat dihapus karena masih ditempati oleh ${existing._count.masterAset} unit aset.`,
        },
        { status: 409 }
      );
    }

    await prisma.ruangan.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: `Ruangan "${existing.namaRuangan}" berhasil dihapus.`,
    });
  } catch (error) {
    console.error("DELETE /api/ruangan/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus ruangan." },
      { status: 500 }
    );
  }
}
