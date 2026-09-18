-- ------------------------------------------------------------
-- 1. AKSES & MASTER DATA UMUM
-- ------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    needs_password_reset BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE ruangan (
    id VARCHAR(255) PRIMARY KEY,
    kode_ruangan VARCHAR(255) NOT NULL UNIQUE,
    nama_ruangan VARCHAR(255) NOT NULL,
    lantai_lokasi VARCHAR(255),
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE pengaturan_ttd (
    id VARCHAR(255) PRIMARY KEY,
    jenis_jabatan VARCHAR(50) NOT NULL,
    nama_pejabat VARCHAR(255) NOT NULL,
    nip VARCHAR(100) NOT NULL,
    jabatan VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE pegawai (
    id VARCHAR(255) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    unit_kerja VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------
-- 2. MODUL PERSEDIAAN (Persediaan) — FIFO
-- ------------------------------------------------------------
CREATE TABLE kategori_barang (
    id VARCHAR(255) PRIMARY KEY,
    nama_kategori VARCHAR(255) NOT NULL
);

CREATE TABLE master_barang (
    id VARCHAR(255) PRIMARY KEY,
    kategori_barang_id VARCHAR(255) NOT NULL,
    nama_barang VARCHAR(255) NOT NULL,
    satuan VARCHAR(50) NOT NULL,
    stok_minimum INTEGER NOT NULL,
    stok_aktual INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (kategori_barang_id) REFERENCES kategori_barang(id)
);

CREATE TABLE batch_surat_belanja (
    id VARCHAR(255) PRIMARY KEY,
    master_barang_id VARCHAR(255) NOT NULL,
    no_surat_belanja VARCHAR(255) NOT NULL,
    tanggal_belanja DATE NOT NULL,
    harga_satuan DECIMAL(14, 2) NOT NULL,
    qty_masuk INTEGER NOT NULL,
    sisa_qty INTEGER NOT NULL,
    dicatat_oleh VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (master_barang_id) REFERENCES master_barang(id),
    FOREIGN KEY (dicatat_oleh) REFERENCES users(id)
);

CREATE TABLE transaksi_persediaan (
    id VARCHAR(255) PRIMARY KEY,
    master_barang_id VARCHAR(255) NOT NULL,
    pegawai_id VARCHAR(255) NOT NULL,
    qty_diambil INTEGER NOT NULL,
    tanggal_pengambilan TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (master_barang_id) REFERENCES master_barang(id),
    FOREIGN KEY (pegawai_id) REFERENCES pegawai(id)
);

CREATE TABLE transaksi_persediaan_detail (
    id VARCHAR(255) PRIMARY KEY,
    transaksi_persediaan_id VARCHAR(255) NOT NULL,
    batch_surat_belanja_id VARCHAR(255) NOT NULL,
    qty_dipakai INTEGER NOT NULL,
    harga_saat_pakai DECIMAL(14, 2) NOT NULL,
    FOREIGN KEY (transaksi_persediaan_id) REFERENCES transaksi_persediaan(id),
    FOREIGN KEY (batch_surat_belanja_id) REFERENCES batch_surat_belanja(id)
);

-- ------------------------------------------------------------
-- 3. MODUL ASET TETAP (NUP)
-- ------------------------------------------------------------
CREATE TABLE kategori_aset (
    id VARCHAR(255) PRIMARY KEY,
    nama_kategori VARCHAR(255) NOT NULL
);

CREATE TABLE batch_pembelian_aset (
    id VARCHAR(255) PRIMARY KEY,
    kategori_aset_id VARCHAR(255) NOT NULL,
    no_surat_belanja VARCHAR(255) NOT NULL,
    tanggal_beli DATE NOT NULL,
    nama_aset VARCHAR(255) NOT NULL,
    merek_tipe VARCHAR(255),
    harga_satuan DECIMAL(14, 2) NOT NULL,
    jumlah_unit INTEGER NOT NULL,
    dicatat_oleh VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (kategori_aset_id) REFERENCES kategori_aset(id),
    FOREIGN KEY (dicatat_oleh) REFERENCES users(id)
);

CREATE TABLE master_aset (
    id VARCHAR(255) PRIMARY KEY,
    batch_pembelian_id VARCHAR(255) NOT NULL,
    nup VARCHAR(255) NOT NULL UNIQUE,
    ruangan_id VARCHAR(255) NOT NULL,
    kondisi VARCHAR(50) DEFAULT 'baik' NOT NULL,
    status_aset VARCHAR(50) DEFAULT 'aktif' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (batch_pembelian_id) REFERENCES batch_pembelian_aset(id),
    FOREIGN KEY (ruangan_id) REFERENCES ruangan(id)
);

CREATE TABLE mutasi_aset (
    id VARCHAR(255) PRIMARY KEY,
    aset_id VARCHAR(255) NOT NULL,
    ruangan_asal_id VARCHAR(255) NOT NULL,
    ruangan_tujuan_id VARCHAR(255) NOT NULL,
    tanggal_mutasi DATE NOT NULL,
    keterangan TEXT,
    dicatat_oleh VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (aset_id) REFERENCES master_aset(id),
    FOREIGN KEY (ruangan_asal_id) REFERENCES ruangan(id),
    FOREIGN KEY (ruangan_tujuan_id) REFERENCES ruangan(id),
    FOREIGN KEY (dicatat_oleh) REFERENCES users(id)
);

CREATE TABLE riwayat_kondisi_aset (
    id VARCHAR(255) PRIMARY KEY,
    aset_id VARCHAR(255) NOT NULL,
    kondisi_lama VARCHAR(50) NOT NULL,
    kondisi_baru VARCHAR(50) NOT NULL,
    tanggal_perubahan DATE NOT NULL,
    keterangan TEXT,
    dicatat_oleh VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (aset_id) REFERENCES master_aset(id),
    FOREIGN KEY (dicatat_oleh) REFERENCES users(id)
);
