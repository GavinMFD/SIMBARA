import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { buildTransaksiAtkFilter } from "./_lib/filter";

// ─── Interfaces ──────────────────────────────────────────────
interface SelectedItem {
  barangId: string;
  quantity: number;
}

interface TransaksiAtkRequest {
  pegawaiId?: string;
  namaPegawai?: string;
  unitKerja?: string;
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
    const { pegawaiId, namaPegawai, unitKerja, items } = body;

    // ── Validasi input dasar ──────────────────────────────
    if ((!pegawaiId && !namaPegawai) || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Data tidak lengkap. Pegawai dan barang harus diisi." },
        { status: 400 }
      );
    }

    if (!pegawaiId && (!namaPegawai?.trim() || !unitKerja?.trim())) {
      return NextResponse.json(
        { success: false, error: "Nama dan Unit Kerja wajib diisi jika pegawai baru." },
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

    // ── Resolve Pegawai (Find existing or Create new) ────
    let resolvedPegawaiId = pegawaiId;

    if (!resolvedPegawaiId && namaPegawai) {
      // Cari apakah pegawai dengan nama ini sudah ada (case insensitive)
      const existingPegawai = await prisma.pegawai.findFirst({
        where: {
          nama: {
            equals: namaPegawai.trim(),
            mode: "insensitive"
          }
        }
      });

      if (existingPegawai) {
        if (!existingPegawai.isActive) {
           return NextResponse.json(
            { success: false, error: "Pegawai dengan nama ini sudah ada namun statusnya tidak aktif." },
            { status: 400 }
          );
        }
        resolvedPegawaiId = existingPegawai.id;
      } else {
        // Buat record pegawai baru secara otomatis
        const newPegawai = await prisma.pegawai.create({
          data: {
            nama: namaPegawai.trim(),
            unitKerja: unitKerja!.trim(),
            isActive: true,
          }
        });
        resolvedPegawaiId = newPegawai.id;
      }
    }

    if (!resolvedPegawaiId) {
      return NextResponse.json(
        { success: false, error: "Gagal menentukan identitas pegawai." },
        { status: 400 }
      );
    }

    // Pastikan pegawai exists dan aktif (jika id dikirim langsung dari select)
    if (pegawaiId) {
      const pegawai = await prisma.pegawai.findUnique({
        where: { id: pegawaiId }
      });

      if (!pegawai || !pegawai.isActive) {
        return NextResponse.json(
          { success: false, error: "Pegawai tidak valid atau sudah tidak aktif." },
          { status: 400 }
        );
      }
    }

    // ══════════════════════════════════════════════════════
    // PRE-VALIDATION (Controller level)
    // Validasi qty ≤ stok tersedia SEBELUM masuk transaction.
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
    // ══════════════════════════════════════════════════════
    const waktuSubmit = new Date();

    const transaksiList = await prisma.$transaction(async (tx) => {
      const results = [];

      for (const item of items) {
        // ── 1. Lock & ambil batch FIFO dengan FOR UPDATE ──
        const batches = await tx.$queryRaw<BatchRow[]>`
          SELECT id, sisa_qty, harga_satuan
          FROM batch_surat_belanja
          WHERE master_barang_id = ${item.barangId}
            AND sisa_qty > 0
          ORDER BY tanggal_belanja ASC
          FOR UPDATE
        `;

        // ── 2. Validasi ulang stok ──
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

        // ── 3. Buat record TransaksiAtk dengan resolvedPegawaiId ──
        const transaksi = await tx.transaksiAtk.create({
          data: {
            masterBarangId: item.barangId,
            pegawaiId: resolvedPegawaiId!,
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

          const rowsAffected = await tx.$executeRaw`
            UPDATE batch_surat_belanja
            SET sisa_qty = sisa_qty - ${dipakai}
            WHERE id = ${batch.id}
              AND sisa_qty >= ${dipakai}
          `;

          if (rowsAffected === 0) {
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

        // ── 6. Sync stokAktual on MasterBarang ──
        const stokResult = await tx.batchSuratBelanja.aggregate({
          _sum: { sisaQty: true },
          where: { masterBarangId: item.barangId },
        });

        await tx.masterBarang.update({
          where: { id: item.barangId },
          data: { stokAktual: stokResult._sum.sisaQty ?? 0 },
        });

        results.push({ transaksi, details });
      }

      return results;
    }, {
      timeout: 15000,
    });

    return NextResponse.json({
      success: true,
      message: "Permintaan berhasil. Barang siap diambil di gudang/admin.",
      waktuSubmit: waktuSubmit.toISOString(),
      data: transaksiList,
    }, { status: 201 });

  } catch (error) {
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
// Ambil daftar transaksi ATK dengan pagination, filter, dan export Excel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const namaPegawai = searchParams.get("namaPegawai") || "";
    const unitKerja = searchParams.get("unitKerja") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const isExport = searchParams.get("export") === "excel";

    // ── Build filter where clause ──
    const where: Prisma.TransaksiAtkWhereInput = {};

    if (namaPegawai || unitKerja) {
      where.pegawai = {};
      if (namaPegawai) {
        where.pegawai.nama = { contains: namaPegawai, mode: "insensitive" };
      }
      if (unitKerja) {
        where.pegawai.unitKerja = unitKerja;
      }
    }

    if (startDate || endDate) {
      where.tanggalPengambilan = {};
      if (startDate) {
        (where.tanggalPengambilan as Prisma.DateTimeFilter).gte = new Date(startDate + "T00:00:00.000Z");
      }
      if (endDate) {
        (where.tanggalPengambilan as Prisma.DateTimeFilter).lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    // ── Group transaksi by pegawaiId + tanggal ──
    if (isExport) {
      const allTransaksi = await prisma.transaksiAtk.findMany({
        where,
        include: {
          masterBarang: { select: { namaBarang: true, satuan: true } },
          pegawai: { select: { nama: true, unitKerja: true } }
        },
        orderBy: { tanggalPengambilan: "desc" },
      });

      const grouped = groupTransaksi(allTransaksi);

      const csvHeader = "No,Nama Pegawai,Tanggal,Unit/Bidang,Daftar Barang,Total Item\n";
      const csvRows = grouped.map((row, i) => {
        const barangList = row.items.map((it: any) => `${it.namaBarang} (${it.qty})`).join("; ");
        const totalItem = row.items.reduce((s: number, it: any) => s + it.qty, 0);
        const tgl = new Date(row.tanggal).toLocaleDateString("id-ID", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar",
        });
        return `${i + 1},"${row.namaPegawai}","${tgl}","${row.unitKerja}","${barangList}",${totalItem}`;
      });

      const csv = csvHeader + csvRows.join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="riwayat-atk-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // ── Regular paginated response ──
    const allTransaksi = await prisma.transaksiAtk.findMany({
      where,
      include: {
        masterBarang: { select: { namaBarang: true, satuan: true } },
        pegawai: { select: { nama: true, unitKerja: true } }
      },
      orderBy: { tanggalPengambilan: "desc" },
    });

    const grouped = groupTransaksi(allTransaksi);
    const total = grouped.length;
    const paginated = grouped.slice((page - 1) * pageSize, page * pageSize);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalBulanIni = await prisma.transaksiAtk.count({
      where: { tanggalPengambilan: { gte: startOfMonth } },
    });

    return NextResponse.json({
      success: true,
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats: {
        totalBulanIni,
      },
    });
  } catch (error) {
    console.error("GET /api/transaksi-atk error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data transaksi ATK." },
      { status: 500 }
    );
  }
}

// ─── Helper: group individual TransaksiAtk rows into submission groups ───
function groupTransaksi(transaksiList: any[]) {
  const map = new Map<string, any>();

  for (const t of transaksiList) {
    const roundedTime = new Date(t.tanggalPengambilan);
    roundedTime.setSeconds(0, 0);
    const key = `${t.pegawaiId}__${roundedTime.toISOString()}`;

    if (!map.has(key)) {
      map.set(key, {
        id: t.id,
        namaPegawai: t.pegawai?.nama ?? "-",
        unitKerja: t.pegawai?.unitKerja ?? "-",
        tanggal: t.tanggalPengambilan,
        items: [],
      });
    }

    map.get(key).items.push({
      barangId: t.masterBarangId,
      namaBarang: t.masterBarang?.namaBarang ?? "-",
      satuan: t.masterBarang?.satuan ?? "",
      qty: t.qtyDiambil,
    });
  }

  return Array.from(map.values());
}
