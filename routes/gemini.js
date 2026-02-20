const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PROFILE_PATH = path.resolve(__dirname, "../my-profile.json");

function loadProfile() {
     if (!fs.existsSync(PROFILE_PATH)) {
          throw new Error("File profile JSON tidak ditemukan.");
     }

     const raw = fs.readFileSync(PROFILE_PATH, "utf-8");
     return JSON.parse(raw);
}

function periodToMonths(periodText) {
     if (!periodText || typeof periodText !== "string") return 0;

     const [startText, endTextRaw] = periodText.split(" - ").map((item) => item.trim());
     if (!startText || !endTextRaw) return 0;

     const parseDate = (value, isEnd) => {
          if (/present/i.test(value)) {
               return new Date();
          }

          const parsed = new Date(`${value} 1`);
          if (!Number.isNaN(parsed.getTime())) {
               return parsed;
          }

          const yearMatch = value.match(/\b(19|20)\d{2}\b/);
          if (!yearMatch) return null;

          const year = Number(yearMatch[0]);
          return new Date(year, isEnd ? 11 : 0, 1);
     };

     const startDate = parseDate(startText, false);
     const endDate = parseDate(endTextRaw, true);
     if (!startDate || !endDate || endDate < startDate) return 0;

     const monthDiff =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;

     return Math.max(0, monthDiff);
}

function estimateExperienceYears(experiences = []) {
     const totalMonths = experiences.reduce((total, item) => total + periodToMonths(item.period), 0);
     if (!totalMonths) return 0;
     return Number((totalMonths / 12).toFixed(1));
}

function toArray(value) {
     return Array.isArray(value) ? value : [];
}

router.post("/chat", async (req, res) => {
     const rawPrompt = req.body?.prompt;
     if (!rawPrompt || typeof rawPrompt !== "string") {
          return res.status(400).json({ error: "Field `prompt` wajib diisi dan harus berupa string." });
     }

     const userPrompt = rawPrompt.toLowerCase(); // lowercase untuk memudahkan pencocokan
     let profile;

     try {
          profile = loadProfile();
     } catch (err) {
          return res.status(500).json({
               error: "Gagal membaca file profil JSON",
               detail: err.message,
          });
     }

     // ========== 1. CUSTOM RESPONSE RULES ==========
     // Salam
     const greetings = ["assalamu'alaikum", "assalamualaikum", "salam", "assalamu alaikum"];
     const greetingsResponse = "Wa'alaikumsalam! Apa kabar? Senang bisa bantu kamu 😊";

     // Sapaan umum
     const casualGreetings = ["hai", "halo", "hi", "hello"];
     const casualResponse = "Halo juga! Ada yang bisa aku bantu seputar teknologi atau pengalamanku? 😊";

     // Tanya pengalaman
     const experienceKeywords = ["berapa pengalaman", "berapa tahun pengalaman", "sudah berapa lama"];
     const experiences = profile.experience || [];

     // Auto reply jika cocok
     if (greetings.some((s) => userPrompt.includes(s))) {
          return res.json({ reply: greetingsResponse });
     }

     if (casualGreetings.some((s) => userPrompt.includes(s))) {
          return res.json({ reply: casualResponse });
     }

     if (experienceKeywords.some((k) => userPrompt.includes(k))) {
          const totalYears = estimateExperienceYears(experiences);
          const reply =
               totalYears > 0
                    ? `Kalau ditotal, aku punya sekitar ${totalYears} tahun pengalaman profesional di bidang yang relevan.`
                    : "Pengalaman kerjaku belum dicantumkan detail di database, tapi aku aktif sejak kuliah dan banyak ikut proyek pribadi maupun tim.";
          return res.json({ reply });
     }

     // ========== 2. CONTEXT ke GEMINI ==========
     const identity = profile.identity || {};
     const ownerName = identity.owner_name || "Wisnu Yumna Yudhanta";
     const ownerRole = identity.role || "Fullstack Developer";
     const ownerProfile = profile.owner_profile || {};
     const education = ownerProfile.education || {};
     const organizations = toArray(ownerProfile.organizations);
     const technicalSkills = toArray(profile.technical_skills);
     const softSkills = toArray(profile.soft_skills);
     const services = toArray(profile.services);
     const projects = toArray(profile.projects);
     const contacts = profile.contact || {};
     const responseDo = toArray(profile.response_guidelines?.do);
     const responseDont = toArray(profile.response_guidelines?.dont);
     const scopePurpose = toArray(profile.chatbot_scope?.purpose);
     const scopeOutOfScope = toArray(profile.chatbot_scope?.out_of_scope);
     const qualificationQuestions = toArray(profile.qualification_flow?.ask_in_order);
     const sampleFaq = toArray(profile.sample_faq);
     const certifications = toArray(profile.certifications_highlight);

     const experienceList =
          experiences.length > 0
               ? experiences
                      .map((exp) => {
                           const focusList = toArray(exp.focus).join(", ");
                           return `- ${exp.title || "-"} di ${exp.company || "-"} (${exp.period || "-"})${
                                focusList ? ` | Fokus: ${focusList}` : ""
                           }`;
                      })
                      .join("\n")
               : "- Belum ada data pengalaman.";

     const projectList =
          projects.length > 0
               ? projects
                      .map(
                           (p) =>
                                `- ${p.name} (${p.year}): ${p.summary}. Stack: ${(p.stack || []).join(", ")}${
                                     p.url ? `. URL: ${p.url}` : ""
                                }`
                      )
                      .join("\n")
               : "- Belum ada data project.";

     const organizationList =
          organizations.length > 0
               ? organizations
                      .map((org) => {
                           const highlightList = toArray(org.highlights).join(", ");
                           return `- ${org.name || "-"} (${org.period || "-"})${highlightList ? ` | Highlights: ${highlightList}` : ""}`;
                      })
                      .join("\n")
               : "- Belum ada data organisasi.";

     const certificationList =
          certifications.length > 0
               ? certifications.map((cert) => `- ${cert.title || "-"} (${cert.issuer || "-"}, ${cert.year || "-"})`).join("\n")
               : "- Belum ada data sertifikasi.";

     const faqList =
          sampleFaq.length > 0
               ? sampleFaq.map((item) => `- Q: ${item.q || "-"} | A: ${item.a || "-"}`).join("\n")
               : "- Belum ada FAQ.";

     const profileJson = JSON.stringify(profile, null, 2);

     const context = `
Kamu adalah ${ownerName}, seorang ${ownerRole}. Ketika seseorang bertanya, jawab dengan gaya profesional, percaya diri, dan personal seolah kamu menjawab langsung sebagai pemilik profil.

Berikut data tentang kamu:
- Nama: ${ownerName}
- Role: ${ownerRole}
- Alias: ${toArray(identity.owner_aliases).join(", ") || "-"}
- Website: ${identity.website || "-"}
- Bahasa utama: ${identity.primary_language || "id"}, bahasa kedua: ${identity.secondary_language || "en"}
- Last updated profile: ${profile.last_updated || "-"}
- Ringkasan profil: ${ownerProfile.summary || "-"}
- Pendidikan: ${education.degree || "-"} di ${education.institution || "-"} (${education.graduation_date || "-"})
- Technical skills: ${technicalSkills.join(", ") || "-"}
- Soft skills: ${softSkills.join(", ") || "-"}
- Services: ${services.join(", ") || "-"}

Tujuan chatbot:
- Scope utama: ${scopePurpose.join(" | ") || "-"}
- Di luar scope: ${scopeOutOfScope.join(" | ") || "-"}

Pengalaman kerja:
${experienceList}

Organisasi:
${organizationList}

Beberapa project:
${projectList}

Highlight sertifikasi:
${certificationList}

Urutan pertanyaan kualifikasi lead:
${qualificationQuestions.join(" | ") || "-"}

Contoh FAQ:
${faqList}

Panduan jawaban:
- Yang harus dilakukan: ${responseDo.join(" | ") || "-"}
- Yang harus dihindari: ${responseDont.join(" | ") || "-"}
- Kontak jika user siap lanjut: WhatsApp ${contacts.whatsapp || "-"}, LinkedIn ${contacts.linkedin || "-"}, GitHub ${contacts.github || "-"}

Data profile lengkap (JSON, jadikan ini sumber kebenaran jika ada detail yang belum tercantum di ringkasan):
${profileJson}

Pertanyaan dari visitor: "${rawPrompt}"
Jawab sebagai dirimu sendiri dalam bahasa Indonesia (kecuali visitor meminta bahasa lain), ringkas, jelas, dan ajak lanjut ke kontak saat relevan.
`;

     try {
          const response = await axios.post(
               `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
               {
                    contents: [{ parts: [{ text: context }] }],
               }
          );

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
