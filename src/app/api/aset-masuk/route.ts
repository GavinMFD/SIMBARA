import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrKasubag } from "@/lib/api-auth";

// ─── Interfaces ──────────────────────────────────────────────
interface UnitInput {
  nup: string;
  ruanganId: string;
}

interface AsetMasukRequest {
  kategoriAsetId: string;
  noSuratBelanja: string;
  tanggalBeli: string;
  namaAset: string;
  merekTipe?: string;
  hargaSatuan: number;
  jumlahUnit: number;
  units: UnitInput[];
}

// ─── GET /api/aset-masuk ─────────────────────────────────────
// List BatchPembelianAset dengan pagination + filter
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const kategoriId = searchParams.get("kategoriAsetId") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { noSuratBelanja: { contains: search, mode: "insensitive" } },
        { namaAset: { contains: search, mode: "insensitive" } },
      ];
    }

    if (kategoriId) {
      where.kategoriAsetId = kategoriId;
    }

    const [batches, total] = await Promise.all([
      prisma.batchPembelianAset.findMany({
        where,
        include: {
          kategori: true,
          pencatat: { select: { nama: true } },
          _count: { select: { masterAset: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.batchPembelianAset.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: batches,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/aset-masuk error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data pembelian aset." },
      { status: 500 }
    );
  }
}

// ─── POST /api/aset-masuk ────────────────────────────────────
// Create 1 BatchPembelianAset + N MasterAset (transactional)
export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────
    const auth = await requireAdminOrKasubag();
    if (!auth.isAuthorized) return auth.errorResponse!;
    const userId = auth.user.id;

    const body: AsetMasukRequest = await request.json();
    const {
      kategoriAsetId,
      noSuratBelanja,
      tanggalBeli,
      namaAset,
      merekTipe,
      hargaSatuan,
      jumlahUnit,
      units,
    } = body;

    // ── Validasi input ───────────────────────────────────────
    if (!kategoriAsetId) {
      return NextResponse.json(
        { success: false, error: "Kategori aset wajib dipilih." },
        { status: 400 }
      );
    }

    if (!noSuratBelanja || noSuratBelanja.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "No. Surat Belanja wajib diisi." },
        { status: 400 }
      );
    }

    if (!tanggalBeli) {
      return NextResponse.json(
        { success: false, error: "Tanggal pembelian wajib diisi." },
        { status: 400 }
      );
    }

    if (!namaAset || namaAset.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Nama aset wajib diisi." },
        { status: 400 }
      );
    }

    if (!hargaSatuan || hargaSatuan <= 0) {
      return NextResponse.json(
        { success: false, error: "Harga satuan harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (!jumlahUnit || jumlahUnit <= 0) {
      return NextResponse.json(
        { success: false, error: "Jumlah unit harus lebih dari 0." },
        { status: 400 }
      );
    }

    if (!units || units.length !== jumlahUnit) {
      return NextResponse.json(
        { success: false, error: `Jumlah detail unit (${units?.length || 0}) tidak sesuai dengan jumlah unit (${jumlahUnit}).` },
        { status: 400 }
      );
    }

    // ── Validasi NUP unik (cek di antara input sendiri) ─────
    const nupSet = new Set<string>();
    for (const u of units) {
      if (!u.nup || u.nup.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Setiap unit harus memiliki NUP." },
          { status: 400 }
        );
      }
      if (!u.ruanganId) {
        return NextResponse.json(
          { success: false, error: "Setiap unit harus memiliki ruangan penempatan." },
          { status: 400 }
        );
      }
      const nupTrimmed = u.nup.trim();
      if (nupSet.has(nupTrimmed)) {
        return NextResponse.json(
          { success: false, error: `NUP "${nupTrimmed}" duplikat dalam input.` },
          { status: 400 }
        );
      }
      nupSet.add(nupTrimmed);
    }

    // ── Validasi NUP unik (cek di database) ──────────────────
    const existingNups = await prisma.masterAset.findMany({
      where: { nup: { in: Array.from(nupSet) } },
      select: { nup: true },
    });

    if (existingNups.length > 0) {
      const dupNups = existingNups.map((e) => e.nup).join(", ");
      return NextResponse.json(
        { success: false, error: `NUP berikut sudah terdaftar di sistem: ${dupNups}` },
        { status: 409 }
      );
    }

    // ── Validasi kategori exists ─────────────────────────────
    const kategori = await prisma.kategoriAset.findUnique({
      where: { id: kategoriAsetId },
    });
    if (!kategori) {
      return NextResponse.json(
        { success: false, error: "Kategori aset tidak ditemukan." },
        { status: 400 }
      );
    }

    // ── Validasi semua ruangan exists ─────────────────────────
    const ruanganIds = [...new Set(units.map((u) => u.ruanganId))];
    const ruanganCount = await prisma.ruangan.count({
      where: { id: { in: ruanganIds } },
    });
    if (ruanganCount !== ruanganIds.length) {
      return NextResponse.json(
        { success: false, error: "Satu atau lebih ruangan tidak ditemukan." },
        { status: 400 }
      );
    }

    // ── Transaction: Create batch + units ─────────────────────
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.batchPembelianAset.create({
        data: {
          kategoriAsetId,
          noSuratBelanja: noSuratBelanja.trim(),
          tanggalBeli: new Date(tanggalBeli),
          namaAset: namaAset.trim(),
          merekTipe: merekTipe?.trim() || null,
          hargaSatuan,
          jumlahUnit,
          dicatatOleh: userId,
        },
      });

      const masterAsetData = units.map((u) => ({
        batchPembelianId: batch.id,
        nup: u.nup.trim(),
        ruanganId: u.ruanganId,
      }));

      // Create all master_aset records
      await tx.masterAset.createMany({ data: masterAsetData });

      // Fetch created records for response
      const createdUnits = await tx.masterAset.findMany({
        where: { batchPembelianId: batch.id },
        include: { ruangan: true },
        orderBy: { nup: "asc" },
      });

      return { batch, units: createdUnits };
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Berhasil mencatat ${jumlahUnit} unit aset "${namaAset}" dengan NUP unik.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/aset-masuk error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mencatat pembelian aset." },
      { status: 500 }
    );
  }
}
