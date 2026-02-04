const express = require("express");
const cors = require("cors");

const geminiRoute = require("./routes/gemini");

function createApp() {
     const app = express();

     app.disable("x-powered-by");
     app.use(cors());
     app.use(express.json({ limit: "1mb" }));

     app.use("/api", geminiRoute);

     app.get("/", (req, res) => {
          res.json({
               status: "ok",
               service: "Gemini API",
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
          console.error("Unhandled error:", err);
          res.status(500).json({ error: "Terjadi kesalahan pada server." });
     });

     return app;
}

module.exports = createApp;
