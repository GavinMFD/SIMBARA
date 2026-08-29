import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrKasubag } from "@/lib/api-auth";

// GET /api/ruangan - Ambil daftar ruangan
export async function GET() {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

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
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const body = await request.json();

    // Validasi required fields
    const kodeRuangan = (body.kodeRuangan || body.kode || "").trim();
    const namaRuangan = (body.namaRuangan || body.nama || "").trim();

    if (!kodeRuangan) {
      return NextResponse.json(
        { success: false, error: "Kode ruangan wajib diisi." },
        { status: 400 }
      );
    }

    if (!namaRuangan) {
      return NextResponse.json(
        { success: false, error: "Nama ruangan wajib diisi." },
        { status: 400 }
      );
    }

    // Cek unique kodeRuangan
    const duplicate = await prisma.ruangan.findFirst({
      where: { kodeRuangan },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `Kode ruangan "${kodeRuangan}" sudah digunakan.`,
        },
        { status: 409 }
      );
    }

    const ruangan = await prisma.ruangan.create({
      data: {
        kodeRuangan,
        namaRuangan,
        lantaiLokasi: body.lantaiLokasi?.trim() || null,
        keterangan: body.keterangan?.trim() || null,
      },
    });

    return NextResponse.json(
      { success: true, data: ruangan },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/ruangan error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan ruangan." },
      { status: 500 }
    );
  }
}
