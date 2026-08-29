import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";

// GET /api/laporan/rekap-aset/export?dari=2025-01-01&sampai=2025-12-31
// Export rekap mutasi & perubahan kondisi aset ke .xlsx (2 sheet)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dari = searchParams.get("dari");
    const sampai = searchParams.get("sampai");

    const dateRange = dari && sampai
      ? { gte: new Date(dari), lte: new Date(sampai + "T23:59:59") }
      : undefined;

    const [mutasiList, kondisiList] = await Promise.all([
      prisma.mutasiAset.findMany({
        where: dateRange ? { tanggalMutasi: dateRange } : undefined,
        include: {
          aset: { include: { batchPembelian: true } },
          ruanganAsal: true,
          ruanganTujuan: true,
          pencatat: { select: { nama: true } },
        },
        orderBy: { tanggalMutasi: "asc" },
      }),
      prisma.riwayatKondisiAset.findMany({
        where: dateRange ? { tanggalPerubahan: dateRange } : undefined,
        include: {
          aset: { include: { batchPembelian: true } },
          pencatat: { select: { nama: true } },
        },
        orderBy: { tanggalPerubahan: "asc" },
      }),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SIMBARA";
    workbook.created = new Date();

    const periodeLabel = dari && sampai
      ? `${new Date(dari).toLocaleDateString("id-ID")} s.d. ${new Date(sampai).toLocaleDateString("id-ID")}`
      : "Semua Periode";

    // ── Sheet 1: Rekap Mutasi ──────────────────────────────
    const mutasiSheet = workbook.addWorksheet("Rekap Mutasi");

    mutasiSheet.mergeCells("A1:H1");
    mutasiSheet.getCell("A1").value = "REKAP MUTASI ASET TETAP";
    mutasiSheet.getCell("A1").font = { bold: true, size: 13 };
    mutasiSheet.getCell("A1").alignment = { horizontal: "center" };

    mutasiSheet.mergeCells("A2:H2");
    mutasiSheet.getCell("A2").value = `Periode: ${periodeLabel}`;
    mutasiSheet.getCell("A2").alignment = { horizontal: "center" };

    mutasiSheet.addRow([]);

    const mHeader = mutasiSheet.addRow([
      "No", "NUP", "Nama Aset", "Ruangan Asal", "Ruangan Tujuan",
      "Tanggal Mutasi", "Keterangan", "Dicatat Oleh",
    ]);
    mHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
    mHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
    mHeader.alignment = { horizontal: "center", vertical: "middle" };
    mHeader.height = 28;

    [18, 14, 30, 24, 24, 18, 26, 20].forEach((w, i) => {
      mutasiSheet.getColumn(i + 1).width = w;
    });

    mutasiList.forEach((m, i) => {
      const row = mutasiSheet.addRow([
        i + 1,
        m.aset.nup,
        m.aset.batchPembelian.namaAset,
        m.ruanganAsal.namaRuangan,
        m.ruanganTujuan.namaRuangan,
        m.tanggalMutasi.toLocaleDateString("id-ID"),
        m.keterangan || "-",
        m.pencatat.nama,
      ]);
      row.alignment = { vertical: "middle" };
      if (i % 2 === 1) {
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      }
    });

    // ── Sheet 2: Rekap Kondisi ─────────────────────────────
    const KONDISI_MAP: Record<string, string> = {
      baik: "Baik",
      rusak_ringan: "Rusak Ringan",
      rusak_berat: "Rusak Berat",
    };

    const kondisiSheet = workbook.addWorksheet("Rekap Kondisi");

    kondisiSheet.mergeCells("A1:G1");
    kondisiSheet.getCell("A1").value = "REKAP PERUBAHAN KONDISI ASET TETAP";
    kondisiSheet.getCell("A1").font = { bold: true, size: 13 };
    kondisiSheet.getCell("A1").alignment = { horizontal: "center" };

    kondisiSheet.mergeCells("A2:G2");
    kondisiSheet.getCell("A2").value = `Periode: ${periodeLabel}`;
    kondisiSheet.getCell("A2").alignment = { horizontal: "center" };

    kondisiSheet.addRow([]);

    const kHeader = kondisiSheet.addRow([
      "No", "NUP", "Nama Aset", "Kondisi Lama", "Kondisi Baru",
      "Tanggal Perubahan", "Keterangan", "Dicatat Oleh",
    ]);
    kHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
    kHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
    kHeader.alignment = { horizontal: "center", vertical: "middle" };
    kHeader.height = 28;

    [18, 14, 30, 18, 18, 20, 30, 20].forEach((w, i) => {
      kondisiSheet.getColumn(i + 1).width = w;
    });

    kondisiList.forEach((r, i) => {
      const row = kondisiSheet.addRow([
        i + 1,
        r.aset.nup,
        r.aset.batchPembelian.namaAset,
        KONDISI_MAP[r.kondisiLama] ?? r.kondisiLama,
        KONDISI_MAP[r.kondisiBaru] ?? r.kondisiBaru,
        r.tanggalPerubahan.toLocaleDateString("id-ID"),
        r.keterangan || "-",
        r.pencatat.nama,
      ]);
      row.alignment = { vertical: "middle" };
      if (i % 2 === 1) {
        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const filename = `rekap-aset-${timestamp}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/laporan/rekap-aset/export error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengekspor rekap aset." },
      { status: 500 }
    );
  }
}
