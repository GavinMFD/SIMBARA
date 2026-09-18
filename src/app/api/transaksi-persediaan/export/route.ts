import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";
import { buildTransaksiPersediaanFilter } from "../_lib/filter";

// ─── GET /api/transaksi-persediaan/export ───────────────────────────
// Export riwayat transaksi Persediaan ke file Excel (.xlsx).
// Mendukung filter query yang sama dengan GET /api/transaksi-persediaan.
// Mengambil SEMUA data yang cocok (tanpa pagination).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const where = buildTransaksiPersediaanFilter(searchParams);

    // ── Ambil semua data yang cocok (tanpa pagination) ────
    const transaksi = await prisma.transaksiPersediaan.findMany({
      where,
      include: {
        masterBarang: { select: { namaBarang: true, satuan: true } },
        pegawai: { select: { nama: true, unitKerja: true } }
      },
      orderBy: { tanggalPengambilan: "desc" },
    });

    // ── Bangun workbook Excel ─────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SIPANDAI";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Riwayat Persediaan");

    // ── Definisi kolom ────────────────────────────────────
    sheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Tanggal Pengambilan", key: "tanggal", width: 22 },
      { header: "Nama Pegawai", key: "namaPegawai", width: 25 },
      { header: "Unit Kerja", key: "unitKerja", width: 25 },
      { header: "Nama Barang", key: "namaBarang", width: 30 },
      { header: "Satuan", key: "satuan", width: 12 },
      { header: "Qty Diambil", key: "qtyDiambil", width: 14 },
    ];

    // ── Style header row ──────────────────────────────────
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 24;

    // ── Isi data ──────────────────────────────────────────
    transaksi.forEach((trx, index) => {
      sheet.addRow({
        no: index + 1,
        tanggal: trx.tanggalPengambilan.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        namaPegawai: trx.pegawai.nama,
        unitKerja: trx.pegawai.unitKerja,
        namaBarang: trx.masterBarang.namaBarang,
        satuan: trx.masterBarang.satuan,
        qtyDiambil: trx.qtyDiambil,
      });
    });

    // ── Style seluruh data rows ───────────────────────────
    for (let rowIndex = 2; rowIndex <= transaksi.length + 1; rowIndex++) {
      const row = sheet.getRow(rowIndex);
      row.alignment = { vertical: "middle" };

      // Zebra striping
      if (rowIndex % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      }
    }

    // ── Auto-filter ───────────────────────────────────────
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: transaksi.length + 1, column: 7 },
    };

    // ── Generate buffer ───────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();

    // ── Nama file dengan timestamp ────────────────────────
    const timestamp = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");
    const filename = `riwayat-persediaan-${timestamp}.xlsx`;

    // ── Return file sebagai response ──────────────────────
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/transaksi-persediaan/export error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor data transaksi Persediaan." },
      { status: 500 }
    );
  }
}
