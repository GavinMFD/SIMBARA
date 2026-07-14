import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/mutasi - Ambil daftar mutasi (MutasiAset)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [mutasi, total] = await Promise.all([
      prisma.mutasiAset.findMany({
        include: {
          aset: true,
          ruanganAsal: true,
          ruanganTujuan: true,
          pencatat: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.mutasiAset.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: mutasi,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data mutasi" },
      { status: 500 }
    );
  }
}

// POST /api/mutasi - Tambah mutasi baru (MutasiAset)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mutasi = await prisma.mutasiAset.create({
      data: {
        ...body,
        tanggalMutasi: new Date(body.tanggalMutasi),
      },
      include: {
        aset: true,
        ruanganAsal: true,
        ruanganTujuan: true,
        pencatat: true,
      },
    });

    return NextResponse.json({ success: true, data: mutasi }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan mutasi" },
      { status: 500 }
    );
  }
}
