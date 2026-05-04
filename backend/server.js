const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || "smart_waste_secret_change_me";
const MAX_PER_PAGE = 10;

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smart_waste_management",
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

const statusColorMap = {
  Bersih: "green",
  Sedang: "orange",
  Penuh: "red",
};

const getPagination = (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const perPage = Math.min(Math.max(Number(query.perPage || 10), 1), MAX_PER_PAGE);
  const offset = (page - 1) * perPage;
  return { page, perPage, offset };
};

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, name: user.full_name }, JWT_SECRET, {
    expiresIn: "7d",
  });

const auth = async (req, res, next) => {
  try {
    const raw = req.headers.authorization || "";
    const token = raw.startsWith("Bearer ") ? raw.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};

app.get("/api/health", (_req, res) => {
  res.json({ message: "Smart Waste API running" });
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Nama, email, dan password wajib diisi" });
    }

    /* Pendaftaran publik hanya untuk peran warga; admin dibuat lewat panel admin */
    const normalizedRole = "warga";
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [fullName, email, passwordHash, normalizedRole]
    );

    const user = { id: result.insertId, full_name: fullName, role: normalizedRole };
    res.status(201).json({ token: signToken(user), user });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }
    return res.status(500).json({ message: "Gagal registrasi", error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password wajib diisi" });
    }

    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    res.json({
      token: signToken(user),
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Gagal login", error: error.message });
  }
});

app.get("/api/me", auth, async (req, res) => {
  const [rows] = await db.execute("SELECT id, full_name, email, role FROM users WHERE id = ?", [
    req.user.id,
  ]);
  if (!rows.length) return res.status(404).json({ message: "User tidak ditemukan" });
  return res.json(rows[0]);
});

app.get("/api/locations", auth, async (req, res) => {
  try {
    const { page, perPage, offset } = getPagination(req.query);
    const search = req.query.search ? `%${req.query.search}%` : "%";

    const [rows] = await db.execute(
      `SELECT id, name, latitude, longitude, status, last_updated, photo_url, notes
       FROM locations
       WHERE name LIKE ?
       ORDER BY last_updated DESC
       LIMIT ? OFFSET ?`,
      [search, perPage, offset]
    );

    const [countRows] = await db.execute("SELECT COUNT(*) AS total FROM locations WHERE name LIKE ?", [
      search,
    ]);
    const total = countRows[0].total;

    res.json({
      data: rows.map((row) => ({ ...row, marker_color: statusColorMap[row.status] || "gray" })),
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) || 1 },
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal ambil data lokasi", error: error.message });
  }
});

app.post("/api/locations", auth, adminOnly, async (req, res) => {
  try {
    const { name, latitude, longitude, status, notes, photo_url } = req.body;
    if (!name || latitude == null || longitude == null || !status) {
      return res.status(400).json({ message: "Data lokasi belum lengkap" });
    }

    const [result] = await db.execute(
      `INSERT INTO locations (name, latitude, longitude, status, notes, photo_url, created_by, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, latitude, longitude, status, notes || null, photo_url || null, req.user.id]
    );

    res.status(201).json({ id: result.insertId, message: "Lokasi berhasil ditambahkan" });
  } catch (error) {
    res.status(500).json({ message: "Gagal tambah lokasi", error: error.message });
  }
});

app.put("/api/locations/:id", auth, adminOnly, async (req, res) => {
  try {
    const { name, latitude, longitude, status, notes, photo_url } = req.body;
    await db.execute(
      `UPDATE locations
       SET name = ?, latitude = ?, longitude = ?, status = ?, notes = ?, photo_url = ?, last_updated = NOW()
       WHERE id = ?`,
      [name, latitude, longitude, status, notes || null, photo_url || null, req.params.id]
    );
    res.json({ message: "Lokasi berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal update lokasi", error: error.message });
  }
});

app.delete("/api/locations/:id", auth, adminOnly, async (req, res) => {
  try {
    await db.execute("DELETE FROM locations WHERE id = ?", [req.params.id]);
    res.json({ message: "Lokasi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal hapus lokasi", error: error.message });
  }
});

app.post("/api/upload", auth, upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "File foto wajib diunggah" });
  return res.status(201).json({ photoUrl: `/uploads/${req.file.filename}` });
});

app.post("/api/reports", auth, async (req, res) => {
  try {
    const { locationId, locationName, latitude, longitude, status, photoUrl, notes } = req.body;
    if (!locationName || !status || !photoUrl) {
      return res.status(400).json({ message: "Data laporan belum lengkap" });
    }

    await db.execute(
      `INSERT INTO reports (location_id, reporter_id, location_name, latitude, longitude, status, photo_url, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [locationId || null, req.user.id, locationName, latitude || null, longitude || null, status, photoUrl, notes || null]
    );

    res.status(201).json({ message: "Laporan berhasil dikirim" });
  } catch (error) {
    res.status(500).json({ message: "Gagal kirim laporan", error: error.message });
  }
});

app.get("/api/reports", auth, adminOnly, async (req, res) => {
  try {
    const { page, perPage, offset } = getPagination(req.query);
    const search = req.query.search ? `%${req.query.search}%` : "%";

    const [rows] = await db.execute(
      `SELECT r.id, r.location_id, r.location_name, r.latitude, r.longitude, r.status, r.photo_url, r.notes, r.report_status, r.updated_at, r.created_at,
              u.full_name AS reporter_name
       FROM reports r
       JOIN users u ON u.id = r.reporter_id
       WHERE r.location_name LIKE ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [search, perPage, offset]
    );

    const [countRows] = await db.execute("SELECT COUNT(*) AS total FROM reports WHERE location_name LIKE ?", [
      search,
    ]);
    const total = countRows[0].total;

    res.json({
      data: rows,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) || 1 },
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal ambil laporan", error: error.message });
  }
});

app.patch("/api/reports/:id/approve", auth, adminOnly, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT * FROM reports WHERE id = ? FOR UPDATE", [
      req.params.id,
    ]);
    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    const report = rows[0];
    if (report.report_status !== "pending") {
      await connection.rollback();
      return res.status(400).json({ message: "Laporan sudah diproses" });
    }

    if (report.location_id) {
      await connection.execute(
        `UPDATE locations
         SET status = ?, notes = ?, photo_url = ?, last_updated = NOW()
         WHERE id = ?`,
        [report.status, report.notes, report.photo_url, report.location_id]
      );
    } else {
      const [insert] = await connection.execute(
        `INSERT INTO locations (name, latitude, longitude, status, photo_url, notes, created_by, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          report.location_name,
          report.latitude || 0,
          report.longitude || 0,
          report.status,
          report.photo_url,
          report.notes,
          req.user.id,
        ]
      );
      await connection.execute("UPDATE reports SET location_id = ? WHERE id = ?", [
        insert.insertId,
        report.id,
      ]);
    }

    await connection.execute("UPDATE reports SET report_status = 'approved', updated_at = NOW() WHERE id = ?", [
      report.id,
    ]);

    await connection.commit();
    return res.json({ message: "Laporan disetujui" });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ message: "Gagal menyetujui laporan", error: error.message });
  } finally {
    connection.release();
  }
});

app.delete("/api/reports/:id/reject", auth, adminOnly, async (req, res) => {
  try {
    await db.execute("DELETE FROM reports WHERE id = ?", [req.params.id]);
    res.json({ message: "Laporan ditolak dan dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menolak laporan", error: error.message });
  }
});

/** Hapus laporan (mis. yang sudah disetujui — arsip dibersihkan admin) */
app.delete("/api/reports/:id", auth, adminOnly, async (req, res) => {
  try {
    const [result] = await db.execute("DELETE FROM reports WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }
    res.json({ message: "Laporan dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus laporan", error: error.message });
  }
});

app.get("/api/users", auth, adminOnly, async (req, res) => {
  try {
    const { page, perPage, offset } = getPagination(req.query);
    const search = req.query.search ? `%${req.query.search}%` : "%";

    const [rows] = await db.execute(
      `SELECT id, full_name, email, role, created_at
       FROM users
       WHERE full_name LIKE ? OR email LIKE ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [search, search, perPage, offset]
    );

    const [countRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM users WHERE full_name LIKE ? OR email LIKE ?",
      [search, search]
    );

    const total = countRows[0].total;
    res.json({
      data: rows,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) || 1 },
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal ambil users", error: error.message });
  }
});

app.post("/api/users", auth, adminOnly, async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Nama, email, dan password wajib diisi" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }
    const normalizedRole = role === "admin" ? "admin" : "warga";
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [fullName, email, passwordHash, normalizedRole]
    );
    res.status(201).json({ message: "User berhasil ditambahkan", id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }
    res.status(500).json({ message: "Gagal menambah user", error: error.message });
  }
});

app.put("/api/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const { fullName, role } = req.body;
    await db.execute("UPDATE users SET full_name = ?, role = ? WHERE id = ?", [
      fullName,
      role === "admin" ? "admin" : "warga",
      req.params.id,
    ]);
    res.json({ message: "User berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal update user", error: error.message });
  }
});

app.delete("/api/users/:id", auth, adminOnly, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ message: "Tidak dapat menghapus akun yang sedang dipakai" });
    }
    const [r] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    if (r.affectedRows === 0) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.json({ message: "User berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus user", error: error.message });
  }
});

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: "Server error", error: err.message });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
