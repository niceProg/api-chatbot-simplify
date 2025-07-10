const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

router.post("/chat", async (req, res) => {
     const userPromptRaw = req.body?.prompt;
     if (!userPromptRaw || typeof userPromptRaw !== "string") {
          return res.status(400).json({ error: "Prompt tidak valid atau kosong." });
     }
     const userPrompt = userPromptRaw.toLowerCase();

     const profile = JSON.parse(fs.readFileSync("my-profile.json", "utf-8"));

     // ========== 1. CUSTOM RESPONSE RULES ==========
     // Salam
     const greetings = ["assalamu'alaikum", "assalamualaikum", "salam", "assalamu alaikum"];
     const greetingsResponse = "Wa'alaikumsalam! Apa kabar? Senang bisa bantu kamu 😊";

     // Sapaan umum
     const casualGreetings = ["hai", "halo", "hi", "hello"];
     const casualResponse = "Halo juga! Ada yang bisa aku bantu seputar teknologi atau pengalamanku? 😊";

     // Tanya pengalaman
     const experienceKeywords = ["berapa pengalaman", "berapa tahun pengalaman", "sudah berapa lama"];
     const experiences = profile.experiences || []; // tambahkan jika belum ada

     // Auto reply jika cocok
     if (greetings.some((s) => userPrompt.includes(s))) {
          return res.json({ reply: greetingsResponse });
     }

     if (casualGreetings.some((s) => userPrompt.includes(s))) {
          return res.json({ reply: casualResponse });
     }

     if (experienceKeywords.some((k) => userPrompt.includes(k))) {
          // Kalkulasi pengalaman total jika tersedia
          const totalYears = experiences.reduce((acc, exp) => acc + (exp.years || 0), 0);
          const reply =
               totalYears > 0
                    ? `Kalau ditotal, aku punya sekitar ${totalYears} tahun pengalaman di bidang yang relevan.`
                    : "Pengalaman kerjaku belum dicantumkan detail di database, tapi aku aktif sejak kuliah dan banyak ikut proyek pribadi maupun tim.";
          return res.json({ reply });
     }

     // ========== 2. CONTEXT ke GEMINI ==========
     const context = `
Kamu adalah Wisnu Yumna Yudhanta, seorang Fullstack Developer. Ketika seseorang bertanya, jawab dengan gaya profesional, percaya diri, dan personal—seolah kamu sedang menjawab langsung sebagai Wisnu.

Berikut data tentang kamu:
- Nama: ${profile.name}
- Title: ${profile.title}
- Pendidikan: ${profile.education.degree} di ${profile.education.school} (${profile.education.year})
- Keahlian: ${profile.skills.join(", ")}

Beberapa proyekmu:
${profile.projects.map((p) => `• ${p.title}: ${p.desc} (Tech: ${p.tech.join(", ")})`).join("\n")}

Pertanyaan dari seseorang: "${req.body.prompt}"
Jawablah sebagai dirimu sendiri (Wisnu), tidak perlu menyebut "Wisnu" dalam orang ketiga.
`;

     try {
          const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
               contents: [{ parts: [{ text: context }] }],
          });

          const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "(no response)";
          res.json({ reply });
     } catch (err) {
          res.status(500).json({
               error: "Gagal mengambil respons Gemini",
               detail: err.response?.data || err.message,
          });
     }
});

module.exports = router;
