import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/ruangan - Ambil daftar ruangan
export async function GET() {
  try {
    const ruangan = await prisma.ruangan.findMany({
      include: { _count: { select: { barang: true } } },
      orderBy: { nama: "asc" },
    });

    return NextResponse.json({ success: true, data: ruangan });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data ruangan" },
      { status: 500 }
    );
  }
}

// POST /api/ruangan - Tambah ruangan baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ruangan = await prisma.ruangan.create({ data: body });

    return NextResponse.json(
      { success: true, data: ruangan },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan ruangan" },
      { status: 500 }
    );
  }
}
