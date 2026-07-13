-- Migration SQL for SOMPAH Palopo Updates
-- Jalankan script ini pada database Anda untuk menerapkan perubahan skema.

USE smart_waste_management;

-- 1. Perbarui opsi role pada tabel users
ALTER TABLE users MODIFY COLUMN role ENUM('warga', 'admin', 'pengawas', 'armada') NOT NULL DEFAULT 'warga';

-- 2. Tambahkan kolom status pada tabel users jika belum ada
-- (Jika kolom sudah ada dan query ini error, abaikan saja)
ALTER TABLE users ADD COLUMN status ENUM('pending', 'approved', 'rejected', 'inactive') NOT NULL DEFAULT 'approved';

-- 3. Tambahkan kolom type pada tabel locations jika belum ada
-- (Jika kolom sudah ada dan query ini error, abaikan saja)
ALTER TABLE locations ADD COLUMN type ENUM('Titik Sampah', 'TPS', 'TPA', 'TPS3R') NOT NULL DEFAULT 'Titik Sampah';

-- 4. Perbarui tipe kolom status pada tabel locations
ALTER TABLE locations MODIFY COLUMN status ENUM('Bersih', 'Laporan Masuk', 'Penuh', 'Sedang Ditangani') NOT NULL DEFAULT 'Bersih';

-- 5. Perbarui tipe kolom status pada tabel reports
ALTER TABLE reports MODIFY COLUMN status ENUM('Bersih', 'Laporan Masuk', 'Penuh', 'Sedang Ditangani') NOT NULL;
