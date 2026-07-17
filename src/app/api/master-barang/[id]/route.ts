import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─── PUT /api/master-barang/[id] ─────────────────────────────
// Edit MasterBarang. Validasi nama unik (exclude self).
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { namaBarang, satuan, kategoriBarangId, stokMinimum } = body;

    // Cek barang ada
    const existing = await prisma.masterBarang.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Barang tidak ditemukan." },
        { status: 404 }
      );
    }

    // Build update data — hanya field yang dikirim
    const updateData: any = {};

    if (namaBarang !== undefined) {
      if (typeof namaBarang !== "string" || namaBarang.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Nama barang tidak boleh kosong." },
          { status: 400 }
        );
      }

      // Validasi nama unik (exclude self, case-insensitive)
      const duplicate = await prisma.masterBarang.findFirst({
        where: {
          namaBarang: { equals: namaBarang.trim(), mode: "insensitive" },
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: `Barang dengan nama "${namaBarang.trim()}" sudah terdaftar.` },
          { status: 409 }
        );
      }

      updateData.namaBarang = namaBarang.trim();
    }

    if (satuan !== undefined) {
      if (typeof satuan !== "string" || satuan.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Satuan tidak boleh kosong." },
          { status: 400 }
        );
      }
      updateData.satuan = satuan.trim();
    }

    if (kategoriBarangId !== undefined) {
      const kategori = await prisma.kategoriBarang.findUnique({
        where: { id: kategoriBarangId },
      });
      if (!kategori) {
        return NextResponse.json(
          { success: false, error: "Kategori barang tidak ditemukan." },
          { status: 400 }
        );
      }
      updateData.kategoriBarangId = kategoriBarangId;
    }

    if (stokMinimum !== undefined) {
      if (stokMinimum < 0) {
        return NextResponse.json(
          { success: false, error: "Stok minimum harus ≥ 0." },
          { status: 400 }
        );
      }
      updateData.stokMinimum = Math.floor(stokMinimum);
    }

    const barang = await prisma.masterBarang.update({
      where: { id },
      data: updateData,
      include: {
        kategori: { select: { id: true, namaKategori: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: barang,
      message: "Barang berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PUT /api/master-barang/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate barang." },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/master-barang/[id] ──────────────────────────
// Soft-delete: set isActive = false.
// Barang yang di-nonaktifkan tidak muncul di dropdown pegawai,
// tapi histori transaksi tetap valid.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.masterBarang.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Barang tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.masterBarang.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    const action = existing.isActive ? "dinonaktifkan" : "diaktifkan kembali";
    return NextResponse.json({
      success: true,
      message: `Barang berhasil ${action}.`,
    });
  } catch (error) {
    console.error("DELETE /api/master-barang/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengubah status barang." },
      { status: 500 }
    );
  }
}
