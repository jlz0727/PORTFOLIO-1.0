// ============================================================
// server.js — Secure AI Backend for John Lord G. Zambrano Portfolio
// Stack: Node.js + Express + Google Gemini API
// API key is NEVER exposed to the frontend.
// ============================================================

require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ──
// If ALLOWED_ORIGIN is set in .env, restrict to that domain only.
// Otherwise allow all origins (fine for local dev / Netlify Functions).
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));
app.use(express.json());

// ── JOHN'S FULL PROFILE (system context fed to Gemini) ──
const JOHN_PROFILE = `
You are a professional virtual assistant representing John Lord G. Zambrano.
Only answer using the profile data below. Do not invent or hallucinate any information.
Stay polite, friendly, and professional at all times.
If a question is clearly outside scope, respond exactly with:
"I can only provide information about John's background, skills, projects, and experience."

=== PROFILE DATA ===

PERSONAL INFORMATION:
- Full Name: John Lord G. Zambrano
- Address: 170 General Evangelista St, Caloocan City, Metro Manila
- Phone: +639683673765
- Email: jlgzambrano27@gmail.com
- LinkedIn: https://linkedin.com/in/john-lord-zambrano
- Date of Birth: July 27, 2006 (19 years old)

CAREER OBJECTIVE:
A Bachelor of Science in Computer Engineering student with a fundamental knowledge and strong interest
in AI Automation, Hardware/Software Systems, and Cybersecurity. Seeking an entry-level opportunity to
improve and gain more hands-on experience in AI Technologies or basic security practices. Eager to
further develop technical skills, adapt to real-world challenges, and contribute effectively to
the company's objectives and goals.

EDUCATION:
- Bachelor of Science in Computer Engineering — University of the East (Caloocan), 2024–Present (3rd Year)
  Achievement: Dean's Lister
- Senior High School — St. Gabriel Academy, 2022–2024
  Achievement: Consistent Honor Student | Awarded Best in Research

SKILLS:
- AI Automation
- Network Security Fundamentals
- Fundamentals of C, C++, and C#
- Problem-solving
- Hardware: Arduino and Circuit Design
- Analytical Thinking

WORKSHOP AND SEMINAR EXPERIENCE:
1. ISC2 Certified in Cybersecurity (CC) — April 2026–Present (Ongoing)
   Currently taking full course self-paced training covering security principles, network security, and risk management.
2. Stellar UniTour Bootcamp (Blockchain Training) — March 2026
   Completed training in blockchain fundamentals, decentralized systems, and crypto-based transactions.
3. Hack The Box (Cybersecurity Fundamentals) — March 2026
   Covered essential security concepts, tools, and attacker mindset.
4. Tech Talk (Emerging Technologies) — February 2026
   Covered current innovations and future trends in tech, especially Artificial Intelligence.
5. Blockchain Demystified — December 2025
   Covered fundamental blockchain concepts and simple simulation.

PROJECTS:
1. CivicLens — AI-Powered Societal Fact-Checking System (OOP Project)
   - Designed a workflow where user queries/links are processed by an integrated AI model for fact-checking.
   - Developed an automation system that evaluates and verifies claims related to societal issues.
   - Implemented using C# in Visual Studio with structured input, AI processing, and response display.

2. WhereDidItGo — Soroban Smart Contract (Stellar Bootcamp Project)
   - Developed a decentralized voucher management system using Soroban smart contracts on Stellar blockchain.
   - Enabled secure issuance and redemption of vouchers between NGOs and merchants.
   - Improved transparency and reliability in voucher transactions through blockchain automation.

HOBBIES & INTERESTS:
- Games: Valorant, Mobile Legends: Bang Bang, Call of Duty Mobile
- Sports: Volleyball
- Favorite colors: Blue and Black
- Favorite foods: Fried Chicken and Ginisang Ampalaya

AREAS OF INTEREST:
- AI Automation
- Cybersecurity
- Hardware/Software Systems
`;

// ── /chat ENDPOINT ──
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    // Fallback response when API key is not configured
    const fallbackReply = "Hi! I'm John's AI assistant. I can tell you about his skills in AI automation, cybersecurity, and hardware systems. What would you like to know?";
    return res.json({ reply: fallbackReply });
  }

  try {
    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: JOHN_PROFILE + '\n\nUser question: ' + message.trim() }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 400,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      // Fallback response on API error
      const fallbackReply = "I'm John's assistant. I can answer questions about his background in AI, cybersecurity, and hardware. How can I help?";
      return res.json({ reply: fallbackReply });
    }

    const data = await response.json();
    const aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "I'm sorry, I couldn't generate a response right now.";

    return res.json({ reply: aiText });

  } catch (err) {
    console.error('Server error:', err.message);
    // Fallback response on error
    const fallbackReply = "Sorry, I'm having trouble connecting right now. I'm John's assistant — ask me about his skills, projects, or experience!";
    return res.json({ reply: fallbackReply });
  }
});

// ── HEALTH CHECK ──
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: "John's Portfolio AI backend is running." });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`🔐 API key loaded: ${process.env.AI_API_KEY ? 'YES' : 'NO ⚠️'}`);
});
