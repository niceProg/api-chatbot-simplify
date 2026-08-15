const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const geminiRoute = require("./routes/gemini");

// Origin yang boleh memanggil API ini. Bisa ditimpa lewat ALLOWED_ORIGINS
// (dipisah koma). Tanpa whitelist, siapa pun bisa memakai kuota LLM kita.
const DEFAULT_ORIGINS = [
     "https://portfolio.yum-dev.com",
     "https://yumnadev.documentme.my.id",
     "http://localhost:4200",
];

function allowedOrigins() {
     const fromEnv = (process.env.ALLOWED_ORIGINS || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);

     return fromEnv.length > 0 ? fromEnv : DEFAULT_ORIGINS;
}

function createApp() {
     const app = express();
     const origins = allowedOrigins();

     app.disable("x-powered-by");

     // Di belakang Nginx/proxy, tanpa ini rate limiter melihat semua request
     // datang dari satu IP proxy.
     app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 1));

     app.use(
          cors({
               origin(origin, callback) {
                    // Request tanpa Origin (curl, health check, server-to-server)
                    // tetap dilayani; yang dibatasi adalah pemakaian dari browser.
                    if (!origin || origins.includes(origin)) return callback(null, true);
                    return callback(new Error("Origin tidak diizinkan."));
               },
               methods: ["GET", "POST"],
          })
     );

     app.use(express.json({ limit: "32kb" }));

     const chatLimiter = rateLimit({
          windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
          max: Number(process.env.RATE_LIMIT_MAX || 30),
          standardHeaders: true,
          legacyHeaders: false,
          message: { error: "Terlalu banyak permintaan. Coba lagi beberapa menit lagi." },
     });

     app.use("/api", chatLimiter, geminiRoute);

     app.get("/", (req, res) => {
          res.json({
               status: "ok",
               service: "Portfolio Chat API",
          });
     });

     app.get("/health", (req, res) => {
          res.status(200).json({
               status: "healthy",
               uptime: process.uptime(),
               timestamp: new Date().toISOString(),
          });
     });

     app.use((req, res) => {
          res.status(404).json({ error: "Route tidak ditemukan." });
     });

     app.use((err, req, res, next) => {
          if (err && err.message === "Origin tidak diizinkan.") {
               return res.status(403).json({ error: err.message });
          }

          console.error("Unhandled error:", err);
          res.status(500).json({ error: "Terjadi kesalahan pada server." });
     });

     return app;
}

module.exports = createApp;
