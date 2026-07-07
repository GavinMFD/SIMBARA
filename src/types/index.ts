// ============================================
// TypeScript Types & Interfaces untuk SIMBARA
// ============================================

// Enums (mirror Prisma enums)
export enum Role {
  ADMIN = "ADMIN",
  OPERATOR = "OPERATOR",
  VIEWER = "VIEWER",
}

export enum KondisiBarang {
  BAIK = "BAIK",
  KURANG_BAIK = "KURANG_BAIK",
  RUSAK_BERAT = "RUSAK_BERAT",
  TIDAK_DITEMUKAN = "TIDAK_DITEMUKAN",
}

export enum StatusMutasi {
  PENDING = "PENDING",
  DISETUJUI = "DISETUJUI",
  DITOLAK = "DITOLAK",
}

// User
export interface User {
  id: string;
  email: string;
  nama: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

// Kategori
export interface Kategori {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Ruangan
export interface Ruangan {
  id: string;
  kode: string;
  nama: string;
  lantai?: number | null;
  gedung?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Barang
export interface Barang {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  merek?: string | null;
  tahunPerolehan?: number | null;
  nilaiPerolehan?: number | null;
  kondisi: KondisiBarang;
  keterangan?: string | null;
  jumlah: number;
  kategoriId: string;
  ruanganId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  kategori?: Kategori;
  ruangan?: Ruangan;
}

// Mutasi
export interface Mutasi {
  id: string;
  tanggalMutasi: Date;
  keterangan?: string | null;
  status: StatusMutasi;
  barangId: string;
  ruanganAsalId: string;
  ruanganTujuanId: string;
  dibuatOlehId: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  barang?: Barang;
  ruanganAsal?: Ruangan;
  ruanganTujuan?: Ruangan;
  dibuatOleh?: User;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form types
export interface BarangFormData {
  kodeBarang: string;
  namaBarang: string;
  merek?: string;
  tahunPerolehan?: number;
  nilaiPerolehan?: number;
  kondisi: KondisiBarang;
  keterangan?: string;
  jumlah: number;
  kategoriId: string;
  ruanganId: string;
}

export interface MutasiFormData {
  barangId: string;
  ruanganAsalId: string;
  ruanganTujuanId: string;
  tanggalMutasi: string;
  keterangan?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalBarang: number;
  totalKategori: number;
  totalRuangan: number;
  totalMutasi: number;
  barangPerKondisi: Record<KondisiBarang, number>;
  mutasiTerbaru: Mutasi[];
}
