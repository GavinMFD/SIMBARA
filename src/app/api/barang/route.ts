import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrKasubag } from "@/lib/api-auth";

// GET /api/barang - Ambil daftar MasterAset dengan filter + pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const kategoriAsetId = searchParams.get("kategoriAsetId") || "";
    const ruanganId = searchParams.get("ruanganId") || "";
    const kondisi = searchParams.get("kondisi") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { nup: { contains: search, mode: "insensitive" as const } },
        {
          batchPembelian: {
            namaAset: { contains: search, mode: "insensitive" as const },
          },
        },
      ];
    }

    if (kategoriAsetId) {
      where.batchPembelian = {
        ...where.batchPembelian,
        kategoriAsetId,
      };
    }

    if (ruanganId) {
      where.ruanganId = ruanganId;
    }

    if (kondisi) {
      where.kondisi = kondisi;
    }

    const [barang, total] = await Promise.all([
      prisma.masterAset.findMany({
        where,
        include: {
          batchPembelian: { include: { kategori: true } },
          ruangan: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.masterAset.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: barang,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/barang error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data barang" },
      { status: 500 }
    );
  }
}

// POST /api/barang - Tambah barang baru (MasterAset)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const body = await request.json();
    const barang = await prisma.masterAset.create({
      data: body,
      include: {
        batchPembelian: { include: { kategori: true } },
        ruangan: true,
      },
    });

    return NextResponse.json({ success: true, data: barang }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan barang" },
      { status: 500 }
    );
  }
}
