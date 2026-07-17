import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─── GET /api/kategori-barang ────────────────────────────────
// List semua KategoriBarang beserta jumlah barang terkait.
// Digunakan untuk dropdown di form tambah/edit Master Barang.
export async function GET() {
  try {
    const kategori = await prisma.kategoriBarang.findMany({
      include: { _count: { select: { masterBarang: true } } },
      orderBy: { namaKategori: "asc" },
    });

    return NextResponse.json({ success: true, data: kategori });
  } catch (error) {
    console.error("GET /api/kategori-barang error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data kategori barang." },
      { status: 500 }
    );
  }
}

// ─── POST /api/kategori-barang ───────────────────────────────
// Tambah kategori barang baru (inline dari form tambah barang).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { namaKategori } = body;

    // Validasi input
    if (!namaKategori || typeof namaKategori !== "string" || namaKategori.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Nama kategori wajib diisi." },
        { status: 400 }
      );
    }

    // Cek nama kategori unik (case-insensitive)
    const existing = await prisma.kategoriBarang.findFirst({
      where: { namaKategori: { equals: namaKategori.trim(), mode: "insensitive" } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Kategori "${namaKategori.trim()}" sudah terdaftar.` },
        { status: 409 }
      );
    }

    const kategori = await prisma.kategoriBarang.create({
      data: { namaKategori: namaKategori.trim() },
    });

    return NextResponse.json({ success: true, data: kategori }, { status: 201 });
  } catch (error) {
    console.error("POST /api/kategori-barang error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan kategori barang." },
      { status: 500 }
    );
  }
}
