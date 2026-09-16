import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrKasubag } from "@/lib/api-auth";
import { JenisJabatan } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const [ttdKepala, ttdKasubag] = await Promise.all([
      prisma.pengaturanTtd.findFirst({
        where: { jenisJabatan: "kepala_bps", isActive: true },
      }),
      prisma.pengaturanTtd.findFirst({
        where: { jenisJabatan: "kasubag", isActive: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        kepala: ttdKepala || { namaPejabat: "", nip: "", jabatan: "Kepala BPS Kota Palu" },
        kasubag: ttdKasubag || { namaPejabat: "", nip: "", jabatan: "Kasubag Umum BPS Kota Palu" },
      },
    });
  } catch (error) {
    console.error("GET /api/pengaturan/ttd error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data pengaturan TTD." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;
    // Hanya super_admin atau admin yang boleh mengubah pengaturan ini (opsional)
    if (auth.user!.role !== "super_admin" && auth.user!.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Tidak memiliki akses untuk mengubah pengaturan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { kepala, kasubag } = body;

    if (!kepala || !kasubag) {
      return NextResponse.json(
        { success: false, error: "Data Kepala BPS dan Kasubag diperlukan." },
        { status: 400 }
      );
    }

    // Fungsi helper untuk upsert TTD (karena kita pakai findFirst berdasarkan isActive dan jenisJabatan)
    const upsertTtd = async (jenis: JenisJabatan, data: any) => {
      const existing = await prisma.pengaturanTtd.findFirst({
        where: { jenisJabatan: jenis, isActive: true },
      });

      if (existing) {
        return prisma.pengaturanTtd.update({
          where: { id: existing.id },
          data: {
            namaPejabat: data.namaPejabat,
            nip: data.nip,
            jabatan: data.jabatan,
          },
        });
      } else {
        return prisma.pengaturanTtd.create({
          data: {
            jenisJabatan: jenis,
            namaPejabat: data.namaPejabat,
            nip: data.nip,
            jabatan: data.jabatan,
            isActive: true,
          },
        });
      }
    };

    const [updatedKepala, updatedKasubag] = await prisma.$transaction([
      upsertTtd("kepala_bps", kepala),
      upsertTtd("kasubag", kasubag),
    ]);

    return NextResponse.json({
      success: true,
      data: { kepala: updatedKepala, kasubag: updatedKasubag },
      message: "Berhasil menyimpan pengaturan Tanda Tangan.",
    });
  } catch (error) {
    console.error("PUT /api/pengaturan/ttd error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan pengaturan TTD." },
      { status: 500 }
    );
  }
}
