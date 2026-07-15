import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

// POST /api/transaksi-atk - Submit permintaan ATK (FIFO, tanpa approval)
export async function POST(request: NextRequest) {
  try {
    const body: TransaksiAtkRequest = await request.json();
    const { namaPegawai, unitKerja, items } = body;

    if (!namaPegawai || !unitKerja || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data tidak lengkap." },
        { status: 400 }
      );
    }

    const waktuSubmit = new Date();

    // Jalankan seluruh proses dalam satu database transaction agar atomic
    const transaksiList = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of items) {
        if (!item.barangId || item.quantity <= 0) {
          throw new Error("Data barang tidak valid.");
        }

        let sisaQtyDibutuhkan = item.quantity;

        // Ambil batch yang masih ada stok, diurutkan dari yang paling lama (FIFO)
        const batches = await tx.batchSuratBelanja.findMany({
          where: {
            masterBarangId: item.barangId,
            sisaQty: { gt: 0 },
          },
          orderBy: { tanggalBelanja: "asc" },
        });

        // Hitung total stok tersedia
        const totalStok = batches.reduce((sum, b) => sum + b.sisaQty, 0);
        if (totalStok < item.quantity) {
          const barang = await tx.masterBarang.findUnique({ where: { id: item.barangId } });
          throw new Error(
            `Stok tidak mencukupi untuk "${barang?.namaBarang ?? item.barangId}". Tersedia: ${totalStok}.`
          );
        }

        // Buat record TransaksiAtk
        const transaksi = await tx.transaksiAtk.create({
          data: {
            masterBarangId: item.barangId,
            namaPegawai,
            unitKerja,
            qtyDiambil: item.quantity,
            tanggalPengambilan: waktuSubmit,
          },
        });

        // Potong stok sesuai FIFO dan buat detail
        const details = [];
        for (const batch of batches) {
          if (sisaQtyDibutuhkan <= 0) break;

          const dipakai = Math.min(batch.sisaQty, sisaQtyDibutuhkan);
          sisaQtyDibutuhkan -= dipakai;

          // Kurangi sisaQty pada batch
          await tx.batchSuratBelanja.update({
            where: { id: batch.id },
            data: { sisaQty: batch.sisaQty - dipakai },
          });

          // Catat detail transaksi FIFO
          const detail = await tx.transaksiAtkDetail.create({
            data: {
              transaksiAtkId: transaksi.id,
              batchSuratBelanjaId: batch.id,
              qtyDipakai: dipakai,
              hargaSaatPakai: batch.hargaSatuan,
            },
          });

          details.push(detail);
        }

        results.push({ transaksi, details });
      }

      return results;
    });

    return NextResponse.json({
      success: true,
      message: "Permintaan berhasil. Barang siap diambil di gudang/admin.",
      waktuSubmit: waktuSubmit.toISOString(),
      data: transaksiList,
    }, { status: 201 });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan transaksi ATK.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// GET /api/transaksi-atk - Ambil daftar transaksi ATK
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
