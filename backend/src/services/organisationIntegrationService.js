const prisma = require("../config/prismaClient");
const { encrypt, decrypt } = require("./integrationEncryptionService");
const IntegrationProviderService = require("./integrationProviderService");

class OrganisationIntegrationService {
  /**
   * Retrieves tenant integrations catalog with status and connection details
   * Strict tenant isolation: organisationId is strictly enforced.
   * NEVER returns raw secrets or tokens.
   */
  static async listIntegrations(organisationId) {
    if (!organisationId) {
      throw new Error("Organisation ID is required.");
    }
    const orgId = Number(organisationId);

    // 1. Resolve Subscription Entitlements for this Organisation
    const EntitlementService = require("./entitlementService");
    let planFeatures = {};
    try {
      const entitlements = await EntitlementService.getOrganisationEntitlements(orgId);
      planFeatures = entitlements?.features || {};
    } catch (e) {
      console.warn("Notice: could not load entitlements for organisation", orgId, e.message);
    }

    const PROVIDER_FEATURE_MAP = {
      google_workspace: "integrations.google",
      microsoft_365: "integrations.microsoft",
      microsoft_teams: "integrations.teams",
      slack: "integrations.slack",
      whatsapp_business: "integrations.whatsapp",
      brevo: "integrations.smtp",
    };

    // 2. Fetch all enabled providers from dynamic catalog
    const allProviders = await prisma.integrationProvider.findMany({
      where: { isEnabled: true, isActive: true },
      orderBy: { providerName: "asc" },
      include: {
        credentials: {
          where: { environment: "production" },
          select: { status: true, id: true },
          take: 1,
        },
      },
    });

    // 3. Filter providers strictly by organisation's subscription plan entitlements
    const providers = allProviders.filter((p) => {
      const featureFlag = PROVIDER_FEATURE_MAP[p.providerKey];
      if (!featureFlag) return true;
      // If plan explicitly marks feature as false, hide it from Organisation Admin!
      return planFeatures[featureFlag] !== false;
    });

    // 4. Fetch organisation's connected integrations
    const orgIntegrations = await prisma.organisationIntegration.findMany({
      where: { organisationId: orgId },
      include: {
        connectedBy: {
          select: { id: true, full_name: true, email: true },
        },
      },
    });

    const orgMap = new Map();
    orgIntegrations.forEach((rec) => {
      if (rec.providerId) orgMap.set(rec.providerId, rec);
      if (rec.providerKey) orgMap.set(rec.providerKey, rec);
    });

    return providers.map((provider) => {
      const orgRecord = orgMap.get(provider.id) || orgMap.get(provider.providerKey);
      const isPlatformConfigured = provider.credentials.length > 0 && provider.credentials[0].status === "ACTIVE";

      let status = "DISCONNECTED";
      if (!isPlatformConfigured && provider.authenticationType === "oauth2") {
        status = "CONFIG_REQUIRED";
      } else if (orgRecord) {
        status = orgRecord.connectionStatus || orgRecord.status || "DISCONNECTED";
      }

      return {
        id: orgRecord ? orgRecord.id : undefined,
        providerId: provider.id,
        providerKey: provider.providerKey,
        providerName: provider.providerName,
        category: provider.category,
        authenticationType: provider.authenticationType,
        description: provider.description,
        logoUrl: provider.logoUrl,
        documentationUrl: provider.documentationUrl,
        supportedFeatures: provider.supportedFeatures,
        status,
        isConnected: status === "CONNECTED",
        isPlatformConfigured,
        accountName: orgRecord?.accountName || null,
        accountEmail: orgRecord?.accountEmail || null,
        accountIdentifier: orgRecord?.accountIdentifier || null,
        externalAccountId: orgRecord?.externalAccountId || null,
        connectedAt: orgRecord?.connectedAt || null,
        lastUsedAt: orgRecord?.lastUsedAt || null,
        lastError: orgRecord?.lastError || null,
        connectedBy: orgRecord?.connectedBy || null,
        hasAccessToken: Boolean(orgRecord?.accessTokenEncrypted),
        tokenExpiresAt: orgRecord?.tokenExpiresAt || orgRecord?.expiresAt || null,
      };
    });
  }

  /**
   * Connect an API-key or direct token-based integration for an organization
   */
  static async connectApiKeyIntegration({ organisationId, providerKeyOrId, config, userId }) {
    if (!organisationId) {
      throw new Error("Organisation ID is required.");
    }
    const orgId = Number(organisationId);

    const provider = await prisma.integrationProvider.findFirst({
      where: {
        OR: [{ id: providerKeyOrId }, { providerKey: providerKeyOrId }],
        isEnabled: true,
      },
    });

    if (!provider) {
      throw new Error(`Provider '${providerKeyOrId}' not found or disabled.`);
    }

    // Strict Subscription Entitlement Check
    const EntitlementService = require("./entitlementService");
    const PROVIDER_FEATURE_MAP = {
      google_workspace: "integrations.google",
      microsoft_365: "integrations.microsoft",
      microsoft_teams: "integrations.teams",
      slack: "integrations.slack",
      whatsapp_business: "integrations.whatsapp",
      brevo: "integrations.smtp",
    };
    const featureFlag = PROVIDER_FEATURE_MAP[provider.providerKey];
    if (featureFlag) {
      const allowed = await EntitlementService.checkFeatureAccess(orgId, featureFlag);
      if (!allowed) {
        throw new Error(`The '${provider.providerName}' integration is not included in your organisation's current subscription plan. Please contact your administrator to upgrade.`);
      }
    }

    // Encrypt tenant access token or API key if provided
    let accessTokenEncrypted = null;
    let accountIdentifier = config.accountName || config.senderEmail || `${provider.providerName} Connection`;
    let accountEmail = config.accountEmail || config.senderEmail || null;

    if (config.apiKey || config.accessToken) {
      accessTokenEncrypted = encrypt(config.apiKey || config.accessToken);
    }

    const existing = await prisma.organisationIntegration.findFirst({
      where: {
        organisationId: orgId,
        OR: [{ providerId: provider.id }, { providerKey: provider.providerKey }],
      },
    });

    let saved = null;
    if (existing) {
      saved = await prisma.organisationIntegration.update({
        where: { id: existing.id },
        data: {
          providerId: provider.id,
          providerKey: provider.providerKey,
          status: "CONNECTED",
          connectionStatus: "CONNECTED",
          accountName: accountIdentifier,
          accountEmail,
          accountIdentifier,
          accessTokenEncrypted: accessTokenEncrypted || existing.accessTokenEncrypted,
          metadata: {
            ...existing.metadata,
            ...config,
            apiKey: undefined, // Never store raw key in metadata json
            accessToken: undefined,
          },
          connectedById: userId ? Number(userId) : existing.connectedById,
          connectedAt: new Date(),
          lastUsedAt: new Date(),
          lastError: null,
        },
      });
    } else {
      saved = await prisma.organisationIntegration.create({
        data: {
          organisationId: orgId,
          providerId: provider.id,
          providerKey: provider.providerKey,
          status: "CONNECTED",
          connectionStatus: "CONNECTED",
          accountName: accountIdentifier,
          accountEmail,
          accountIdentifier,
          accessTokenEncrypted,
          metadata: {
            ...config,
            apiKey: undefined,
            accessToken: undefined,
          },
          connectedById: userId ? Number(userId) : null,
          connectedAt: new Date(),
          lastUsedAt: new Date(),
        },
      });
    }

    // Audit log
    await prisma.integrationLog.create({
      data: {
        organisationId: orgId,
        providerId: provider.id,
        integrationId: saved.id,
        provider: provider.providerKey.toUpperCase(),
        action: "CONNECT_API_KEY",
        status: "SUCCESS",
      },
    });

    return {
      success: true,
      integrationId: saved.id,
      providerKey: provider.providerKey,
      status: "CONNECTED",
      accountIdentifier,
      accountEmail,
    };
  }

  /**
   * Disconnect an integration for a specific organization
   * Strictly verifies tenant ownership before modifying records.
   */
  static async disconnectIntegration({ organisationId, providerKeyOrId, userId }) {
    if (!organisationId) {
      throw new Error("Organisation ID is required.");
    }
    const orgId = Number(organisationId);

    const provider = await prisma.integrationProvider.findFirst({
      where: {
        OR: [{ id: providerKeyOrId }, { providerKey: providerKeyOrId }],
      },
    });

    const targetRecord = await prisma.organisationIntegration.findFirst({
      where: {
        organisationId: orgId,
        OR: [
          { id: providerKeyOrId },
          ...(provider ? [{ providerId: provider.id }, { providerKey: provider.providerKey }] : []),
        ],
      },
    });

    if (!targetRecord) {
      throw new Error("Integration not found or does not belong to your organisation.");
    }

    // Update connection status and clear encrypted tokens
    const updated = await prisma.organisationIntegration.update({
      where: { id: targetRecord.id },
      data: {
        status: "DISCONNECTED",
        connectionStatus: "DISCONNECTED",
        accessTokenEncrypted: null,
        refreshTokenEncrypted: null,
        expiresAt: null,
        tokenExpiresAt: null,
        lastError: null,
      },
    });

    // Audit log
    await prisma.integrationLog.create({
      data: {
        organisationId: orgId,
        providerId: targetRecord.providerId,
        integrationId: targetRecord.id,
        provider: (provider?.providerKey || "INTEGRATION").toUpperCase(),
        action: "DISCONNECT",
        status: "SUCCESS",
      },
    });

    return {
      success: true,
      message: `Integration disconnected successfully.`,
      integrationId: updated.id,
      status: "DISCONNECTED",
    };
  }

  /**
   * Test an organization's active connection
   */
  static async testConnection({ organisationId, providerKeyOrId }) {
    if (!organisationId) {
      throw new Error("Organisation ID is required.");
    }
    const orgId = Number(organisationId);

    const provider = await prisma.integrationProvider.findFirst({
      where: {
        OR: [{ id: providerKeyOrId }, { providerKey: providerKeyOrId }],
      },
    });

    const record = await prisma.organisationIntegration.findFirst({
      where: {
        organisationId: orgId,
        OR: [
          { id: providerKeyOrId },
          ...(provider ? [{ providerId: provider.id }, { providerKey: provider.providerKey }] : []),
        ],
      },
    });

    if (!record || (record.status !== "CONNECTED" && record.connectionStatus !== "CONNECTED")) {
      throw new Error("Integration is not connected.");
    }

    let testStatus = "SUCCESS";
    let message = "Connection is active and healthy.";

    if (record.accessTokenEncrypted) {
      try {
        const token = decrypt(record.accessTokenEncrypted);
        if (!token) {
          testStatus = "FAILED";
          message = "Failed to decrypt tenant access token.";
        }
      } catch (err) {
        testStatus = "FAILED";
        message = `Token decryption error: ${err.message}`;
      }
    }

    // Check expiration
    const expiry = record.tokenExpiresAt || record.expiresAt;
    if (expiry && new Date() > new Date(expiry)) {
      testStatus = "WARNING";
      message = "Access token has expired. Automatic refresh will be attempted on next use.";
    }

    await prisma.integrationLog.create({
      data: {
        organisationId: orgId,
        providerId: record.providerId,
        integrationId: record.id,
        provider: (provider?.providerKey || "INTEGRATION").toUpperCase(),
        action: "TEST_CONNECTION",
        status: testStatus === "FAILED" ? "FAILED" : "SUCCESS",
        errorMessage: testStatus === "FAILED" ? message : null,
      },
    });

    return {
      success: testStatus !== "FAILED",
      status: testStatus,
      message,
      testedAt: new Date(),
    };
  }

  /**
   * Get safe integration audit logs for an organisation
   */
  static async getLogs({ organisationId, providerKeyOrId, limit = 50 }) {
    if (!organisationId) {
      throw new Error("Organisation ID is required.");
    }
    const orgId = Number(organisationId);

    let providerIdFilter = undefined;
    let providerStringFilter = undefined;

    if (providerKeyOrId) {
      const provider = await prisma.integrationProvider.findFirst({
        where: {
          OR: [{ id: providerKeyOrId }, { providerKey: providerKeyOrId }],
        },
      });
      if (provider) {
        providerIdFilter = provider.id;
        providerStringFilter = provider.providerKey.toUpperCase();
      }
    }

    const where = {
      organisationId: orgId,
      ...(providerIdFilter
        ? {
            OR: [{ providerId: providerIdFilter }, { provider: providerStringFilter }],
          }
        : {}),
    };

    const logs = await prisma.integrationLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(limit) || 50, 100),
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      status: log.status,
      provider: log.provider,
      executionTimeMs: log.executionTimeMs,
      errorMessage: log.errorMessage,
      externalId: log.externalId,
      createdAt: log.createdAt,
    }));
  }
}

module.exports = OrganisationIntegrationService;
