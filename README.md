# SIMBARA - Sistem Informasi Manajemen Barang

Aplikasi web untuk pengelolaan aset dan barang inventaris berbasis Next.js.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Bahasa**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **UI**: shadcn/ui + TailwindCSS v4
- **Icons**: Lucide React

## Struktur Modul

| Modul       | Deskripsi                              |
| ----------- | -------------------------------------- |
| Dashboard   | Ringkasan data & statistik             |
| Barang      | CRUD data barang inventaris            |
| Kategori    | Pengelompokan jenis barang             |
| Ruangan     | Lokasi penempatan barang               |
| Mutasi      | Perpindahan barang antar ruangan       |
| Laporan     | Export laporan PDF/Excel               |
| Pengguna    | Manajemen user & role (khusus Admin)   |

## Prasyarat

- Node.js 18+
- PostgreSQL (atau Supabase project)
- npm

## Cara Menjalankan

1. Clone repository dan install dependencies:

```bash
npm install
```

2. Salin file environment:

```bash
cp .env.example .env.local
```

3. Isi konfigurasi di `.env.local` (DATABASE_URL, Supabase keys)

4. Generate Prisma client:

```bash
npx prisma generate
```

5. Jalankan migrasi database:

```bash
npx prisma migrate dev
```

6. Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Role Pengguna

| Role     | Hak Akses                                    |
| -------- | -------------------------------------------- |
| ADMIN    | Akses penuh, kelola pengguna                 |
| OPERATOR | CRUD barang, mutasi, lihat laporan           |
| VIEWER   | Hanya bisa melihat data                      |

## Skrip Tersedia

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Production server
npm run lint      # Linting
```
