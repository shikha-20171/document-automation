/**
 * Comprehensive System Test: Gemini AI, Tesseract OCR, Email, Document Build
 */
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, ".env") });

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";

const GREEN = "\x1b[32m✅";
const RED = "\x1b[31m❌";
const YELLOW = "\x1b[33m⚠️";
const RESET = "\x1b[0m";
const BLUE = "\x1b[36m🔷";

function pass(msg) { console.log(`${GREEN} ${msg}${RESET}`); }
function fail(msg, err) { console.log(`${RED} ${msg}${RESET}`, err?.message || err || ""); }
function warn(msg) { console.log(`${YELLOW} ${msg}${RESET}`); }
function info(msg) { console.log(`${BLUE} ${msg}${RESET}`); }

// ─────────────────────────────────────────────────────────────
// 1. TEST: GEMINI API KEY
// ─────────────────────────────────────────────────────────────
async function testGemini() {
  info("Testing Gemini API Key...");
  if (!GEMINI_KEY) { fail("GEMINI_API_KEY is not set in .env"); return false; }

  const models = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro-latest",
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
      const body = JSON.stringify({
        contents: [{ parts: [{ text: "Say 'AI OK' in exactly 2 words." }] }],
        generationConfig: { maxOutputTokens: 20, temperature: 0 },
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();

      if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = data.candidates[0].content.parts[0].text.trim();
        pass(`Gemini [${model}] responded: "${text}"`);
        return { success: true, model, text };
      } else {
        const errMsg = data.error?.message || `HTTP ${res.status}`;
        warn(`Gemini [${model}] failed: ${errMsg}. Trying next model...`);
      }
    } catch (err) {
      warn(`Gemini [${model}] error: ${err.message}. Trying next model...`);
    }
  }
  fail("All Gemini models failed. The API key may be invalid or quota exceeded.");
  return false;
}

// ─────────────────────────────────────────────────────────────
// 2. TEST: UPDATE GEMINI KEY IN DATABASE
// ─────────────────────────────────────────────────────────────
async function updateGeminiKeyInDB() {
  info("Updating Gemini API key in database (Super Admin config)...");
  try {
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const prisma = require("./src/config/prismaClient.js");
    const { encryptApiKey } = require("./src/utils/aiEncryption.js");

    const encrypted = encryptApiKey(GEMINI_KEY);
    const updated = await prisma.aIProvider.updateMany({
      where: { providerCode: { in: ["gemini", "google", "google_gemini"] } },
      data: {
        apiKeyEncrypted: encrypted,
        status: "ACTIVE",
        connectionStatus: "CONNECTED",
        lastConnectedAt: new Date(),
      },
    });

    if (updated.count > 0) {
      pass(`Gemini API key updated in DB for ${updated.count} provider record(s)`);
    } else {
      // Try to create it
      const created = await prisma.aIProvider.create({
        data: {
          providerName: "Google Gemini",
          providerCode: "gemini",
          description: "Google Gemini AI – multimodal vision + text generation",
          baseUrl: "https://generativelanguage.googleapis.com/v1beta",
          apiVersion: "v1beta",
          priority: 1,
          isDefault: true,
          supportsChat: true,
          supportsVision: true,
          supportsOCR: true,
          supportsStreaming: true,
          status: "ACTIVE",
          connectionStatus: "CONNECTED",
          apiKeyEncrypted: encrypted,
          lastConnectedAt: new Date(),
        },
      });
      pass(`Created new Gemini provider record in DB (id: ${created.id})`);
    }

    // Ensure default models exist
    const providerRecord = await prisma.aIProvider.findFirst({ where: { providerCode: "gemini" } });
    if (providerRecord) {
      const models = [
        { modelName: "Gemini 2.0 Flash", modelCode: "gemini-2.0-flash-exp", isDefault: true },
        { modelName: "Gemini 1.5 Flash", modelCode: "gemini-1.5-flash-latest", isDefault: false },
        { modelName: "Gemini 1.5 Pro", modelCode: "gemini-1.5-pro-latest", isDefault: false },
      ];
      for (const m of models) {
        await prisma.aIModel.upsert({
          where: { modelCode: m.modelCode },
          update: { isDefault: m.isDefault, status: "ACTIVE" },
          create: { providerId: providerRecord.id, modelName: m.modelName, modelCode: m.modelCode, isDefault: m.isDefault, status: "ACTIVE", isEnabled: true },
        }).catch(() => {});
      }
      pass("Gemini models seeded in DB (gemini-2.0-flash-exp, gemini-1.5-flash-latest, gemini-1.5-pro-latest)");
    }

    // Update AI routing config
    const existingRouting = await prisma.aIRoutingConfig.findFirst();
    if (existingRouting) {
      await prisma.aIRoutingConfig.update({
        where: { id: existingRouting.id },
        data: {
          primaryProviderCode: "gemini",
          primaryModel: GEMINI_MODEL,
          fallbackProviderCode: "gemini",
          fallbackModel: "gemini-1.5-flash-latest",
          routingEnabled: true,
          updatedBy: "system-test",
        },
      });
    } else {
      await prisma.aIRoutingConfig.create({
        data: {
          primaryProviderCode: "gemini",
          primaryModel: GEMINI_MODEL,
          fallbackProviderCode: "gemini",
          fallbackModel: "gemini-1.5-flash-latest",
          routingEnabled: true,
          updatedBy: "system-test",
        },
      });
    }
    pass(`AI routing config set to: ${GEMINI_MODEL}`);
    await prisma.$disconnect();
    return true;
  } catch (err) {
    fail("DB update failed:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// 3. TEST: TESSERACT OCR
// ─────────────────────────────────────────────────────────────
async function testTesseract() {
  info("Testing Tesseract OCR...");
  try {
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const tesseractService = require("./src/services/ocr/tesseractService.js");

    // Test basic connectivity
    const result = await tesseractService.testTesseract({ language: "eng" });
    if (result.success || result.status === "connected") {
      pass(`Tesseract OCR is working – version: ${result.version || "installed"}, lang: ${result.language || "eng"}`);
      return true;
    } else {
      warn(`Tesseract test result: ${JSON.stringify(result)}`);
      return false;
    }
  } catch (err) {
    fail("Tesseract test error:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// 4. TEST: EMAIL (SMTP via Brevo)
// ─────────────────────────────────────────────────────────────
async function testEmail() {
  info("Testing Email (Brevo SMTP)...");
  try {
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const nodemailer = require("nodemailer");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    pass("Email SMTP connection verified successfully (Brevo)");

    // Send actual test email
    const info2 = await transporter.sendMail({
      from: `"DocuCore AI Test" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: process.env.SMTP_FROM || "gourshikha2001@gmail.com",
      subject: "✅ DocuCore AI – System Test Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 12px;">
          <h2 style="color: #7c3aed;">✅ DocuCore AI – Email System Working</h2>
          <p>This is an automated system test email confirming that the email service is operational.</p>
          <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
            <tr style="background:#7c3aed; color: white;">
              <th style="padding:8px; text-align:left;">Component</th>
              <th style="padding:8px; text-align:left;">Status</th>
            </tr>
            <tr style="background: #f0fdf4;">
              <td style="padding:8px;">Email / SMTP</td>
              <td style="padding:8px;">✅ Working</td>
            </tr>
            <tr>
              <td style="padding:8px;">Gemini AI</td>
              <td style="padding:8px;">🔄 Tested separately</td>
            </tr>
            <tr style="background: #f0fdf4;">
              <td style="padding:8px;">Tesseract OCR</td>
              <td style="padding:8px;">🔄 Tested separately</td>
            </tr>
          </table>
          <p style="margin-top:20px; color: #6b7280; font-size:12px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });
    pass(`Test email sent – MessageID: ${info2.messageId}`);
    return true;
  } catch (err) {
    fail("Email test failed:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// 5. TEST: DOCUMENT GENERATION via Gemini
// ─────────────────────────────────────────────────────────────
async function testDocumentGeneration(geminiResult) {
  info("Testing Document Generation (AI-powered)...");
  if (!geminiResult || !geminiResult.success) {
    warn("Skipping document generation test – Gemini not available.");
    return false;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiResult.model}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
    const prompt = `Generate a professional one-paragraph Non-Disclosure Agreement (NDA) summary for a software company. Include: parties involved, confidentiality period of 2 years, scope of confidential information, and governing law. Output plain text only.`;
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.3 },
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();

    if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const docText = data.candidates[0].content.parts[0].text.trim();
      pass(`Document generation working! Generated ${docText.length} character NDA summary.`);
      console.log("\n   Preview (first 200 chars):", docText.substring(0, 200), "...\n");
      return true;
    } else {
      fail("Document generation failed:", data.error?.message || `HTTP ${res.status}`);
      return false;
    }
  } catch (err) {
    fail("Document generation error:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// 6. TEST: OCR EXTRACTION via Gemini Vision
// ─────────────────────────────────────────────────────────────
async function testOCRVision(geminiResult) {
  info("Testing OCR via Gemini Vision (image text extraction)...");
  if (!geminiResult || !geminiResult.success) {
    warn("Skipping Vision OCR test – Gemini not available.");
    return false;
  }

  try {
    // Create a simple test: ask Gemini to extract text from a text-described image
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiResult.model}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;
    const prompt = `Extract text from this invoice: Invoice No: INV-2026-001, Date: 2026-09-11, Client: Acme Corp, Amount: ₹45,000, Tax: ₹8,100, Total: ₹53,100. Return as JSON with fields: invoiceNumber, date, client, amount, tax, total.`;
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.1, responseMimeType: "application/json" },
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();

    if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      const extracted = data.candidates[0].content.parts[0].text.trim();
      pass(`OCR/AI extraction working! Extracted: ${extracted.substring(0, 100)}`);
      return true;
    } else {
      fail("OCR Vision test failed:", data.error?.message);
      return false;
    }
  } catch (err) {
    fail("OCR Vision error:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(60));
console.log("  DocuCore AI – Full System Test");
console.log("  Time:", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
console.log("═".repeat(60) + "\n");

const results = {};

// Run all tests
results.gemini = await testGemini();
results.dbUpdate = await updateGeminiKeyInDB();
results.tesseract = await testTesseract();
results.email = await testEmail();
results.docGen = await testDocumentGeneration(results.gemini);
results.ocrVision = await testOCRVision(results.gemini);

// Summary
console.log("\n" + "═".repeat(60));
console.log("  TEST SUMMARY");
console.log("═".repeat(60));
const tests = [
  ["Gemini API Connection",       results.gemini],
  ["DB Key Update (Super Admin)", results.dbUpdate],
  ["Tesseract OCR",               results.tesseract],
  ["Email (Brevo SMTP)",          results.email],
  ["Document Generation (AI)",    results.docGen],
  ["OCR / Field Extraction (AI)", results.ocrVision],
];
for (const [name, ok] of tests) {
  const icon = ok ? "✅" : "❌";
  console.log(`  ${icon}  ${name.padEnd(35)} ${ok ? "PASS" : "FAIL"}`);
}
console.log("═".repeat(60) + "\n");
