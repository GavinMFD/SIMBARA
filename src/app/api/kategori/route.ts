import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/kategori - Ambil daftar kategori
export async function GET() {
  try {
    const kategori = await prisma.kategoriBarang.findMany({
      include: { _count: { select: { masterBarang: true } } },
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

// POST /api/kategori - Tambah kategori baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Map body.nama to namaKategori if needed, to support older frontend code
    const data = {
      namaKategori: body.namaKategori || body.nama
    };

    const kategori = await prisma.kategoriBarang.create({ data });

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
