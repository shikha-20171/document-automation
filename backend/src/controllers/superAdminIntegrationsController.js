const prisma = require("../config/prismaClient");
const IntegrationProviderService = require("../services/integrationProviderService");
const AuditLogService = require("../services/auditLogService");

function normalizeProvider(providerStr) {
  if (!providerStr) return "";
  return providerStr.toLowerCase().replace(/[\s-]+/g, "_");
}

/**
 * GET /api/super-admin/platform-integrations
 * Super Admin retrieves platform-level provider configuration status, dynamic config fields, and metrics
 */
const getPlatformIntegrations = async (req, res) => {
  try {
    const environment = req.query.environment || "production";
    const providers = await IntegrationProviderService.listProviders({
      isSuperAdmin: true,
      environment,
    });

    res.status(200).json({
      success: true,
      data: providers,
      count: providers.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/super-admin/platform-integrations/:provider
 * Get detailed platform integration settings for a single provider
 */
const getPlatformIntegrationById = async (req, res) => {
  try {
    const { provider } = req.params;
    const environment = req.query.environment || "production";
    const providerKey = normalizeProvider(provider);

    const data = await IntegrationProviderService.getProvider(providerKey, {
      isSuperAdmin: true,
      environment,
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/super-admin/platform-integrations/:provider/config
 * or POST /api/super-admin/platform-integrations/:provider/credentials
 * Update platform provider credentials with AES-256-GCM encryption in PostgreSQL
 */
const updatePlatformIntegrationConfig = async (req, res) => {
  try {
    const { provider } = req.params;
    const providerKey = normalizeProvider(provider);
    const userId = req.user?.id || 1;
    const environment = req.body.environment || "production";

    // Format credentials object from either nested credentials or top-level body fields
    let credentials = req.body.credentials;
    if (!credentials || typeof credentials !== "object") {
      const {
        clientId,
        clientSecret,
        apiKey,
        accessToken,
        phoneNumberId,
        wabaId,
        appSecret,
        tenantId,
        redirectUri,
        signingSecret,
        senderEmail,
        senderName,
      } = req.body;

      credentials = {
        ...(clientId !== undefined ? { clientId } : {}),
        ...(clientSecret !== undefined ? { clientSecret } : {}),
        ...(apiKey !== undefined ? { apiKey } : {}),
        ...(accessToken !== undefined ? { accessToken } : {}),
        ...(phoneNumberId !== undefined ? { phoneNumberId } : {}),
        ...(wabaId !== undefined ? { wabaId } : {}),
        ...(appSecret !== undefined ? { appSecret } : {}),
        ...(tenantId !== undefined ? { tenantId } : {}),
        ...(redirectUri !== undefined ? { redirectUri } : {}),
        ...(signingSecret !== undefined ? { signingSecret } : {}),
        ...(senderEmail !== undefined ? { senderEmail } : {}),
        ...(senderName !== undefined ? { senderName } : {}),
        ...(req.body.settings && typeof req.body.settings === "object" ? req.body.settings : {}),
      };
    }

    const saved = await IntegrationProviderService.saveCredentials(providerKey, {
      credentials,
      configuration: req.body.configuration || null,
      environment,
      userId,
    });

    // Optional status update if isEnabled provided
    if (req.body.isEnabled !== undefined) {
      await IntegrationProviderService.toggleProvider(providerKey, {
        isEnabled: Boolean(req.body.isEnabled),
      });
    }

    // Log platform audit trail (Zero sensitive data logged)
    await AuditLogService.log({
      actorUserId: userId,
      actorName: req.user?.first_name ? `${req.user.first_name} ${req.user.last_name || ""}`.trim() : "Super Admin",
      actorRole: "SUPER_ADMIN",
      actorType: "SUPER_ADMIN",
      organisationName: "Platform",
      module: "PLATFORM_INTEGRATIONS",
      action: "PLATFORM_CREDENTIALS_CONFIGURED",
      resourceType: "INTEGRATION_PROVIDER",
      resourceId: saved.providerId,
      resourceName: saved.providerKey,
      severity: "INFO",
      metadata: {
        providerKey: saved.providerKey,
        environment: saved.environment,
        encryption: "AES-256-GCM (v1)",
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Platform credentials for '${saved.providerKey}' saved and encrypted with AES-256-GCM.`,
      data: saved,
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
    const providerKey = normalizeProvider(provider);
    const { isEnabled, isActive } = req.body;

    const updated = await IntegrationProviderService.toggleProvider(providerKey, {
      isEnabled,
      isActive,
    });

    await AuditLogService.log({
      actorUserId: req.user?.id || 1,
      actorName: req.user?.first_name ? `${req.user.first_name} ${req.user.last_name || ""}`.trim() : "Super Admin",
      actorRole: "SUPER_ADMIN",
      actorType: "SUPER_ADMIN",
      organisationName: "Platform",
      module: "PLATFORM_INTEGRATIONS",
      action: "PLATFORM_INTEGRATION_TOGGLED",
      resourceType: "INTEGRATION_PROVIDER",
      resourceId: updated.id,
      resourceName: updated.providerName,
      severity: "INFO",
      metadata: {
        providerKey: updated.providerKey,
        isEnabled: updated.isEnabled,
        isActive: updated.isActive,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: `${updated.providerName} is now ${updated.isEnabled ? "enabled" : "disabled"}.`,
      data: {
        id: updated.id,
        providerKey: updated.providerKey,
        isEnabled: updated.isEnabled,
        isActive: updated.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/super-admin/platform-integrations/:provider/test
 * Decrypts and tests platform credentials
 */
const testPlatformIntegration = async (req, res) => {
  try {
    const { provider } = req.params;
    const providerKey = normalizeProvider(provider);
    const environment = req.body.environment || "production";

    const result = await IntegrationProviderService.testCredentials(providerKey, environment);

    res.status(200).json({
      success: result.status === "SUCCESS",
      message: result.message,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/super-admin/platform-integrations/providers
 * Dynamically create a new Integration Provider directly into PostgreSQL
 * without requiring schema changes or server deployments!
 */
const createProvider = async (req, res) => {
  try {
    const {
      providerKey,
      providerName,
      category,
      authenticationType,
      logoUrl,
      documentationUrl,
      description,
      configurationSchema,
      requiredScopes,
      supportedFeatures,
    } = req.body;

    if (!providerKey || !providerName || !category || !authenticationType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: providerKey, providerName, category, authenticationType.",
      });
    }

    const canonicalKey = normalizeProvider(providerKey);

    const record = await prisma.integrationProvider.create({
      data: {
        providerKey: canonicalKey,
        providerName,
        category: category.toUpperCase(),
        authenticationType: authenticationType.toLowerCase(),
        logoUrl: logoUrl || null,
        documentationUrl: documentationUrl || null,
        description: description || null,
        configurationSchema: configurationSchema || {},
        requiredScopes: requiredScopes || [],
        supportedFeatures: supportedFeatures || [],
        isEnabled: true,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      message: `Dynamic integration provider '${record.providerName}' created successfully.`,
      data: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlatformIntegrations,
  getPlatformIntegrationById,
  updatePlatformIntegrationConfig,
  togglePlatformIntegration,
  testPlatformIntegration,
  createProvider,
};
