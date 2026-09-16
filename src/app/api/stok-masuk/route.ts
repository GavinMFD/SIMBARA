import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ─── Interfaces ──────────────────────────────────────────────
interface StokMasukItem {
  masterBarangId: string;
  hargaSatuan: number;
  qtyMasuk: number;
}

interface StokMasukRequest {
  noSuratBelanja: string;
  tanggalBelanja: string;
  items: StokMasukItem[];
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
// Catat stok masuk baru secara massal.
// Setiap item akan menghasilkan record BatchSuratBelanja baru dengan Nomor Surat yang sama.
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
    const { noSuratBelanja, tanggalBelanja, items } = body;

    // ── Validasi input umum ────────────────────────────────
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

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Daftar barang tidak boleh kosong." },
        { status: 400 }
      );
    }

    // ── Validasi items ─────────────────────────────────────
    const barangIds = items.map(i => i.masterBarangId);
    
    // Pastikan semua barang exists dan active
    const existingBarang = await prisma.masterBarang.findMany({
      where: { id: { in: barangIds } },
    });

    const activeBarangIds = new Set(existingBarang.filter(b => b.isActive).map(b => b.id));

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.masterBarangId) {
        return NextResponse.json({ success: false, error: `Barang pada baris ke-${i + 1} wajib dipilih.` }, { status: 400 });
      }
      if (!item.hargaSatuan || item.hargaSatuan <= 0) {
        return NextResponse.json({ success: false, error: `Harga satuan pada baris ke-${i + 1} harus > 0.` }, { status: 400 });
      }
      if (!item.qtyMasuk || item.qtyMasuk <= 0) {
        return NextResponse.json({ success: false, error: `Quantity masuk pada baris ke-${i + 1} harus > 0.` }, { status: 400 });
      }
      if (!activeBarangIds.has(item.masterBarangId)) {
        return NextResponse.json({ success: false, error: `Barang pada baris ke-${i + 1} tidak valid atau nonaktif.` }, { status: 400 });
      }
    }

    // ── Eksekusi Transaction ───────────────────────────────
    const results = await prisma.$transaction(async (tx) => {
      const createdBatches = [];

      for (const item of items) {
        // Create batch
        const batch = await tx.batchSuratBelanja.create({
          data: {
            masterBarangId: item.masterBarangId,
            noSuratBelanja: noSuratBelanja.trim(),
            tanggalBelanja: new Date(tanggalBelanja),
            hargaSatuan: item.hargaSatuan,
            qtyMasuk: Math.floor(item.qtyMasuk),
            sisaQty: Math.floor(item.qtyMasuk), // sisaQty = qtyMasuk di awal
            dicatatOleh: userId,
          },
        });
        createdBatches.push(batch);

        // Sync stokAktual
        const stokResult = await tx.batchSuratBelanja.aggregate({
          _sum: { sisaQty: true },
          where: { masterBarangId: item.masterBarangId },
        });

        await tx.masterBarang.update({
          where: { id: item.masterBarangId },
          data: { stokAktual: stokResult._sum.sisaQty ?? 0 },
        });
      }

      return createdBatches;
    }, {
      timeout: 10000,
    });

    return NextResponse.json(
      {
        success: true,
        data: results,
        message: `Berhasil mencatat ${items.length} barang masuk untuk Surat Belanja ${noSuratBelanja}.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/stok-masuk error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mencatat stok masuk massal." },
      { status: 500 }
    );
  }
}
