const crypto = require("crypto");

/**
 * Enterprise Integration Encryption Service
 * Implements AES-256-GCM (Galois/Counter Mode) authenticated encryption.
 * Format: v1:gcm:<ivHex>:<authTagHex>:<cipherHex>
 * 
 * Provides cryptographic confidentiality, integrity, and authenticity for
 * platform credentials, OAuth tokens, and tenant integration secrets.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended by NIST SP 800-38D for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

function getMasterKey() {
  const secret =
    process.env.INTEGRATION_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "docucore-enterprise-platform-integration-master-key-change-in-prod";
  return crypto.createHash("sha256").update(String(secret)).digest();
}

/**
 * Encrypts a UTF-8 string with AES-256-GCM
 * @param {string} text - Plaintext to encrypt
 * @returns {string} Versioned ciphertext string: "v1:gcm:<iv>:<tag>:<cipher>"
 */
function encrypt(text) {
  if (text === null || text === undefined || text === "") {
    return null;
  }
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  
  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `v1:gcm:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string and verifies authentication tag
 * @param {string} cipherString - Encrypted string in format "v1:gcm:<iv>:<tag>:<cipher>"
 * @returns {string} Decrypted plaintext UTF-8 string
 */
function decrypt(cipherString) {
  if (!cipherString || typeof cipherString !== "string") {
    return null;
  }

  // Handle AES-256-GCM format
  if (cipherString.startsWith("v1:gcm:")) {
    const parts = cipherString.split(":");
    if (parts.length !== 5) {
      throw new Error("Invalid AES-256-GCM ciphertext format.");
    }
    const [, , ivHex, authTagHex, cipherHex] = parts;
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // Backwards compatibility fallback for legacy AES-256-CBC format (iv:encrypted)
  if (cipherString.includes(":") && !cipherString.startsWith("v1:")) {
    try {
      const [ivHex, encHex] = cipherString.split(":");
      const key = getMasterKey();
      const iv = Buffer.from(ivHex, "hex");
      const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
      let decrypted = decipher.update(encHex, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch {
      // Fallback failed, return null or throw
      return null;
    }
  }

  return cipherString;
}

/**
 * Encrypts a JavaScript object as JSON string
 * @param {object} obj - Object to encrypt
 * @returns {string} Encrypted string
 */
function encryptJson(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }
  return encrypt(JSON.stringify(obj));
}

/**
 * Decrypts a JSON encrypted string and parses it
 * @param {string} cipherString - Encrypted string
 * @returns {object|null} Decrypted and parsed JavaScript object
 */
function decryptJson(cipherString) {
  if (!cipherString) {
    return null;
  }
  const decrypted = decrypt(cipherString);
  if (!decrypted) return null;
  try {
    return JSON.parse(decrypted);
  } catch (err) {
    throw new Error(`Failed to parse decrypted JSON: ${err.message}`);
  }
}

/**
 * Mask sensitive credentials for UI display and safe logging
 * @param {string} value - Secret value
 * @param {number} visibleStart - Count of leading characters to show
 * @param {number} visibleEnd - Count of trailing characters to show
 * @returns {string|null} Masked string (e.g. "ghp_••••••••89ab")
 */
function maskSecret(value, visibleStart = 4, visibleEnd = 4) {
  if (!value || typeof value !== "string") return null;
  if (value.length <= 8) return "••••••••";
  const start = value.substring(0, visibleStart);
  const end = value.substring(value.length - visibleEnd);
  return `${start}••••••••${end}`;
}

const SENSITIVE_KEYS = new Set([
  "clientsecret",
  "client_secret",
  "apikey",
  "api_key",
  "secretkey",
  "secret_key",
  "privatekey",
  "private_key",
  "password",
  "token",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "signingsecret",
  "signing_secret",
  "webhooksecret",
  "webhook_secret",
  "authtoken",
  "auth_token",
  "bottoken",
  "bot_token",
]);

/**
 * Strips or masks all sensitive fields in configuration objects
 * @param {object} config - Configuration object
 * @param {boolean} mask - If true, replaces secrets with masked string; if false, strips them
 * @returns {object} Sanitized configuration object safe for non-superadmin inspection
 */
function sanitizeConfig(config, mask = true) {
  if (!config || typeof config !== "object") return config;
  if (Array.isArray(config)) return config.map((item) => sanitizeConfig(item, mask));

  const sanitized = {};
  for (const [key, value] of Object.entries(config)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = mask ? maskSecret(String(value)) : undefined;
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeConfig(value, mask);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Generates a cryptographically secure random state token for OAuth flows
 * @returns {string} 64-char hex string
 */
function generateStateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generates a SHA-256 hash of a string (e.g. for OAuth state hashing)
 * @param {string} value
 * @returns {string} Hex SHA-256 hash
 */
function hashString(value) {
  if (!value) return null;
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

module.exports = {
  encrypt,
  decrypt,
  encryptJson,
  decryptJson,
  maskSecret,
  sanitizeConfig,
  generateStateToken,
  hashString,
};
