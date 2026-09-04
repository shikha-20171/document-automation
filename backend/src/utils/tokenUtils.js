const crypto = require("crypto");

/**
 * Generate cryptographically secure invitation token
 * Returns rawToken (to send in email link) and tokenHash (to store in DB)
 */
const generateInvitationToken = (expirationHours = 24) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
};

/**
 * Hash raw token for verification lookup
 */
const hashToken = (rawToken) => {
  if (!rawToken || typeof rawToken !== "string") return "";
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
};

module.exports = {
  generateInvitationToken,
  hashToken,
};
