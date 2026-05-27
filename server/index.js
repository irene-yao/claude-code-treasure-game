require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

app.use(cors());
app.use(express.json());

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// POST /api/auth/signup
app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });
  if (password.length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = db
      .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
      .run(email, passwordHash);
    const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, user: { id: result.lastInsertRowid, email } });
  } catch (err) {
    if (err.message.includes("UNIQUE"))
      return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/signin
app.post("/api/auth/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ token, user: { id: user.id, email: user.email } });
});

// GET /api/auth/me
app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email } });
});

// POST /api/scores
app.post("/api/scores", authMiddleware, (req, res) => {
  const { score } = req.body;
  if (score === undefined)
    return res.status(400).json({ error: "Score required" });
  db.prepare("INSERT INTO scores (user_id, score) VALUES (?, ?)").run(
    req.user.id,
    score,
  );
  res.json({ ok: true });
});

// GET /api/scores
app.get("/api/scores", authMiddleware, (req, res) => {
  const scores = db
    .prepare(
      "SELECT score, played_at FROM scores WHERE user_id = ? ORDER BY played_at DESC LIMIT 10",
    )
    .all(req.user.id);
  res.json({ scores });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
