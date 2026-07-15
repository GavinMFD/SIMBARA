import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/ruangan - Ambil daftar ruangan
export async function GET() {
  try {
    const ruangan = await prisma.ruangan.findMany({
      include: { _count: { select: { masterAset: true } } },
      orderBy: { namaRuangan: "asc" },
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
    
    // Map legacy fields
    const data = {
      ...body,
      namaRuangan: body.namaRuangan || body.nama,
      kodeRuangan: body.kodeRuangan || body.kode || `R-${Date.now()}` // fallback for unique field if not provided
    };
    
    // Remove old mapped fields to avoid schema errors
    delete data.nama;
    delete data.kode;

    const ruangan = await prisma.ruangan.create({ data });

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
