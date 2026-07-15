import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

// ─── Interfaces ──────────────────────────────────────────────
interface SelectedItem {
  barangId: string;
  quantity: number;
}

interface TransaksiAtkRequest {
  namaPegawai: string;
  unitKerja: string;
  tanggal: string;
  items: SelectedItem[];
}

// ─── Custom Error: membedakan validasi stok (400) vs server error (500) ──
class StokTidakCukupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StokTidakCukupError";
  }
}

// ─── Tipe untuk hasil raw query batch FIFO ──────────────────
interface BatchRow {
  id: string;
  sisa_qty: number;
  harga_satuan: Prisma.Decimal;
}

// ─── POST /api/transaksi-atk ─────────────────────────────────
// Submit permintaan ATK — FIFO, atomic, tanpa proses approval.
// Stok fisik langsung dipotong saat submit sukses.
export async function POST(request: NextRequest) {
  try {
    const body: TransaksiAtkRequest = await request.json();
    const { namaPegawai, unitKerja, items } = body;

    // ── Validasi input dasar ──────────────────────────────
    if (!namaPegawai || !unitKerja || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data tidak lengkap." },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.barangId || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: "Data barang tidak valid. Pastikan barang dipilih dan jumlah > 0." },
          { status: 400 }
        );
      }
    }

    // ══════════════════════════════════════════════════════
    // PRE-VALIDATION (Controller level)
    // Validasi qty ≤ stok tersedia SEBELUM masuk transaction.
    // Ini memenuhi AC: "Validasi di Controller API sebelum eksekusi database."
    // ══════════════════════════════════════════════════════
    for (const item of items) {
      const batches = await prisma.batchSuratBelanja.findMany({
        where: {
          masterBarangId: item.barangId,
          sisaQty: { gt: 0 },
        },
        select: { sisaQty: true },
      });

      const totalStok = batches.reduce((sum, b) => sum + b.sisaQty, 0);

      if (totalStok < item.quantity) {
        const barang = await prisma.masterBarang.findUnique({
          where: { id: item.barangId },
          select: { namaBarang: true, satuan: true },
        });

        return NextResponse.json(
          {
            success: false,
            error: `Stok tidak mencukupi untuk "${barang?.namaBarang ?? "barang"}". ` +
                   `Tersedia: ${totalStok} ${barang?.satuan ?? ""}, diminta: ${item.quantity}.`,
          },
          { status: 400 }
        );
      }
    }

    // ══════════════════════════════════════════════════════
    // TRANSACTION — Atomic FIFO stock deduction
    // Menggunakan FOR UPDATE row-locking + atomic SQL update
    // untuk mencegah race condition saat 2 pegawai submit bersamaan.
    // ══════════════════════════════════════════════════════
    const waktuSubmit = new Date();

    const transaksiList = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of items) {
        // ── 1. Lock & ambil batch FIFO dengan FOR UPDATE ──
        // FOR UPDATE mengunci baris sehingga transaksi lain harus menunggu,
        // mencegah dua transaksi membaca sisa_qty yang sama secara bersamaan.
        const batches = await tx.$queryRaw<BatchRow[]>`
          SELECT id, sisa_qty, harga_satuan
          FROM batch_surat_belanja
          WHERE master_barang_id = ${item.barangId}
            AND sisa_qty > 0
          ORDER BY tanggal_belanja ASC
          FOR UPDATE
        `;

        // ── 2. Validasi ulang stok (safeguard di dalam transaction) ──
        const totalStok = batches.reduce((sum, b) => sum + Number(b.sisa_qty), 0);
        if (totalStok < item.quantity) {
          const barang = await tx.masterBarang.findUnique({
            where: { id: item.barangId },
            select: { namaBarang: true, satuan: true },
          });
          throw new StokTidakCukupError(
            `Stok tidak mencukupi untuk "${barang?.namaBarang ?? "barang"}". ` +
            `Tersedia: ${totalStok} ${barang?.satuan ?? ""}, diminta: ${item.quantity}.`
          );
        }

        // ── 3. Buat record TransaksiAtk ──
        const transaksi = await tx.transaksiAtk.create({
          data: {
            masterBarangId: item.barangId,
            namaPegawai,
            unitKerja,
            qtyDiambil: item.quantity,
            tanggalPengambilan: waktuSubmit,
          },
        });

        // ── 4. Potong stok FIFO secara atomic ──
        let sisaQtyDibutuhkan = item.quantity;
        const details = [];

        for (const batch of batches) {
          if (sisaQtyDibutuhkan <= 0) break;

          const sisaQtyBatch = Number(batch.sisa_qty);
          const dipakai = Math.min(sisaQtyBatch, sisaQtyDibutuhkan);
          sisaQtyDibutuhkan -= dipakai;

          // Atomic update: `sisa_qty = sisa_qty - N` langsung di SQL.
          // Ini menghindari stale read — nilai dikurangi berdasarkan state terkini di DB.
          // WHERE sisa_qty >= N sebagai safeguard agar sisa_qty tidak pernah < 0.
          const rowsAffected = await tx.$executeRaw`
            UPDATE batch_surat_belanja
            SET sisa_qty = sisa_qty - ${dipakai}
            WHERE id = ${batch.id}
              AND sisa_qty >= ${dipakai}
          `;

          if (rowsAffected === 0) {
            // Race condition terdeteksi: sisa_qty sudah berubah sejak di-lock.
            // Rollback seluruh transaksi.
            throw new StokTidakCukupError(
              "Stok berubah saat proses berlangsung. Silakan coba lagi."
            );
          }

          // ── 5. Catat detail transaksi FIFO ──
          const detail = await tx.transaksiAtkDetail.create({
            data: {
              transaksiAtkId: transaksi.id,
              batchSuratBelanjaId: batch.id,
              qtyDipakai: dipakai,
              hargaSaatPakai: batch.harga_satuan,
            },
          });

          details.push(detail);
        }

        results.push({ transaksi, details });
      }

      return results;
    }, {
      // Timeout lebih panjang untuk menangani multiple items + row locking
      timeout: 15000,
    });

    return NextResponse.json({
      success: true,
      message: "Permintaan berhasil. Barang siap diambil di gudang/admin.",
      waktuSubmit: waktuSubmit.toISOString(),
      data: transaksiList,
    }, { status: 201 });

  } catch (error) {
    // ── Error handling terpisah: 400 vs 500 ──
    if (error instanceof StokTidakCukupError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Gagal menyimpan transaksi ATK.";
    console.error("POST /api/transaksi-atk error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ─── GET /api/transaksi-atk ──────────────────────────────────
// Ambil daftar transaksi ATK dengan pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const [transaksi, total] = await Promise.all([
      prisma.transaksiAtk.findMany({
        include: {
          masterBarang: { select: { namaBarang: true, satuan: true } },
          detail: {
            include: {
              batchSuratBelanja: { select: { noSuratBelanja: true, tanggalBelanja: true } },
            },
          },
        },
        orderBy: { tanggalPengambilan: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaksiAtk.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: transaksi,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data transaksi ATK." },
      { status: 500 }
    );
  }
}
