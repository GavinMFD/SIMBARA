import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchQuery = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    // Build the date filter for transactions
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate + "T00:00:00.000Z");
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate + "T23:59:59.999Z");
    }

    const hasDateFilter = startDate || endDate;

    // Filter Pegawai:
    // 1. Match search query (nama)
    // 2. Must have at least 1 transaction matching the date filter (if provided)
    const where: Prisma.PegawaiWhereInput = {};
    
    if (searchQuery) {
      where.nama = { contains: searchQuery, mode: "insensitive" };
    }

    if (hasDateFilter) {
      where.transaksiPersediaan = {
        some: {
          tanggalPengambilan: dateFilter,
        },
      };
    } else {
      // If no date filter, still only show Pegawai who have AT least one transaction overall?
      // Yes, because this is a "Rekap Pengambilan" report, we only care about people who actually took something.
      where.transaksiPersediaan = {
        some: {},
      };
    }

    // First get the total count for pagination
    const total = await prisma.pegawai.count({ where });

    // Then fetch the paginated data
    const pegawais = await prisma.pegawai.findMany({
      where,
      include: {
        transaksiPersediaan: {
          where: hasDateFilter ? { tanggalPengambilan: dateFilter } : undefined,
          include: {
            masterBarang: {
              select: {
                id: true,
                namaBarang: true,
                satuan: true,
              },
            },
          },
        },
      },
      orderBy: {
        nama: "asc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Process the data: Aggregate the transactions into a summarized list of items per Pegawai
    const data = pegawais.map((pegawai) => {
      let totalItems = 0;
      const rincianMap = new Map<string, { namaBarang: string; satuan: string; qty: number }>();

      pegawai.transaksiPersediaan.forEach((trx) => {
        totalItems += trx.qtyDiambil;
        const key = trx.masterBarangId;
        if (rincianMap.has(key)) {
          rincianMap.get(key)!.qty += trx.qtyDiambil;
        } else {
          rincianMap.set(key, {
            namaBarang: trx.masterBarang.namaBarang,
            satuan: trx.masterBarang.satuan,
            qty: trx.qtyDiambil,
          });
        }
      });

      // Sort rincian by namaBarang
      const rincianList = Array.from(rincianMap.values()).sort((a, b) =>
        a.namaBarang.localeCompare(b.namaBarang)
      );

      return {
        id: pegawai.id,
        nama: pegawai.nama,
        unitKerja: pegawai.unitKerja,
        totalItems,
        rincian: rincianList,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/laporan/rekap-pegawai error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data laporan rekap pegawai." },
      { status: 500 }
    );
  }
}
