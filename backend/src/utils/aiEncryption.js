const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

// Deterministic 32-byte key derived from .env
const rawKey =
  process.env.ENCRYPTION_KEY ||
  process.env.ENCRYPTION_SECRET ||
  "c396aeb3c12afcade81f5ba7e5fda520476f78f5b236356f2c362ee9b179bafc";

const MASTER_KEY = crypto.createHash("sha256").update(String(rawKey)).digest();

/**
 * Encrypt plain text API key using AES-256-GCM
 * @param {string} plaintext
 * @returns {string} iv:authTag:ciphertext (base64 encoded)
 */
function encryptApiKey(plaintext) {
  if (!plaintext || typeof plaintext !== "string" || !plaintext.trim()) {
    return null;
  }
  const clean = plaintext.trim();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(clean, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

/**
 * Decrypt encrypted API key in-memory
 * @param {string} stored
 * @returns {string|null} Plaintext key 
 */
function decryptApiKey(stored) {
  if (!stored || typeof stored !== "string") return null;
  try {
    const parts = stored.split(":");
    if (parts.length !== 3) return null;
    const [ivB64, authTagB64, cipherB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const ciphertext = Buffer.from(cipherB64, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch (err) {
    console.error("[aiEncryption] Decryption error:", err.message);
    return null;
  }
}

/**
 * Mask API key for safe UI display (e.g. sk-proj-••••••••••••4f8A)
 * @param {string} stored
 * @returns {string}
 */
function maskApiKey(stored) {
  if (!stored) return "Not configured";
  const plain = decryptApiKey(stored);
  if (!plain) return "Not configured";
  if (plain.length <= 8) return "••••••••";
  return plain.substring(0, 4) + "••••••••••••" + plain.slice(-4);
}

module.exports = {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
};
