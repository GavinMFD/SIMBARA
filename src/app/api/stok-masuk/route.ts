import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ─── Interfaces ──────────────────────────────────────────────
interface StokMasukRequest {
  masterBarangId: string;
  noSuratBelanja: string;
  tanggalBelanja: string;   // ISO date string, e.g. "2026-01-15"
  hargaSatuan: number;
  qtyMasuk: number;
}

// ─── GET /api/stok-masuk ─────────────────────────────────────
// List BatchSuratBelanja dengan filter + pagination.
//
// Query params:
// - masterBarangId: filter by barang
// - startDate / endDate: filter rentang tanggal belanja
// - page, pageSize: pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const masterBarangId = searchParams.get("masterBarangId") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const search = searchParams.get("search") || "";

    // Build where clause
    const where: any = {};

    if (masterBarangId) {
      where.masterBarangId = masterBarangId;
    }

    if (search) {
      where.OR = [
        { noSuratBelanja: { contains: search, mode: "insensitive" } },
        { masterBarang: { namaBarang: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (startDate || endDate) {
      where.tanggalBelanja = {};
      if (startDate) {
        where.tanggalBelanja.gte = new Date(startDate);
      }
      if (endDate) {
        where.tanggalBelanja.lte = new Date(endDate);
      }
    }

    const [batches, total] = await Promise.all([
      prisma.batchSuratBelanja.findMany({
        where,
        include: {
          masterBarang: { select: { namaBarang: true, satuan: true } },
          pencatat: { select: { nama: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { tanggalBelanja: "desc" },
      }),
      prisma.batchSuratBelanja.count({ where }),
    ]);

    // Stats: total stok masuk bulan ini
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalBulanIni = await prisma.batchSuratBelanja.aggregate({
      _sum: { qtyMasuk: true },
      where: { createdAt: { gte: startOfMonth } },
    });

    // Total Nilai Sisa untuk data yang terfilter (Semua Halaman)
    const allFilteredBatches = await prisma.batchSuratBelanja.findMany({
      where,
      select: { sisaQty: true, hargaSatuan: true },
    });
    const totalNilaiSisaFilterAktif = allFilteredBatches.reduce((acc, batch) => {
      return acc + (batch.sisaQty * Number(batch.hargaSatuan));
    }, 0);

    return NextResponse.json({
      success: true,
      data: batches,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats: {
        totalStokMasukBulanIni: totalBulanIni._sum.qtyMasuk || 0,
        totalNilaiSisaFilterAktif,
      },
    });
  } catch (error) {
    console.error("GET /api/stok-masuk error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data stok masuk." },
      { status: 500 }
    );
  }
}

// ─── POST /api/stok-masuk ────────────────────────────────────
// Catat stok masuk baru (batch baru).
// Setiap pencatatan SELALU membuat record BatchSuratBelanja baru.
// sisaQty diisi sama dengan qtyMasuk (belum ada pengambilan).
export async function POST(request: NextRequest) {
  try {
    // ── Auth: ambil user ID dari session ───────────────────
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak valid. Silakan login ulang." },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const body: StokMasukRequest = await request.json();
    const { masterBarangId, noSuratBelanja, tanggalBelanja, hargaSatuan, qtyMasuk } = body;

    // ── Validasi input ─────────────────────────────────────
    if (!masterBarangId) {
      return NextResponse.json(
        { success: false, error: "Barang wajib dipilih." },
        { status: 400 }
      );
    }

    if (!noSuratBelanja || typeof noSuratBelanja !== "string" || noSuratBelanja.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "No. Surat Belanja wajib diisi." },
        { status: 400 }
      );
    }

    if (!tanggalBelanja) {
      return NextResponse.json(
        { success: false, error: "Tanggal belanja wajib diisi." },
        { status: 400 }
      );
    }

    if (!hargaSatuan || hargaSatuan <= 0) {
      return NextResponse.json(
        { success: false, error: "Harga satuan harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (!qtyMasuk || qtyMasuk <= 0) {
      return NextResponse.json(
        { success: false, error: "Quantity masuk harus lebih dari 0." },
        { status: 400 }
      );
    }

    // ── Validasi barang exists & active ────────────────────
    const barang = await prisma.masterBarang.findUnique({
      where: { id: masterBarangId },
    });

    if (!barang || !barang.isActive) {
      return NextResponse.json(
        { success: false, error: "Barang tidak ditemukan atau sudah nonaktif." },
        { status: 400 }
      );
    }

    // ── Create batch baru ──────────────────────────────────
    const batch = await prisma.batchSuratBelanja.create({
      data: {
        masterBarangId,
        noSuratBelanja: noSuratBelanja.trim(),
        tanggalBelanja: new Date(tanggalBelanja),
        hargaSatuan,
        qtyMasuk: Math.floor(qtyMasuk),
        sisaQty: Math.floor(qtyMasuk),   // sisaQty = qtyMasuk (belum ada pengambilan)
        dicatatOleh: userId,
      },
      include: {
        masterBarang: { select: { namaBarang: true, satuan: true } },
        pencatat: { select: { nama: true } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: batch,
        message: `Stok masuk berhasil dicatat: ${qtyMasuk} ${barang.satuan} ${barang.namaBarang}.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/stok-masuk error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mencatat stok masuk." },
      { status: 500 }
    );
  }
}
