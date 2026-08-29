import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";

// GET /api/laporan/rekap-atk/export?bulan=2025-01
// Export rekap ATK bulanan ke file .xlsx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan");

    let dateFilter: { gte: Date; lte: Date } | undefined;
    let bulanLabel = "Semua Periode";
    if (bulan) {
      const [year, month] = bulan.split("-").map(Number);
      dateFilter = {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59),
      };
      bulanLabel = new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
    }

    const batches = await prisma.batchSuratBelanja.findMany({
      where: dateFilter ? { tanggalBelanja: dateFilter } : undefined,
      include: {
        masterBarang: { select: { namaBarang: true, satuan: true } },
        transaksiAtkDetail: {
          select: { qtyDipakai: true, hargaSaatPakai: true },
        },
      },
      orderBy: { tanggalBelanja: "asc" },
    });

    // ── Build workbook ─────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SIMBARA";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Rekap ATK");

    // ── Title rows ─────────────────────────────────────────
    sheet.mergeCells("A1:J1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "REKAPITULASI PERSEDIAAN ATK";
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center" };

    sheet.mergeCells("A2:J2");
    const periodCell = sheet.getCell("A2");
    periodCell.value = `Periode: ${bulanLabel}`;
    periodCell.font = { size: 11 };
    periodCell.alignment = { horizontal: "center" };

    sheet.addRow([]); // blank row

    // ── Column headers ─────────────────────────────────────
    const headerRow = sheet.addRow([
      "No",
      "No. Surat Belanja",
      "Tanggal Belanja",
      "Nama Barang",
      "Satuan",
      "Harga Satuan",
      "Qty Masuk",
      "Nilai Masuk (Rp)",
      "Qty Keluar",
      "Nilai Keluar (Rp)",
      "Sisa Qty",
      "Sisa Nilai (Rp)",
    ]);

    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1D4ED8" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    headerRow.height = 36;

    // Column widths
    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 24;
    sheet.getColumn(3).width = 18;
    sheet.getColumn(4).width = 28;
    sheet.getColumn(5).width = 12;
    sheet.getColumn(6).width = 16;
    sheet.getColumn(7).width = 12;
    sheet.getColumn(8).width = 20;
    sheet.getColumn(9).width = 12;
    sheet.getColumn(10).width = 20;
    sheet.getColumn(11).width = 12;
    sheet.getColumn(12).width = 20;

    const currencyFmt = '#,##0';

    // ── Data rows ──────────────────────────────────────────
    batches.forEach((b, idx) => {
      const totalQtyKeluar = b.transaksiAtkDetail.reduce(
        (s, d) => s + d.qtyDipakai, 0
      );
      const totalNilaiKeluar = b.transaksiAtkDetail.reduce(
        (s, d) => s + Number(d.hargaSaatPakai) * d.qtyDipakai, 0
      );
      const hargaSatuan = Number(b.hargaSatuan);
      const nilaiMasuk = hargaSatuan * b.qtyMasuk;
      const sisaNilai = hargaSatuan * b.sisaQty;

      const dataRow = sheet.addRow([
        idx + 1,
        b.noSuratBelanja,
        b.tanggalBelanja.toLocaleDateString("id-ID"),
        b.masterBarang.namaBarang,
        b.masterBarang.satuan,
        hargaSatuan,
        b.qtyMasuk,
        nilaiMasuk,
        totalQtyKeluar,
        totalNilaiKeluar,
        b.sisaQty,
        sisaNilai,
      ]);

      dataRow.alignment = { vertical: "middle" };

      // Format currency cells
      [6, 8, 10, 12].forEach((col) => {
        dataRow.getCell(col).numFmt = currencyFmt;
      });

      // Zebra striping
      if (idx % 2 === 1) {
        dataRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      }
    });

    // ── Total row ──────────────────────────────────────────
    const lastDataRow = 4 + batches.length;
    const totalRow = sheet.addRow([
      "",
      "TOTAL",
      "",
      "",
      "",
      "",
      { formula: `SUM(G5:G${lastDataRow})` },
      { formula: `SUM(H5:H${lastDataRow})` },
      { formula: `SUM(I5:I${lastDataRow})` },
      { formula: `SUM(J5:J${lastDataRow})` },
      { formula: `SUM(K5:K${lastDataRow})` },
      { formula: `SUM(L5:L${lastDataRow})` },
    ]);
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDBEAFE" },
    };
    [8, 10, 12].forEach((col) => {
      totalRow.getCell(col).numFmt = currencyFmt;
    });

    // ── Auto-filter ────────────────────────────────────────
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + batches.length, column: 12 },
    };

    // ── Generate buffer ────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `rekap-atk-${bulan ?? "semua"}-${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/laporan/rekap-atk/export error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor rekap ATK." },
      { status: 500 }
    );
  }
}
