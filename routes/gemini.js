const express = require("express");
const router = express.Router();
const axios = require("axios");

// Load .env hanya jika bukan di production
if (process.env.NODE_ENV !== "production") {
     require("dotenv").config();
}

// Lebih aman dan cepat untuk serverless
let profile;
try {
     profile = require("../my-profile.json");
} catch (err) {
     console.error("❌ Gagal load my-profile.json:", err.message);
     profile = {};
}

router.post("/chat", async (req, res) => {
     console.log("✅ [POST] /chat called");

     const promptRaw = req.body?.prompt;
     if (!promptRaw || typeof promptRaw !== "string") {
          return res.status(400).json({ error: "Prompt tidak valid." });
     }

     const prompt = promptRaw.toLowerCase();

     // Auto responses
     if (["hai", "halo", "hi", "hello"].some((w) => prompt.includes(w))) {
          return res.json({ reply: "Halo juga! Ada yang bisa aku bantu?" });
     }

     if (["assalamu'alaikum", "assalamualaikum", "assalamu alaikum"].some((w) => prompt.includes(w))) {
          return res.json({ reply: "Wa'alaikumsalam! Semoga harimu menyenangkan 😊" });
     }

     // Check Gemini API Key
     const apiKey = process.env.GEMINI_API_KEY;
     if (!apiKey) {
          console.error("❌ API Key kosong");
          return res.status(500).json({ error: "API Key belum dikonfigurasi." });
     }

     const context = `
Kamu adalah Wisnu Yumna Yudhanta, seorang Fullstack Developer. Jawab semua pertanyaan sebagai dirimu sendiri, profesional dan personal.

Profil:
- Nama: ${profile.name}
- Title: ${profile.title}
- Pendidikan: ${profile.education?.degree} di ${profile.education?.school} (${profile.education?.year})
- Skills: ${profile.skills?.join(", ")}

Pertanyaan: "${promptRaw}"
`;

     try {
          const geminiRes = await axios.post(
               `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
               {
                    contents: [{ parts: [{ text: context }] }],
               },
               {
                    timeout: 6000, // 🛡️ Auto fail in 6s
               }
          );

          const reply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "(no response)";
          return res.json({ reply });
     } catch (err) {
          console.error("❌ Gemini API error:", err.message);
          return res.status(500).json({
               error: "Gagal terhubung ke Gemini API",
               detail: err.message,
          });
     }
});

module.exports = router;
