import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";

// GET /api/laporan/sakti/export
// Export daftar aset dalam format kolom standar SAKTI
export async function GET(_request: NextRequest) {
  try {
    const asetList = await prisma.masterAset.findMany({
      where: { statusAset: "aktif" },
      include: {
        batchPembelian: {
          include: { kategori: true },
        },
        ruangan: true,
      },
      orderBy: { nup: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SIMBARA";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Rekap SAKTI");

    // ── Title ─────────────────────────────────────────────
    sheet.mergeCells("A1:J1");
    sheet.getCell("A1").value = "REKAP BARANG MILIK NEGARA — FORMAT SAKTI";
    sheet.getCell("A1").font = { bold: true, size: 13 };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    sheet.mergeCells("A2:J2");
    sheet.getCell("A2").value = `Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`;
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.addRow([]);

    // ── Header (Format standar SAKTI) ─────────────────────
    const header = sheet.addRow([
      "No",
      "Kode Barang (NUP)",
      "Nama BMN",
      "Kategori",
      "Merek / Tipe",
      "Tahun Perolehan",
      "Satuan",
      "Jumlah",
      "Harga Satuan (Rp)",
      "Nilai Perolehan (Rp)",
      "Kondisi",
      "Lokasi (Ruangan)",
    ]);

    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7C3AED" },
    };
    header.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    header.height = 40;

    const KONDISI_MAP: Record<string, string> = {
      baik: "Baik",
      rusak_ringan: "Rusak Ringan",
      rusak_berat: "Rusak Berat",
    };

    [6, 20, 32, 20, 20, 16, 10, 10, 20, 22, 16, 24].forEach((w, i) => {
      sheet.getColumn(i + 1).width = w;
    });

    const currencyFmt = '#,##0';

    asetList.forEach((a, i) => {
      const hargaSatuan = Number(a.batchPembelian.hargaSatuan);
      const tahunPerolehan = new Date(a.batchPembelian.tanggalBeli).getFullYear();

      const row = sheet.addRow([
        i + 1,
        a.nup,
        a.batchPembelian.namaAset,
        a.batchPembelian.kategori.namaKategori,
        a.batchPembelian.merekTipe || "-",
        tahunPerolehan,
        "Unit",
        1,
        hargaSatuan,
        hargaSatuan,
        KONDISI_MAP[a.kondisi] ?? a.kondisi,
        a.ruangan.namaRuangan,
      ]);

      row.alignment = { vertical: "middle" };
      row.getCell(9).numFmt = currencyFmt;
      row.getCell(10).numFmt = currencyFmt;

      if (i % 2 === 1) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F3FF" },
        };
      }
    });

    // ── Total row ──────────────────────────────────────────
    const lastRow = 4 + asetList.length;
    const totalRow = sheet.addRow([
      "", "TOTAL", "", "", "", "", "", asetList.length,
      "", { formula: `SUM(J5:J${lastRow})` }, "", "",
    ]);
    totalRow.font = { bold: true };
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDE9FE" } };
    totalRow.getCell(10).numFmt = currencyFmt;

    // ── Auto-filter ────────────────────────────────────────
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: lastRow, column: 12 },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `rekap-sakti-${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/laporan/sakti/export error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor format SAKTI." },
      { status: 500 }
    );
  }
}
