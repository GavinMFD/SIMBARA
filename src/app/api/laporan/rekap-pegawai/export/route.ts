import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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

    // Filter Pegawai
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
      where.transaksiPersediaan = {
        some: {},
      };
    }

    // Fetch ALL matching data for export (no pagination)
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
    });

    // Process and format data into CSV
    const csvHeader = "No,Nama Pegawai,Unit/Bidang,Total Barang Diambil,Rincian Barang\n";
    
    const csvRows = pegawais.map((pegawai, index) => {
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

      // Sort rincian by namaBarang and stringify
      const rincianList = Array.from(rincianMap.values()).sort((a, b) =>
        a.namaBarang.localeCompare(b.namaBarang)
      );
      
      const rincianString = rincianList.map(r => `${r.namaBarang} (${r.qty} ${r.satuan})`).join("; ");

      // Escape quotes in strings for CSV
      const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

      return `${index + 1},${escapeCsv(pegawai.nama)},${escapeCsv(pegawai.unitKerja)},${totalItems},${escapeCsv(rincianString)}`;
    });

    const csvContent = csvHeader + csvRows.join("\n");

    const dateStr = startDate && endDate ? `${startDate}_to_${endDate}` : (startDate || endDate || "All");
    const filename = `rekap-pengambilan-persediaan-pegawai-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("GET /api/laporan/rekap-pegawai/export error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
