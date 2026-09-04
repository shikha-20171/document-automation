const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "docucore_secret_key_32_bytes_long_aes_256!!"; // Must be 32 chars/bytes
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Encrypt a text string (e.g. OAuth access tokens, refresh tokens, credentials)
 */
function encryptText(text) {
  if (!text) return null;
  const key = crypto.createHash("sha256").update(String(ENCRYPTION_KEY)).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an encrypted string
 */
function decryptText(encryptedText) {
  if (!encryptedText) return null;
  try {
    const key = crypto.createHash("sha256").update(String(ENCRYPTION_KEY)).digest();
    const parts = encryptedText.split(":");
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return null;
  }
}

/**
 * Generate SHA-256 hash for API keys and webhooks secret validation
 */
function hashString(text) {
  if (!text) return null;
  return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Generate HMAC-SHA256 signature for outgoing webhook deliveries
 */
function generateHmacSignature(payload, secret) {
  if (!payload || !secret) return "";
  const content = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHmac("sha256", String(secret)).update(content).digest("hex");
}

module.exports = {
  encryptText,
  decryptText,
  hashString,
  generateHmacSignature,
};


