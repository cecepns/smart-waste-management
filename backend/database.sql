CREATE DATABASE IF NOT EXISTS smart_waste_management;
USE smart_waste_management;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('warga', 'admin', 'pengawas', 'armada') NOT NULL DEFAULT 'warga',
  status ENUM('pending', 'approved', 'rejected', 'inactive') NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  status ENUM('Bersih', 'Laporan Masuk', 'Penuh', 'Sedang Ditangani') NOT NULL DEFAULT 'Bersih',
  type ENUM('Titik Sampah', 'TPS', 'TPA', 'TPS3R') NOT NULL DEFAULT 'Titik Sampah',
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  photo_url VARCHAR(255) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_locations_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  location_id INT DEFAULT NULL,
  reporter_id INT NOT NULL,
  location_name VARCHAR(150) NOT NULL,
  latitude DECIMAL(10,7) DEFAULT NULL,
  longitude DECIMAL(10,7) DEFAULT NULL,
  status ENUM('Bersih', 'Laporan Masuk', 'Penuh', 'Sedang Ditangani') NOT NULL,
  photo_url VARCHAR(255) NOT NULL,
  notes TEXT DEFAULT NULL,
  report_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (full_name, email, password_hash, role)
VALUES ('Administrator', 'admin@smartwaste.local', '$2b$10$9EizA9vY9X6i4M1W6x1a9.XtVjehdWl0M6S01qmPvvrLpzjAU6Y0G', 'admin')
ON DUPLICATE KEY UPDATE email = email;

INSERT INTO locations (name, latitude, longitude, status, notes)
VALUES
('Titik Pasar Induk', -6.9147440, 107.6098100, 'Sedang', 'Volume meningkat saat pagi'),
('Titik Alun-Alun', -6.9218570, 107.6071030, 'Bersih', 'Area relatif bersih'),
('Titik Terminal Kota', -6.9174640, 107.6191230, 'Penuh', 'Perlu pengangkutan segera');
