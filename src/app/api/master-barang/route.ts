import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─── Interfaces ──────────────────────────────────────────────
interface MasterBarangRequest {
  namaBarang: string;
  satuan: string;
  kategoriBarangId: string;
  stokMinimum: number;
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
    const { namaBarang, satuan, kategoriBarangId, stokMinimum } = body;

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

    // ── Validasi nama unik (case-insensitive) ──────────────
    const existing = await prisma.masterBarang.findFirst({
      where: {
        namaBarang: { equals: namaBarang.trim(), mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Barang dengan nama "${namaBarang.trim()}" sudah terdaftar.` },
        { status: 409 }
      );
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
      },
      include: {
        kategori: { select: { id: true, namaKategori: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { ...barang, totalStok: 0, isLowStock: true },
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
