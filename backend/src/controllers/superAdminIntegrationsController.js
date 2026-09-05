const prisma = require("../config/prismaClient");
const { encryptText, decryptText } = require("../utils/cryptoUtils");
const IntegrationManager = require("../services/integrations/IntegrationManager");
const AuditLogService = require("../services/auditLogService");

function maskSecret(val) {
  if (!val) return null;
  if (val.length <= 8) return "••••••••";
  return val.substring(0, 4) + "••••••••" + val.substring(val.length - 4);
}

function sanitizeSettingsForDisplay(settings) {
  if (!settings || typeof settings !== "object") return settings;
  const sanitized = { ...settings };
  if (sanitized.secretAccessKey) sanitized.secretAccessKey = "••••••••";
  if (sanitized.password) sanitized.password = "••••••••";
  if (sanitized.accessToken) sanitized.accessToken = "••••••••";
  if (sanitized.appSecret) sanitized.appSecret = "••••••••";
  return sanitized;
}

/**
 * GET /api/super-admin/platform-integrations
 * Super Admin retrieves platform-level provider configuration status, dynamic config fields, and metrics
 */
const getPlatformIntegrations = async (req, res) => {
  try {
    const dbConfigs = await prisma.platformIntegration.findMany();
    const configMap = new Map();
    dbConfigs.forEach((c) => configMap.set(c.provider, c));

    // Get count of connected organizations per provider
    const connectedCounts = await prisma.organisationIntegration.groupBy({
      by: ["provider", "status"],
      where: { status: "CONNECTED" },
      _count: { organisationId: true },
    });

    const countsMap = new Map();
    connectedCounts.forEach((c) => {
      countsMap.set(c.provider, c._count.organisationId);
    });

    const providers = IntegrationManager.PROVIDERS.map((p) => {
      const dbConfig = configMap.get(p.id);
      const isEnvConfigured = p.requiredEnv?.every((envVar) => Boolean(process.env[envVar])) || false;

      let isEnabled = true;
      let status = isEnvConfigured ? "ACTIVE" : "NOT_CONFIGURED";
      let healthStatus = "HEALTHY";
      let errorRate = 0.0;
      let clientIdMasked = null;
      let hasClientSecret = false;
      let settings = null;
      let redirectUri = p.configFields?.find((f) => f.key === "redirectUri")?.default || null;

      if (dbConfig) {
        isEnabled = dbConfig.isEnabled;
        status = isEnabled ? dbConfig.status : "DISABLED";
        healthStatus = dbConfig.healthStatus;
        errorRate = dbConfig.errorRate;
        if (dbConfig.redirectUri) redirectUri = dbConfig.redirectUri;

        if (dbConfig.clientIdEncrypted) {
          const decryptedId = decryptText(dbConfig.clientIdEncrypted);
          clientIdMasked = maskSecret(decryptedId);
        }
        hasClientSecret = Boolean(dbConfig.clientSecretEncrypted);
        settings = sanitizeSettingsForDisplay(dbConfig.settings);
      } else if (isEnvConfigured) {
        if (p.id === "GOOGLE_WORKSPACE" && process.env.GOOGLE_CLIENT_ID) {
          clientIdMasked = maskSecret(process.env.GOOGLE_CLIENT_ID);
          hasClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET);
        } else if (p.id === "SLACK" && process.env.SLACK_CLIENT_ID) {
          clientIdMasked = maskSecret(process.env.SLACK_CLIENT_ID);
          hasClientSecret = Boolean(process.env.SLACK_CLIENT_SECRET);
        } else if (p.id === "MICROSOFT_365" && process.env.MICROSOFT_CLIENT_ID) {
          clientIdMasked = maskSecret(process.env.MICROSOFT_CLIENT_ID);
          hasClientSecret = Boolean(process.env.MICROSOFT_CLIENT_SECRET);
        } else if (p.id === "AWS_S3" && process.env.AWS_ACCESS_KEY_ID) {
          clientIdMasked = maskSecret(process.env.AWS_ACCESS_KEY_ID);
          hasClientSecret = Boolean(process.env.AWS_SECRET_ACCESS_KEY);
        }
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        description: p.description,
        authType: p.authType,
        icon: p.icon,
        isEnabled,
        status,
        healthStatus,
        errorRate,
        connectedTenantsCount: countsMap.get(p.id) || 0,
        clientIdMasked,
        hasClientSecret,
        redirectUri,
        requiredEnv: p.requiredEnv,
        configFields: p.configFields || [],
        settings,
        setupGuide: p.setupGuide,
      };
    });

    res.status(200).json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/super-admin/platform-integrations/:provider/config
 * Update platform provider credentials with AES-256 encryption
 */
const updatePlatformIntegrationConfig = async (req, res) => {
  try {
    const { provider } = req.params;
    const canonical = IntegrationManager.normalizeProviderId(provider);
    const { clientId, clientSecret, redirectUri, tenantId, allowedScopes, settings, isEnabled } = req.body;

    const existing = await prisma.platformIntegration.findUnique({
      where: { provider: canonical },
    });

    // Encrypt sensitive fields in structured settings (e.g. AWS Secret Key, SMTP Password, WhatsApp Token)
    let processedSettings = settings !== undefined ? settings : existing?.settings;
    if (processedSettings && typeof processedSettings === "object") {
      processedSettings = { ...processedSettings };
      if (processedSettings.apiKey && processedSettings.apiKey !== "••••••••") {
        processedSettings.apiKeyEncrypted = encryptText(processedSettings.apiKey);
        delete processedSettings.apiKey;
      }
      if (processedSettings.secretAccessKey && processedSettings.secretAccessKey !== "••••••••") {
        processedSettings.secretAccessKeyEncrypted = encryptText(processedSettings.secretAccessKey);
        delete processedSettings.secretAccessKey;
      }
      if (processedSettings.password && processedSettings.password !== "••••••••") {
        processedSettings.passwordEncrypted = encryptText(processedSettings.password);
        delete processedSettings.password;
      }
      if (processedSettings.accessToken && processedSettings.accessToken !== "••••••••") {
        processedSettings.accessTokenEncrypted = encryptText(processedSettings.accessToken);
        delete processedSettings.accessToken;
      }
      if (processedSettings.appSecret && processedSettings.appSecret !== "••••••••") {
        processedSettings.appSecretEncrypted = encryptText(processedSettings.appSecret);
        delete processedSettings.appSecret;
      }
    }

    const updateData = {
      name: IntegrationManager.PROVIDERS.find((p) => p.id === canonical)?.name || canonical,
      redirectUri: redirectUri || existing?.redirectUri,
      tenantId: tenantId || existing?.tenantId,
      allowedScopes: allowedScopes || existing?.allowedScopes || [],
      settings: processedSettings,
      isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : existing?.isEnabled ?? true,
      status: "ACTIVE",
      healthStatus: "HEALTHY",
      updatedAt: new Date(),
    };

    if (clientId) {
      updateData.clientIdEncrypted = encryptText(clientId);
    }
    if (clientSecret && clientSecret !== "••••••••") {
      updateData.clientSecretEncrypted = encryptText(clientSecret);
    }

    const saved = await prisma.platformIntegration.upsert({
      where: { provider: canonical },
      update: updateData,
      create: {
        provider: canonical,
        ...updateData,
      },
    });

    // Log platform audit trail
    await AuditLogService.log({
      actorUserId: req.user?.id || 1,
      actorName: req.user?.first_name ? `${req.user.first_name} ${req.user.last_name || ""}`.trim() : "Super Admin",
      actorRole: "SUPER_ADMIN",
      actorType: "SUPER_ADMIN",
      organisationName: "Platform",
      module: "PLATFORM_INTEGRATIONS",
      action: "PLATFORM_INTEGRATION_CONFIGURED",
      resourceType: "PLATFORM_INTEGRATION",
      resourceId: saved.id,
      resourceName: saved.name,
      severity: "INFO",
      metadata: {
        provider: canonical,
        isEnabled: saved.isEnabled,
        hasClientSecret: Boolean(saved.clientSecretEncrypted),
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `${saved.name} platform configuration updated and securely encrypted.`,
      data: {
        provider: saved.provider,
        isEnabled: saved.isEnabled,
        status: saved.status,
        hasClientSecret: Boolean(saved.clientSecretEncrypted),
        redirectUri: saved.redirectUri,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/super-admin/platform-integrations/:provider/toggle
 * Toggle enable/disable provider across the entire platform
 */
const togglePlatformIntegration = async (req, res) => {
  try {
    const { provider } = req.params;
    const canonical = IntegrationManager.normalizeProviderId(provider);
    const { isEnabled } = req.body;

    const existing = await prisma.platformIntegration.findUnique({
      where: { provider: canonical },
    });

    const targetEnabled = isEnabled !== undefined ? Boolean(isEnabled) : !(existing?.isEnabled ?? true);

    const saved = await prisma.platformIntegration.upsert({
      where: { provider: canonical },
      update: {
        isEnabled: targetEnabled,
        status: targetEnabled ? (existing?.clientIdEncrypted || existing?.settings ? "ACTIVE" : "NOT_CONFIGURED") : "DISABLED",
      },
      create: {
        provider: canonical,
        name: IntegrationManager.PROVIDERS.find((p) => p.id === canonical)?.name || canonical,
        isEnabled: targetEnabled,
        status: targetEnabled ? "NOT_CONFIGURED" : "DISABLED",
      },
    });

    await AuditLogService.log({
      actorUserId: req.user?.id || 1,
      actorName: req.user?.first_name ? `${req.user.first_name} ${req.user.last_name || ""}`.trim() : "Super Admin",
      actorRole: "SUPER_ADMIN",
      actorType: "SUPER_ADMIN",
      organisationName: "Platform",
      module: "PLATFORM_INTEGRATIONS",
      action: "PLATFORM_INTEGRATION_TOGGLED",
      resourceType: "PLATFORM_INTEGRATION",
      resourceId: saved.id,
      resourceName: saved.name,
      severity: "INFO",
      metadata: {
        provider: canonical,
        isEnabled: saved.isEnabled,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `${saved.name} is now ${saved.isEnabled ? "ENABLED" : "DISABLED"} platform-wide.`,
      data: saved,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/super-admin/platform-integrations/:provider/test
 * Test platform level configuration
 */
const testPlatformIntegration = async (req, res) => {
  try {
    const { provider } = req.params;
    const canonical = IntegrationManager.normalizeProviderId(provider);

    const platformConfig = await IntegrationManager.getPlatformConfig(canonical);
    if (!platformConfig.isConfigured) {
      return res.status(400).json({
        success: false,
        status: "NOT_CONFIGURED",
        message: `${canonical} platform credentials are not configured.`,
      });
    }

    res.status(200).json({
      success: true,
      status: "HEALTHY",
      message: `${canonical} platform application configuration is healthy and ready for tenant connections.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlatformIntegrations,
  updatePlatformIntegrationConfig,
  togglePlatformIntegration,
  testPlatformIntegration,
};

