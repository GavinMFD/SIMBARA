import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/kategori - Ambil daftar kategori (KategoriAset)
export async function GET() {
  try {
    const kategori = await prisma.kategoriAset.findMany({
      include: { _count: { select: { batchPembelianAset: true } } },
      orderBy: { namaKategori: "asc" },
    });

    return NextResponse.json({ success: true, data: kategori });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data kategori" },
      { status: 500 }
    );
  }
}

// POST /api/kategori - Tambah kategori baru (KategoriAset)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const kategori = await prisma.kategoriAset.create({ data: body });

    return NextResponse.json(
      { success: true, data: kategori },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan kategori" },
      { status: 500 }
    );
  }
}
