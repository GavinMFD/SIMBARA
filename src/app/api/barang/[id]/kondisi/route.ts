import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrKasubag } from "@/lib/api-auth";

// POST /api/barang/[id]/kondisi - Catat perubahan kondisi aset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { id } = await params;
    const body = await request.json();

    if (!body.kondisiBaru) {
      return NextResponse.json(
        { success: false, error: "Kondisi baru wajib dipilih." },
        { status: 400 }
      );
    }
    if (!body.keterangan || body.keterangan.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Keterangan perubahan wajib diisi." },
        { status: 400 }
      );
    }

    const aset = await prisma.masterAset.findUnique({ where: { id } });
    if (!aset) {
      return NextResponse.json(
        { success: false, error: "Aset tidak ditemukan." },
        { status: 404 }
      );
    }

    if (aset.kondisi === body.kondisiBaru) {
      return NextResponse.json(
        { success: false, error: "Kondisi baru sama dengan kondisi saat ini." },
        { status: 400 }
      );
    }

    // Gunakan Prisma transaction untuk menjamin konsistensi
    const [riwayat] = await prisma.$transaction([
      prisma.riwayatKondisiAset.create({
        data: {
          asetId: id,
          kondisiLama: aset.kondisi,
          kondisiBaru: body.kondisiBaru,
          tanggalPerubahan: new Date(body.tanggalPerubahan || new Date()),
          keterangan: body.keterangan.trim(),
          dicatatOleh: body.dicatatOleh,
        },
      }),
      prisma.masterAset.update({
        where: { id },
        data: { kondisi: body.kondisiBaru },
      }),
    ]);

    return NextResponse.json({ success: true, data: riwayat }, { status: 201 });
  } catch (error) {
    console.error("POST /api/barang/[id]/kondisi error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan perubahan kondisi aset." },
      { status: 500 }
    );
  }
}
