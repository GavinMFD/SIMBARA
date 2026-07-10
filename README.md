# SIMBARA - Sistem Informasi Manajemen Barang

SIMBARA adalah aplikasi web untuk pengelolaan aset dan barang inventaris berbasis **Next.js 16**, **Prisma ORM**, dan **Supabase (PostgreSQL & Auth)**.

---

## 👥 Setup & Alur Kerja Git (3 Anggota Tim)

Untuk memastikan kolaborasi berjalan lancar tanpa konflik, tim menggunakan strategi Git branching berikut:

1. **`main`**: Branch produksi. Kode di branch ini harus selalu stabil dan siap rilis. Jangan melakukan commit langsung ke branch ini.
2. **`develop`**: Branch integrasi utama. Semua fitur baru digabungkan ke sini terlebih dahulu sebelum dirilis ke `main`.
3. **Branch Fitur (`feature/nama-fitur`)**: Setiap anggota tim membuat branch baru dari `develop` ketika mengerjakan fitur/bug:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nama-fitur
   ```
   Setelah selesai, buat **Pull Request (PR)** kembali ke branch `develop`.

---

## ⚡ Prasyarat Sistem

Sebelum memulai, pastikan semua anggota tim telah menginstal:
- **Node.js** v18 atau yang lebih baru
- **Git** untuk kontrol versi
- **Akun Supabase** (Daftar gratis di [supabase.com](https://supabase.com))

---

## 🛠️ Langkah-Langkah Setup Lokal

Setiap anggota tim harus mengikuti langkah-langkah berikut untuk menjalankan aplikasi secara lokal:

### 1. Clone Repositori & Masuk ke Branch `develop`

Hubungi admin/owner repo untuk akses, kemudian jalankan:
```bash
git clone https://github.com/GavinMFD/SIMBARA.git
cd SIMBARA
git checkout develop
git pull origin develop
```

### 2. Konfigurasi Project Supabase & Database

Setiap developer direkomendasikan membuat project Supabase masing-masing untuk development agar tidak mengganggu database developer lain:

1. Masuk ke **[Supabase Dashboard](https://database.new)** dan klik **New Project**.
2. Masukkan nama project (misal: `simbara-dev-nama`), password database, dan pilih region terdekat (misal: *Singapore*).
3. Setelah project dibuat, masuk ke menu **Project Settings** > **Database** untuk mendapatkan **Connection String**:
   - Cari bagian **Connection string** -> **URI**.
   - Contoh URI: `postgresql://postgres.[username]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` (Gunakan mode Connection Pooling jika menggunakan Prisma, atau Direct Connection di port 5432).
4. Masuk ke menu **Project Settings** > **API** untuk mendapatkan API keys:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **Anon public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`)

### 3. Setup Environment Variables

Salin file `.env.example` menjadi `.env.local` (Next.js otomatis meload `.env.local` saat development):
```bash
cp .env.example .env.local
```

Buka `.env.local` dan isi nilainya sesuai dengan project Supabase masing-masing:
```env
# Database Connection (Ambil dari Project Settings > Database > Connection String)
DATABASE_URL="postgresql://postgres.[your-project-id]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[your-project-id]:[your-password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase API Credentials (Ambil dari Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL="https://[your-project-id].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"

# Aplikasi
NEXT_PUBLIC_APP_NAME="SIMBARA"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Install Dependencies & Generate Prisma Client

Jalankan perintah berikut untuk menginstal package dan menghasilkan tipe data Prisma Client:
```bash
npm install
npx prisma generate
```

### 5. Sinkronisasi Skema Database (Prisma Migration)

Migrasikan skema database SIMBARA ke database Supabase Anda:
```bash
# Untuk menerapkan skema pertama kali ke database Supabase
npx prisma db push
```

*(Catatan: Jika ingin menggunakan pelacakan migrasi penuh secara formal, gunakan `npx prisma migrate dev --name init`).*

### 6. Jalankan Server Development

Sekarang Anda siap menjalankan aplikasi secara lokal:
```bash
npm run dev
```

Buka **[http://localhost:3000](http://localhost:3000)** di browser Anda.

---

## 📁 Struktur Modul Aplikasi

| Modul       | Deskripsi                              |
| ----------- | -------------------------------------- |
| **Dashboard**| Ringkasan data, statistik barang & grafik mutasi |
| **Barang**   | CRUD data barang inventaris beserta kondisinya |
| **Kategori** | Pengelompokan jenis barang (elektronik, furnitur, dll.) |
| **Ruangan**  | Lokasi penempatan fisik barang inventaris |
| **Mutasi**   | Pencatatan perpindahan barang antar ruangan |
| **Laporan**  | Ekspor laporan barang & mutasi ke PDF/Excel |
| **Pengguna** | Manajemen user & role (`ADMIN`, `OPERATOR`, `VIEWER`) |

---

## 🛠️ Skrip Perintah yang Tersedia

- `npm run dev` : Menjalankan development server.
- `npm run build` : Membuat production build aplikasi.
- `npm run start` : Menjalankan production build secara lokal.
- `npm run lint` : Menjalankan pengecekan linter ESLint untuk menjaga kualitas kode.
- `npx prisma studio` : Membuka GUI database local/remote bawaan Prisma di browser.

