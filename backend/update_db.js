const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load .env if present
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smart_waste_management",
};

async function migrate() {
  console.log("Connecting to database:", dbConfig.database, "at", dbConfig.host);
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log("Database connected. Starting schema migrations...");

    // 1. Update roles in users table
    console.log("Updating role ENUM in users table...");
    await connection.execute(`
      ALTER TABLE users MODIFY COLUMN role ENUM('warga', 'admin', 'pengawas', 'armada') NOT NULL DEFAULT 'warga'
    `);

    // 2. Add status column in users table if not exists
    const [userColumns] = await connection.execute("SHOW COLUMNS FROM users LIKE 'status'");
    if (userColumns.length === 0) {
      console.log("Adding status column to users table...");
      await connection.execute(`
        ALTER TABLE users ADD COLUMN status ENUM('pending', 'approved', 'rejected', 'inactive') NOT NULL DEFAULT 'approved'
      `);
    } else {
      console.log("Status column already exists in users table.");
    }

    // 3. Add type column in locations table if not exists
    const [locationColumns] = await connection.execute("SHOW COLUMNS FROM locations LIKE 'type'");
    if (locationColumns.length === 0) {
      console.log("Adding type column to locations table...");
      await connection.execute(`
        ALTER TABLE locations ADD COLUMN type ENUM('Titik Sampah', 'TPS', 'TPA', 'TPS3R') NOT NULL DEFAULT 'Titik Sampah'
      `);
    } else {
      console.log("Type column already exists in locations table.");
    }

    // 4. Update status ENUM in locations table
    console.log("Updating status ENUM in locations table...");
    await connection.execute(`
      ALTER TABLE locations MODIFY COLUMN status ENUM('Bersih', 'Laporan Masuk', 'Penuh', 'Sedang Ditangani') NOT NULL DEFAULT 'Bersih'
    `);

    // 5. Update status ENUM in reports table
    console.log("Updating status ENUM in reports table...");
    await connection.execute(`
      ALTER TABLE reports MODIFY COLUMN status ENUM('Bersih', 'Laporan Masuk', 'Penuh', 'Sedang Ditangani') NOT NULL
    `);

    console.log("Migrations successfully completed!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
