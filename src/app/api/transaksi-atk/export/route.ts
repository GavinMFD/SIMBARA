import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";
import { buildTransaksiAtkFilter } from "../_lib/filter";

// ─── GET /api/transaksi-atk/export ───────────────────────────
// Export riwayat transaksi ATK ke file Excel (.xlsx).
// Mendukung filter query yang sama dengan GET /api/transaksi-atk.
// Mengambil SEMUA data yang cocok (tanpa pagination).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const where = buildTransaksiAtkFilter(searchParams);

    // ── Ambil semua data yang cocok (tanpa pagination) ────
    const transaksi = await prisma.transaksiAtk.findMany({
      where,
      include: {
        masterBarang: { select: { namaBarang: true, satuan: true } },
      },
      orderBy: { tanggalPengambilan: "desc" },
    });

    // ── Bangun workbook Excel ─────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SIMBARA";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Riwayat ATK");

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
        namaPegawai: trx.namaPegawai,
        unitKerja: trx.unitKerja,
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
    const filename = `riwayat-atk-${timestamp}.xlsx`;

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
    console.error("GET /api/transaksi-atk/export error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor data transaksi ATK." },
      { status: 500 }
    );
  }
}
