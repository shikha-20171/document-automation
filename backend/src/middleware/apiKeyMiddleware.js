const crypto = require("crypto");
const prisma = require("../config/prismaClient");

/**
 * API Key Authentication Middleware
 * Authenticates incoming HTTP requests via 'X-API-Key' or 'x-api-key' header.
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"] || req.headers["x-api-token"];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API Key required in 'X-API-Key' header.",
      });
    }

    const keyHash = crypto.createHash("sha256").update(String(apiKey).trim()).digest("hex");

    const keyRecord = await prisma.organisationApiKey.findFirst({
      where: {
        keyHash,
        status: "ACTIVE",
      },
      include: { organisation: true },
    }).catch(() => null);

    if (!keyRecord) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive API Key.",
      });
    }

    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return res.status(401).json({
        success: false,
        message: "API Key has expired.",
      });
    }

    // Attach simulated user & organisation context
    req.user = {
      id: keyRecord.createdById || 1,
      userId: keyRecord.createdById || 1,
      email: `api-service@${keyRecord.organisation?.name?.toLowerCase().replace(/\s+/g, "") || "org"}.com`,
      role: "ORGANISATION_ADMIN",
      organisation_id: keyRecord.organisationId,
      organisationId: keyRecord.organisationId,
      apiKeyId: keyRecord.id,
      isApiKeyAuth: true,
      permissions: keyRecord.permissions || ["*"],
    };

    // Update last used timestamp asynchronously
    prisma.organisationApiKey.update({
      where: { id: keyRecord.id },
      data: {
        lastUsedAt: new Date(),
      },
    }).catch(() => null);

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `API Key authentication error: ${err.message}`,
    });
  }
};

module.exports = authenticateApiKey;
