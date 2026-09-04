const crypto = require("crypto");
const path = require("path");

const ALGORITHM = "aes-256-gcm";
const rawKey =
  process.env.ENCRYPTION_KEY ||
  process.env.ENCRYPTION_SECRET ||
  "c396aeb3c12afcade81f5ba7e5fda520476f78f5b236356f2c362ee9b179bafc";

const MASTER_KEY = crypto.createHash("sha256").update(String(rawKey)).digest();

class StorageSecurityService {
  /**
   * Encrypt plaintext string using AES-256-GCM
   */
  static encrypt(plaintext) {
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
   * Decrypt AES-256-GCM ciphertext
   */
  static decrypt(ciphertext) {
    if (!ciphertext || typeof ciphertext !== "string") return null;
    try {
      const parts = ciphertext.split(":");
      if (parts.length !== 3) return null;
      const [ivB64, authTagB64, cipherB64] = parts;
      const iv = Buffer.from(ivB64, "base64");
      const authTag = Buffer.from(authTagB64, "base64");
      const encrypted = Buffer.from(cipherB64, "base64");
      const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, iv);
      decipher.setAuthTag(authTag);
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    } catch (err) {
      console.error("[StorageSecurityService] Decryption error:", err.message);
      return null;
    }
  }

  /**
   * Mask sensitive string for safe UI presentation
   */
  static maskSecret(value, visibleChars = 4) {
    if (!value || typeof value !== "string") return "";
    if (value.length <= visibleChars) return "••••••••";
    return `••••••••••••${value.slice(-visibleChars)}`;
  }

  /**
   * Sanitize file names to remove malicious characters / path traversal
   */
  static sanitizeFilename(fileName) {
    if (!fileName) return `file_${Date.now()}.bin`;
    const base = path.basename(fileName);
    return base.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  /**
   * Generate tenant-isolated S3 object key
   * e.g. {organisationId}/documents/{documentId}/original/{fileName}
   */
  static buildObjectKey({ organisationId, documentId, category = "original", fileName, basePrefix = "" }) {
    const safeOrgId = String(organisationId || "1");
    const safeDocId = String(documentId || `doc_${Date.now()}`);
    const safeCategory = String(category).replace(/[^a-zA-Z0-9_-]/g, "");
    const safeName = this.sanitizeFilename(fileName);

    const prefix = basePrefix ? `${basePrefix.replace(/^\/+|\/+$/g, "")}/` : "";
    return `${prefix}${safeOrgId}/documents/${safeDocId}/${safeCategory}/${safeName}`;
  }

  /**
   * Generate tenant export S3 key: {organisationId}/exports/{exportId}/{fileName}
   */
  static buildExportKey({ organisationId, exportId, fileName, basePrefix = "" }) {
    const safeOrgId = String(organisationId || "1");
    const safeExportId = String(exportId || `exp_${Date.now()}`);
    const safeName = this.sanitizeFilename(fileName);

    const prefix = basePrefix ? `${basePrefix.replace(/^\/+|\/+$/g, "")}/` : "";
    return `${prefix}${safeOrgId}/exports/${safeExportId}/${safeName}`;
  }

  /**
   * Verify that an S3 key strictly belongs to the specified organisation
   */
  static isKeyOwnedByOrg(objectKey, organisationId, basePrefix = "") {
    if (!objectKey || !organisationId) return false;
    const prefix = basePrefix ? `${basePrefix.replace(/^\/+|\/+$/g, "")}/` : "";
    const expectedPrefix = `${prefix}${String(organisationId)}/`;
    return objectKey.startsWith(expectedPrefix);
  }
}

module.exports = StorageSecurityService;
