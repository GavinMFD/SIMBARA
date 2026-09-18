import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import prisma from "../src/lib/prisma";
import { POST } from "../src/app/api/transaksi-persediaan/route";

describe("FIFO Persediaan API & Logic", () => {
  let testKategoriId: string;
  let testBarangId: string;
  let testPegawaiId: string;
  let testBatchIds: string[] = [];
  let testSuperAdminId: string;

  // Setup: Bikin dummy data agar tidak ganggu data asli
  beforeAll(async () => {
    // 1. Buat Dummy Kategori
    const kat = await prisma.kategoriBarang.create({
      data: { namaKategori: "TEST_KATEGORI_FIFO" },
    });
    testKategoriId = kat.id;

    // 2. Buat Dummy Barang
    const barang = await prisma.masterBarang.create({
      data: {
        kategoriBarangId: testKategoriId,
        namaBarang: "TEST_BARANG_FIFO",
        satuan: "pcs",
        stokMinimum: 5,
        stokAktual: 30, // 10 + 20 dari 2 batch di bawah
        isActive: true,
      },
    });
    testBarangId = barang.id;

    // 3. Buat Super Admin User (pencatat)
    const user = await prisma.user.findFirst({ where: { role: "super_admin" } });
    testSuperAdminId = user!.id;

    // 4. Buat Batch Belanja 1 (Sisa 10, harga 5000)
    const batch1 = await prisma.batchSuratBelanja.create({
      data: {
        masterBarangId: testBarangId,
        noSuratBelanja: "TEST_SURAT_1",
        tanggalBelanja: new Date("2026-01-01"), // Lebih tua
        hargaSatuan: 5000,
        qtyMasuk: 10,
        sisaQty: 10,
        dicatatOleh: testSuperAdminId,
      },
    });
    testBatchIds.push(batch1.id);

    // 5. Buat Batch Belanja 2 (Sisa 20, harga 6000)
    const batch2 = await prisma.batchSuratBelanja.create({
      data: {
        masterBarangId: testBarangId,
        noSuratBelanja: "TEST_SURAT_2",
        tanggalBelanja: new Date("2026-02-01"), // Lebih baru
        hargaSatuan: 6000,
        qtyMasuk: 20,
        sisaQty: 20,
        dicatatOleh: testSuperAdminId,
      },
    });
    testBatchIds.push(batch2.id);

    // 6. Buat Pegawai
    const peg = await prisma.pegawai.create({
      data: {
        nama: "TEST_PEGAWAI_FIFO",
        unitKerja: "QA",
        isActive: true,
      },
    });
    testPegawaiId = peg.id;
  });

  // Cleanup: Hapus dummy data
  afterAll(async () => {
    // Hapus detail & transaksi terlebih dahulu
    await prisma.transaksiPersediaanDetail.deleteMany({
      where: { batchSuratBelanjaId: { in: testBatchIds } },
    });
    await prisma.transaksiPersediaan.deleteMany({
      where: { pegawaiId: testPegawaiId },
    });
    // Hapus batch, barang, kategori, pegawai
    await prisma.batchSuratBelanja.deleteMany({
      where: { id: { in: testBatchIds } },
    });
    await prisma.masterBarang.delete({ where: { id: testBarangId } });
    await prisma.kategoriBarang.delete({ where: { id: testKategoriId } });
    await prisma.pegawai.delete({ where: { id: testPegawaiId } });
  });

  // Helper untuk melakukan request POST
  const makeRequest = async (quantity: number) => {
    const req = new NextRequest("http://localhost:3000/api/transaksi-persediaan", {
      method: "POST",
      body: JSON.stringify({
        pegawaiId: testPegawaiId,
        items: [{ barangId: testBarangId, quantity }],
      }),
    });
    const res = await POST(req);
    const json = await res.json();
    return { status: res.status, json };
  };

  it("Skenario 1: 1 Batch (Ambil 5 dari stok pertama yang berisi 10)", async () => {
    const { status, json } = await makeRequest(5);
    
    expect(status).toBe(201);
    expect(json.success).toBe(true);

    // Verifikasi Batch 1 terpotong 5, Batch 2 tetap 20
    const b1 = await prisma.batchSuratBelanja.findUnique({ where: { id: testBatchIds[0] } });
    const b2 = await prisma.batchSuratBelanja.findUnique({ where: { id: testBatchIds[1] } });
    
    expect(b1?.sisaQty).toBe(5);  // 10 - 5
    expect(b2?.sisaQty).toBe(20); // Utuh
  });

  it("Skenario 2: Multi Batch (Ambil 10, pecah 5 dari batch 1, dan 5 dari batch 2)", async () => {
    // Sisa saat ini: Batch 1 (5), Batch 2 (20). Total = 25.
    const { status, json } = await makeRequest(10);
    
    expect(status).toBe(201);
    expect(json.success).toBe(true);

    // Verifikasi Batch 1 habis (0), Batch 2 kepotong 5 (20 -> 15)
    const b1 = await prisma.batchSuratBelanja.findUnique({ where: { id: testBatchIds[0] } });
    const b2 = await prisma.batchSuratBelanja.findUnique({ where: { id: testBatchIds[1] } });
    
    expect(b1?.sisaQty).toBe(0); 
    expect(b2?.sisaQty).toBe(15);
  });

  it("Skenario 3: Stok pas habis (Ambil 15, sisa stok 15)", async () => {
    // Sisa saat ini: Batch 1 (0), Batch 2 (15). Total = 15.
    const { status, json } = await makeRequest(15);
    
    expect(status).toBe(201);
    expect(json.success).toBe(true);

    // Verifikasi semua stok habis
    const b1 = await prisma.batchSuratBelanja.findUnique({ where: { id: testBatchIds[0] } });
    const b2 = await prisma.batchSuratBelanja.findUnique({ where: { id: testBatchIds[1] } });
    
    expect(b1?.sisaQty).toBe(0); 
    expect(b2?.sisaQty).toBe(0);

    // Verifikasi master_barang stok_aktual juga 0
    const brg = await prisma.masterBarang.findUnique({ where: { id: testBarangId } });
    expect(brg?.stokAktual).toBe(0);
  });

  it("Skenario 4: Stok tidak mencukupi (Ambil 1 ketika stok 0)", async () => {
    // Sisa saat ini: 0
    const { status, json } = await makeRequest(1);
    
    expect(status).toBe(400); // Bad Request
    expect(json.success).toBe(false);
    expect(json.error).toContain("Stok tidak mencukupi");
  });
});
