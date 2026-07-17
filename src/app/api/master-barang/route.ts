import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─── Interfaces ──────────────────────────────────────────────
interface MasterBarangRequest {
  namaBarang: string;
  satuan: string;
  kategoriBarangId: string;
  stokMinimum: number;
  stokAktual?: number;
}

// ─── GET /api/master-barang ──────────────────────────────────
// List semua MasterBarang aktif, beserta:
// - totalStok (sum sisaQty dari semua batch)
// - isLowStock (totalStok < stokMinimum)
// - kategori (nama kategori)
//
// Query params:
// - search: filter nama barang (case-insensitive)
// - lowStockOnly: "true" → hanya tampilkan barang low-stock
// - all: "true" → termasuk barang non-aktif
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";
    const includeInactive = searchParams.get("all") === "true";

    // Build where clause
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (search) {
      where.namaBarang = { contains: search, mode: "insensitive" };
    }

    const barangList = await prisma.masterBarang.findMany({
      where,
      include: {
        kategori: { select: { id: true, namaKategori: true } },
        batchSuratBelanja: {
          select: { sisaQty: true },
          where: { sisaQty: { gt: 0 } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute totalStok dan isLowStock
    const data = barangList.map((b) => {
      const totalStok = b.batchSuratBelanja.reduce((sum, batch) => sum + batch.sisaQty, 0);
      const isLowStock = totalStok < b.stokMinimum;
      return {
        id: b.id,
        namaBarang: b.namaBarang,
        satuan: b.satuan,
        stokMinimum: b.stokMinimum,
        stokAktual: b.stokAktual,
        isActive: b.isActive,
        createdAt: b.createdAt,
        kategori: b.kategori,
        totalStok,
        isLowStock,
      };
    });

    // Filter low-stock only jika diminta
    const filtered = lowStockOnly ? data.filter((b) => b.isLowStock) : data;

    // Stats: berapa barang low-stock
    const lowStockCount = data.filter((b) => b.isLowStock && b.isActive).length;

    return NextResponse.json({
      success: true,
      data: filtered,
      stats: { totalBarang: data.length, lowStockCount },
    });
  } catch (error) {
    console.error("GET /api/master-barang error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data master barang." },
      { status: 500 }
    );
  }
}

// ─── POST /api/master-barang ─────────────────────────────────
// Tambah MasterBarang baru.
// Validasi: nama unik (case-insensitive), semua field wajib.
export async function POST(request: NextRequest) {
  try {
    const body: MasterBarangRequest = await request.json();
    const { namaBarang, satuan, kategoriBarangId, stokMinimum, stokAktual = 0 } = body;

    // ── Validasi input ─────────────────────────────────────
    if (!namaBarang || typeof namaBarang !== "string" || namaBarang.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Nama barang wajib diisi." },
        { status: 400 }
      );
    }

    if (!satuan || typeof satuan !== "string" || satuan.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Satuan wajib diisi." },
        { status: 400 }
      );
    }

    if (!kategoriBarangId) {
      return NextResponse.json(
        { success: false, error: "Kategori barang wajib dipilih." },
        { status: 400 }
      );
    }

    if (stokMinimum === undefined || stokMinimum === null || stokMinimum < 0) {
      return NextResponse.json(
        { success: false, error: "Stok minimum harus berupa angka ≥ 0." },
        { status: 400 }
      );
    }

    if (stokAktual < 0) {
      return NextResponse.json(
        { success: false, error: "Stok aktual tidak boleh negatif." },
        { status: 400 }
      );
    }

    // ── Validasi nama unik (case-insensitive) — hanya blokir jika aktif ──
    const existing = await prisma.masterBarang.findFirst({
      where: {
        namaBarang: { equals: namaBarang.trim(), mode: "insensitive" },
      },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { success: false, error: `Barang dengan nama "${namaBarang.trim()}" sudah terdaftar.` },
          { status: 409 }
        );
      } else {
        // Barang nonaktif dengan nama sama — aktifkan kembali dan update
        const reactivated = await prisma.masterBarang.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            satuan: satuan.trim(),
            kategoriBarangId,
            stokMinimum: Math.floor(stokMinimum),
            stokAktual: Math.floor(stokAktual),
          },
          include: {
            kategori: { select: { id: true, namaKategori: true } },
          },
        });
        return NextResponse.json(
          {
            success: true,
            data: { ...reactivated, totalStok: 0, isLowStock: true },
            message: `Barang "${namaBarang.trim()}" yang sebelumnya nonaktif telah diaktifkan kembali.`,
          },
          { status: 200 }
        );
      }
    }

    // ── Validasi kategori exists ───────────────────────────
    const kategori = await prisma.kategoriBarang.findUnique({
      where: { id: kategoriBarangId },
    });

    if (!kategori) {
      return NextResponse.json(
        { success: false, error: "Kategori barang tidak ditemukan." },
        { status: 400 }
      );
    }

    // ── Create ─────────────────────────────────────────────
    const barang = await prisma.masterBarang.create({
      data: {
        namaBarang: namaBarang.trim(),
        satuan: satuan.trim(),
        kategoriBarangId,
        stokMinimum: Math.floor(stokMinimum),
        stokAktual: Math.floor(stokAktual),
      },
      include: {
        kategori: { select: { id: true, namaKategori: true } },
      },
    });

    if (Math.floor(stokAktual) > 0) {
      // Find an admin user to assign as pencatat
      const adminUser = await prisma.user.findFirst();
      if (adminUser) {
        await prisma.batchSuratBelanja.create({
          data: {
            masterBarangId: barang.id,
            noSuratBelanja: "STOK_AWAL",
            tanggalBelanja: new Date(),
            hargaSatuan: 0,
            qtyMasuk: Math.floor(stokAktual),
            sisaQty: Math.floor(stokAktual),
            dicatatOleh: adminUser.id,
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { ...barang, totalStok: Math.floor(stokAktual), isLowStock: Math.floor(stokAktual) < Math.floor(stokMinimum) },
        message: "Barang berhasil ditambahkan.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/master-barang error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan barang." },
      { status: 500 }
    );
  }
}
