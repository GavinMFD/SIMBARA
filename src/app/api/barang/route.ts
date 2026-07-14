import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/barang - Ambil daftar barang (MasterAset)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { nup: { contains: search, mode: "insensitive" as const } },
            {
              batchPembelian: {
                namaAset: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {};

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
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data barang" },
      { status: 500 }
    );
  }
}

// POST /api/barang - Tambah barang baru (MasterAset)
export async function POST(request: NextRequest) {
  try {
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
