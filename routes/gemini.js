const express = require("express");
const axios = require("axios");
const router = express.Router();

// ✅ Load dotenv hanya di lokal
if (process.env.NODE_ENV !== "production") {
     require("dotenv").config();
}

// ✅ Load profile langsung via require (lebih cepat & aman untuk Vercel)
const profile = require("../my-profile.json");

router.post("/chat", async (req, res) => {
     console.log("✅ [POST] /chat called");

     const userPromptRaw = req.body?.prompt;
     if (!userPromptRaw || typeof userPromptRaw !== "string") {
          return res.status(400).json({ error: "Prompt tidak valid atau kosong." });
     }

     const userPrompt = userPromptRaw.toLowerCase();
     console.log("📝 Prompt:", userPrompt);

     // ========== 1. CUSTOM RESPONSE RULES ==========
     const greetings = ["assalamu'alaikum", "assalamualaikum", "salam", "assalamu alaikum"];
     const casualGreetings = ["hai", "halo", "hi", "hello"];
     const experienceKeywords = ["berapa pengalaman", "berapa tahun pengalaman", "sudah berapa lama"];
     const experiences = profile.experiences || [];

     if (greetings.some((s) => userPrompt.includes(s))) {
          return res.json({ reply: "Wa'alaikumsalam! Apa kabar? Senang bisa bantu kamu 😊" });
     }

     if (casualGreetings.some((s) => userPrompt.includes(s))) {
          return res.json({ reply: "Halo juga! Ada yang bisa aku bantu seputar teknologi atau pengalamanku? 😊" });
     }

     if (experienceKeywords.some((k) => userPrompt.includes(k))) {
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

Pertanyaan dari seseorang: "${userPromptRaw}"
Jawablah sebagai dirimu sendiri (Wisnu), tidak perlu menyebut "Wisnu" dalam orang ketiga.
`;

     try {
          const geminiRes = await axios.post(
               `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
               { contents: [{ parts: [{ text: context }] }] },
               { timeout: 8000 } // ⏱️ Batas 8 detik biar gak timeout
          );

          const reply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "(no response)";
          res.json({ reply });
     } catch (err) {
          console.error("❌ Error Gemini API:", err.message);
          res.status(500).json({
               error: "Gagal mengambil respons Gemini",
               detail: err.response?.data || err.message,
          });
     }
});

module.exports = router;
