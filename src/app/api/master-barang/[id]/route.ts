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

    const { stokAktual } = body;
    if (stokAktual !== undefined) {
      if (stokAktual < 0) {
        return NextResponse.json(
          { success: false, error: "Stok aktual tidak boleh negatif." },
          { status: 400 }
        );
      }
      updateData.stokAktual = Math.floor(stokAktual);
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
// Strategi:
// - Barang TANPA transaksi → hard-delete (hapus permanen)
// - Barang DENGAN transaksi → soft-delete (toggle isActive)
//
// Transaksi yang dicek:
// 1. BatchSuratBelanja (stok masuk)
// 2. TransaksiAtk (pengambilan barang)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ── 1. Cek barang exists ────────────────────────────────
    const existing = await prisma.masterBarang.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Barang tidak ditemukan." },
        { status: 404 }
      );
    }

    // ── 2. Cek apakah barang punya transaksi terkait ────────
    const [batchCount, transaksiCount] = await Promise.all([
      prisma.batchSuratBelanja.count({ where: { masterBarangId: id } }),
      prisma.transaksiAtk.count({ where: { masterBarangId: id } }),
    ]);

    const hasTransactions = batchCount > 0 || transaksiCount > 0;

    // ── 3a. Tidak ada transaksi → hard-delete ───────────────
    if (!hasTransactions) {
      await prisma.masterBarang.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: `Barang "${existing.namaBarang}" berhasil dihapus permanen.`,
        deleteType: "hard",
      });
    }

    // ── 3b. Ada transaksi → soft-delete (toggle isActive) ───
    const newStatus = !existing.isActive;
    await prisma.masterBarang.update({
      where: { id },
      data: { isActive: newStatus },
    });

    const action = newStatus ? "diaktifkan kembali" : "dinonaktifkan";
    return NextResponse.json({
      success: true,
      message: `Barang "${existing.namaBarang}" berhasil ${action}. Tidak dapat dihapus permanen karena memiliki ${batchCount} batch stok masuk dan ${transaksiCount} transaksi pengambilan.`,
      deleteType: "soft",
      hasTransactions: true,
      transactionSummary: {
        batchSuratBelanja: batchCount,
        transaksiAtk: transaksiCount,
      },
    });
  } catch (error) {
    console.error("DELETE /api/master-barang/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengubah status barang." },
      { status: 500 }
    );
  }
}
