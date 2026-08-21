import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const kategoriAsetId = searchParams.get("kategoriAsetId") || "";
    const ruanganId = searchParams.get("ruanganId") || "";
    const kondisi = searchParams.get("kondisi") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { nup: { contains: search, mode: "insensitive" as const } },
        {
          batchPembelian: {
            namaAset: { contains: search, mode: "insensitive" as const },
          },
        },
      ];
    }

    if (kategoriAsetId) {
      where.batchPembelian = {
        ...where.batchPembelian,
        kategoriAsetId,
      };
    }

    if (ruanganId) {
      where.ruanganId = ruanganId;
    }

    if (kondisi) {
      where.kondisi = kondisi;
    }

    const barang = await prisma.masterAset.findMany({
      where,
      include: {
        batchPembelian: { include: { kategori: true } },
        ruangan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Create CSV content
    const headers = [
      "No",
      "NUP",
      "Nama Aset",
      "Merek/Tipe",
      "Kategori",
      "Ruangan",
      "Harga Satuan",
      "Kondisi",
      "Status Aset",
      "Tanggal Register"
    ];

    const rows = barang.map((b, index) => {
      const row = [
        index + 1,
        b.nup,
        b.batchPembelian.namaAset,
        b.batchPembelian.merekTipe || "-",
        b.batchPembelian.kategori?.namaKategori || "-",
        b.ruangan?.namaRuangan || "-",
        b.batchPembelian.hargaSatuan,
        b.kondisi,
        b.statusAset,
        new Date(b.createdAt).toISOString().split('T')[0]
      ];
      
      // Escape commas and quotes for CSV
      return row.map(cell => {
        const str = String(cell);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Data_Aset.csv"',
      },
    });

  } catch (error) {
    console.error("GET /api/barang/export error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor data" },
      { status: 500 }
    );
  }
}
