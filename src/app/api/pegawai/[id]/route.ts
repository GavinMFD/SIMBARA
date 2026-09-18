import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrKasubag } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/pegawai/[id] - Ambil detail pegawai
export async function GET(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const pegawai = await prisma.pegawai.findUnique({
      where: { id: params.id },
    });

    if (!pegawai) {
      return NextResponse.json(
        { success: false, error: "Pegawai tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: pegawai });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data pegawai" },
      { status: 500 }
    );
  }
}

// PUT /api/pegawai/[id] - Update pegawai
export async function PUT(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const body = await request.json();

    const nama = (body.nama || "").trim();
    const unitKerja = (body.unitKerja || "").trim();
    const isActive = body.isActive;

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

    const pegawai = await prisma.pegawai.update({
      where: { id: params.id },
      data: {
        nama,
        unitKerja,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: pegawai });
  } catch (error) {
    console.error(`PUT /api/pegawai/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui pegawai." },
      { status: 500 }
    );
  }
}

// DELETE /api/pegawai/[id] - Hapus pegawai
export async function DELETE(request: NextRequest, props: RouteParams) {
  const params = await props.params;
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    // Cek apakah pegawai sudah dipakai di transaksi
    const relatedTx = await prisma.transaksiPersediaan.findFirst({
      where: { pegawaiId: params.id },
    });

    if (relatedTx) {
      return NextResponse.json(
        {
          success: false,
          error: "Pegawai tidak dapat dihapus karena sudah memiliki riwayat transaksi pengambilan Persediaan. Nonaktifkan status jika sudah tidak aktif.",
        },
        { status: 400 }
      );
    }

    await prisma.pegawai.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Pegawai berhasil dihapus" });
  } catch (error) {
    console.error(`DELETE /api/pegawai/${params.id} error:`, error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus pegawai." },
      { status: 500 }
    );
  }
}
