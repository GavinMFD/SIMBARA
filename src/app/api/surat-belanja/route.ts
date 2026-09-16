import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface ItemSuratBelanja {
  type: "atk" | "aset";
  // For ATK
  masterBarangId?: string;
  // For Aset
  kategoriAsetId?: string;
  namaAset?: string;
  merekTipe?: string;
  ruanganId?: string;
  // Common
  qty: number;
  hargaSatuan: number;
}

interface SuratBelanjaRequest {
  noSuratBelanja: string;
  tanggalBelanja: string;
  items: ItemSuratBelanja[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak valid. Silakan login ulang." },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const body: SuratBelanjaRequest = await request.json();
    const { noSuratBelanja, tanggalBelanja, items } = body;

    if (!noSuratBelanja || noSuratBelanja.trim().length === 0) {
      return NextResponse.json({ success: false, error: "No. Surat Belanja wajib diisi." }, { status: 400 });
    }
    if (!tanggalBelanja) {
      return NextResponse.json({ success: false, error: "Tanggal belanja wajib diisi." }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Daftar barang tidak boleh kosong." }, { status: 400 });
    }

    // Eksekusi Transaction
    const results = await prisma.$transaction(async (tx) => {
      let asetBatchesCreated = 0;
      let atkBatchesCreated = 0;

      // 1. Dapatkan max NUP untuk aset (jika ada aset)
      const hasAset = items.some(i => i.type === "aset");
      let nextNupNumber = 1;

      if (hasAset) {
        const lastAset = await tx.masterAset.findFirst({
          select: { nup: true },
          orderBy: { nup: "desc" },
        });
        if (lastAset?.nup) {
          const match = lastAset.nup.match(/NUP-(\d+)/);
          if (match && match[1]) {
            nextNupNumber = parseInt(match[1], 10) + 1;
          }
        }
      }

      for (const item of items) {
        if (item.type === "atk") {
          if (!item.masterBarangId) throw new Error("Barang ATK harus dipilih.");
          
          await tx.batchSuratBelanja.create({
            data: {
              masterBarangId: item.masterBarangId,
              noSuratBelanja: noSuratBelanja.trim(),
              tanggalBelanja: new Date(tanggalBelanja),
              hargaSatuan: item.hargaSatuan,
              qtyMasuk: Math.floor(item.qty),
              sisaQty: Math.floor(item.qty),
              dicatatOleh: userId,
            },
          });
          atkBatchesCreated++;

          // Update stok master barang ATK
          const stokResult = await tx.batchSuratBelanja.aggregate({
            _sum: { sisaQty: true },
            where: { masterBarangId: item.masterBarangId },
          });

          await tx.masterBarang.update({
            where: { id: item.masterBarangId },
            data: { stokAktual: stokResult._sum.sisaQty ?? 0 },
          });
        } 
        else if (item.type === "aset") {
          if (!item.kategoriAsetId || !item.namaAset || !item.ruanganId) {
            throw new Error("Data Aset tidak lengkap (Kategori, Nama Aset, Ruangan wajib ada).");
          }

          // Buat Batch Pembelian Aset
          const batch = await tx.batchPembelianAset.create({
            data: {
              kategoriAsetId: item.kategoriAsetId,
              noSuratBelanja: noSuratBelanja.trim(),
              tanggalBeli: new Date(tanggalBelanja),
              namaAset: item.namaAset,
              merekTipe: item.merekTipe || null,
              hargaSatuan: item.hargaSatuan,
              jumlahUnit: Math.floor(item.qty),
              dicatatOleh: userId,
            },
          });
          asetBatchesCreated++;

          // Generate NUP dan buat MasterAset
          const qty = Math.floor(item.qty);
          for (let i = 0; i < qty; i++) {
            const nupString = `NUP-${String(nextNupNumber).padStart(6, "0")}`;
            nextNupNumber++;

            await tx.masterAset.create({
              data: {
                batchPembelianId: batch.id,
                nup: nupString,
                ruanganId: item.ruanganId,
                kondisi: "baik",
                statusAset: "aktif",
              },
            });
          }
        }
      }

      return { asetBatchesCreated, atkBatchesCreated };
    }, {
      timeout: 20000,
    });

    return NextResponse.json(
      {
        success: true,
        data: results,
        message: `Berhasil mencatat Surat Belanja ${noSuratBelanja} (${results.atkBatchesCreated} batch ATK, ${results.asetBatchesCreated} batch Aset).`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/surat-belanja error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mencatat Surat Belanja." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    // Query Raw untuk UNION data dari kedua tabel
    const result: any[] = await prisma.$queryRaw`
      SELECT 
        "no_surat_belanja" AS "noSuratBelanja",
        "tanggal_belanja" AS "tanggalBelanja",
        SUM(qty)::int AS "totalQty",
        SUM(nominal)::numeric AS "totalNominal",
        COUNT(*)::int AS "totalItems"
      FROM (
        SELECT 
          "no_surat_belanja", 
          "tanggal_belanja", 
          "qty_masuk" AS qty, 
          ("qty_masuk" * "harga_satuan") AS nominal
        FROM "batch_surat_belanja"
        
        UNION ALL
        
        SELECT 
          "no_surat_belanja", 
          "tanggal_beli" AS "tanggal_belanja", 
          "jumlah_unit" AS qty, 
          ("jumlah_unit" * "harga_satuan") AS nominal
        FROM "batch_pembelian_aset"
      ) as combined
      WHERE "no_surat_belanja" ILIKE ${'%' + search + '%'}
      GROUP BY "no_surat_belanja", "tanggal_belanja"
      ORDER BY "tanggal_belanja" DESC
    `;

    // Convert tanggalBelanja and totalNominal to correct JS types if needed
    const formattedResult = result.map(r => ({
      ...r,
      tanggalBelanja: r.tanggalBelanja ? r.tanggalBelanja.toISOString() : null,
      totalNominal: Number(r.totalNominal)
    }));

    return NextResponse.json({
      success: true,
      data: formattedResult,
    });
  } catch (error) {
    console.error("GET /api/surat-belanja error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar Surat Belanja." },
      { status: 500 }
    );
  }
}
