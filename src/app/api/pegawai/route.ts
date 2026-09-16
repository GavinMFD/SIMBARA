import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrKasubag } from "@/lib/api-auth";

// GET /api/pegawai - Ambil daftar pegawai
export async function GET() {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const pegawai = await prisma.pegawai.findMany({
      orderBy: { nama: "asc" },
    });

    return NextResponse.json({ success: true, data: pegawai });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data pegawai" },
      { status: 500 }
    );
  }
}

// POST /api/pegawai - Tambah pegawai baru
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const body = await request.json();

    const nama = (body.nama || "").trim();
    const unitKerja = (body.unitKerja || "").trim();
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!nama) {
      return NextResponse.json(
        { success: false, error: "Nama pegawai wajib diisi." },
        { status: 400 }
      );
    }

    if (!unitKerja) {
      return NextResponse.json(
        { success: false, error: "Unit kerja wajib diisi." },
        { status: 400 }
      );
    }

    const pegawai = await prisma.pegawai.create({
      data: {
        nama,
        unitKerja,
        isActive,
      },
    });

    return NextResponse.json(
      { success: true, data: pegawai },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/pegawai error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan pegawai." },
      { status: 500 }
    );
  }
}
