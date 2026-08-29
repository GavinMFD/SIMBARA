import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrKasubag } from "@/lib/api-auth";

// GET /api/mutasi - Ambil daftar mutasi (MutasiAset)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

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
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const body = await request.json();
    
    // Gunakan Prisma transaction untuk menjamin konsistensi data
    const [mutasi] = await prisma.$transaction([
      prisma.mutasiAset.create({
        data: {
          asetId: body.asetId,
          ruanganAsalId: body.ruanganAsalId,
          ruanganTujuanId: body.ruanganTujuanId,
          tanggalMutasi: new Date(body.tanggalMutasi),
          keterangan: body.keterangan || null,
          dicatatOleh: body.dicatatOleh,
        },
        include: {
          aset: true,
          ruanganAsal: true,
          ruanganTujuan: true,
          pencatat: true,
        },
      }),
      prisma.masterAset.update({
        where: { id: body.asetId },
        data: { ruanganId: body.ruanganTujuanId },
      }),
    ]);

    return NextResponse.json({ success: true, data: mutasi }, { status: 201 });
  } catch (error) {
    console.error("POST /api/mutasi error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan mutasi" },
      { status: 500 }
    );
  }
}
