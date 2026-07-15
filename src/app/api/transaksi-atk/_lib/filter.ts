import { Prisma } from "@prisma/client";

/**
 * Membangun Prisma `where` clause untuk query TransaksiAtk
 * berdasarkan search params dari request URL.
 *
 * Filter yang didukung:
 * - tanggalDari  : tanggal mulai (>=), format ISO date string
 * - tanggalSampai: tanggal akhir (<=), format ISO date string
 * - unitKerja    : partial match, case-insensitive
 * - namaBarang   : partial match, case-insensitive (via relasi masterBarang)
 */
export function buildTransaksiAtkFilter(
  searchParams: URLSearchParams
): Prisma.TransaksiAtkWhereInput {
  const where: Prisma.TransaksiAtkWhereInput = {};

  // ── Filter tanggal (range) ──────────────────────────────
  const tanggalDari = searchParams.get("tanggalDari");
  const tanggalSampai = searchParams.get("tanggalSampai");

  if (tanggalDari || tanggalSampai) {
    where.tanggalPengambilan = {};
    if (tanggalDari) {
      where.tanggalPengambilan.gte = new Date(tanggalDari);
    }
    if (tanggalSampai) {
      // Set ke akhir hari (23:59:59.999) agar inklusif
      const endDate = new Date(tanggalSampai);
      endDate.setHours(23, 59, 59, 999);
      where.tanggalPengambilan.lte = endDate;
    }
  }

  // ── Filter unit kerja (partial, case-insensitive) ───────
  const unitKerja = searchParams.get("unitKerja");
  if (unitKerja) {
    where.unitKerja = { contains: unitKerja, mode: "insensitive" };
  }

  // ── Filter nama barang (via relasi, partial, case-insensitive) ──
  const namaBarang = searchParams.get("namaBarang");
  if (namaBarang) {
    where.masterBarang = {
      namaBarang: { contains: namaBarang, mode: "insensitive" },
    };
  }

  return where;
}
