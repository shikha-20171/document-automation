const prisma = require("../config/prismaClient");
const {
  encryptJson,
  decryptJson,
  sanitizeConfig,
  maskSecret,
} = require("./integrationEncryptionService");

class IntegrationProviderService {
  static _resolveKeyAliases(providerKeyOrId) {
    if (!providerKeyOrId) return [];
    const clean = String(providerKeyOrId).toLowerCase().trim().replace(/[\s-]+/g, "_");
    const aliases = [providerKeyOrId, clean, clean.toUpperCase()];
    if (clean.includes("google")) {
      aliases.push("google_workspace", "google_drive", "google", "GOOGLE_WORKSPACE", "GOOGLE_DRIVE");
    }
    if (clean.includes("microsoft") || clean.includes("onedrive") || clean.includes("teams")) {
      aliases.push("microsoft_365", "microsoft_teams", "microsoft_onedrive", "MICROSOFT_365", "MICROSOFT_TEAMS");
    }
    if (clean.includes("slack")) {
      aliases.push("slack", "SLACK");
    }
    if (clean.includes("brevo") || clean.includes("sendinblue")) {
      aliases.push("brevo", "BREVO", "sendinblue", "brevo_email");
    }
    if (clean.includes("whatsapp")) {
      aliases.push("whatsapp_business", "whatsapp", "WHATSAPP_BUSINESS");
    }
    return Array.from(new Set(aliases));
  }

  /**
   * List all providers with connection counts and masked credential statuses
   * @param {Object} options
   * @param {boolean} options.isSuperAdmin - Whether caller is Super Admin
   * @param {string} options.environment - production, staging, sandbox
   */
  static async listProviders({ isSuperAdmin = false, environment = "production" } = {}) {
    const where = isSuperAdmin ? {} : { isEnabled: true, isActive: true };

    const providers = await prisma.integrationProvider.findMany({
      where,
      orderBy: { providerName: "asc" },
      include: {
        credentials: {
          where: { environment },
          take: 1,
        },
      },
    });

    // Count connected tenants per provider
    const connectedCounts = await prisma.organisationIntegration.groupBy({
      by: ["providerId", "status", "connectionStatus"],
      where: {
        OR: [{ status: "CONNECTED" }, { connectionStatus: "CONNECTED" }],
      },
      _count: { organisationId: true },
    });

    const countMap = new Map();
    connectedCounts.forEach((c) => {
      if (c.providerId) {
        const current = countMap.get(c.providerId) || 0;
        countMap.set(c.providerId, current + c._count.organisationId);
      }
    });

    return providers.map((provider) => {
      const cred = provider.credentials?.[0] || null;
      let credentialConfig = null;

      if (cred && isSuperAdmin) {
        // Super Admin sees masked/sanitized config
        try {
          const raw = decryptJson(cred.credentialsEncrypted);
          credentialConfig = sanitizeConfig(raw, true);
        } catch {
          credentialConfig = { error: "Failed to decrypt credential payload" };
        }
      }

      return {
        id: provider.id,
        providerKey: provider.providerKey,
        providerName: provider.providerName,
        category: provider.category,
        authenticationType: provider.authenticationType,
        description: provider.description,
        logoUrl: provider.logoUrl,
        documentationUrl: provider.documentationUrl,
        isEnabled: provider.isEnabled,
        isActive: provider.isActive,
        configurationSchema: isSuperAdmin ? provider.configurationSchema : undefined,
        requiredScopes: provider.requiredScopes,
        supportedFeatures: provider.supportedFeatures,
        connectedTenantsCount: countMap.get(provider.id) || 0,
        isConfigured: Boolean(cred && cred.status === "ACTIVE"),
        credentialStatus: cred ? cred.status : "NOT_CONFIGURED",
        lastTestedAt: cred ? cred.lastTestedAt : null,
        lastTestStatus: cred ? cred.lastTestStatus : null,
        lastTestMessage: cred && isSuperAdmin ? cred.lastTestMessage : null,
        maskedCredentials: isSuperAdmin ? credentialConfig : undefined,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt,
      };
    });
  }

  /**
   * Get single provider by ID or Key
   */
  static async getProvider(providerKeyOrId, { isSuperAdmin = false, environment = "production" } = {}) {
    const aliases = this._resolveKeyAliases(providerKeyOrId);
    const provider = await prisma.integrationProvider.findFirst({
      where: {
        OR: [
          { id: { in: aliases } },
          { providerKey: { in: aliases } },
        ],
      },
      include: {
        credentials: {
          where: { environment },
          take: 1,
        },
      },
    });

    if (!provider) {
      throw new Error(`Provider '${providerKeyOrId}' not found.`);
    }

    const cred = provider.credentials?.[0] || null;
    let credentialConfig = null;

    if (cred && isSuperAdmin) {
      try {
        const raw = decryptJson(cred.credentialsEncrypted);
        credentialConfig = sanitizeConfig(raw, true);
      } catch {
        credentialConfig = { error: "Failed to decrypt credential payload" };
      }
    }

    return {
      id: provider.id,
      providerKey: provider.providerKey,
      providerName: provider.providerName,
      category: provider.category,
      authenticationType: provider.authenticationType,
      description: provider.description,
      logoUrl: provider.logoUrl,
      documentationUrl: provider.documentationUrl,
      isEnabled: provider.isEnabled,
      isActive: provider.isActive,
      configurationSchema: isSuperAdmin ? provider.configurationSchema : undefined,
      requiredScopes: provider.requiredScopes,
      supportedFeatures: provider.supportedFeatures,
      isConfigured: Boolean(cred && cred.status === "ACTIVE"),
      credentialStatus: cred ? cred.status : "NOT_CONFIGURED",
      lastTestedAt: cred ? cred.lastTestedAt : null,
      lastTestStatus: cred ? cred.lastTestStatus : null,
      lastTestMessage: cred && isSuperAdmin ? cred.lastTestMessage : null,
      maskedCredentials: isSuperAdmin ? credentialConfig : undefined,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  /**
   * Save / Update platform-level credentials with AES-256-GCM encryption
   * Accessible only to Super Admin
   */
  static async saveCredentials(providerKeyOrId, { credentials, configuration, environment = "production", userId }) {
    if (!credentials || typeof credentials !== "object") {
      throw new Error("Credentials payload is required and must be an object.");
    }

    const provider = await prisma.integrationProvider.findFirst({
      where: {
        OR: [{ id: providerKeyOrId }, { providerKey: providerKeyOrId }],
      },
      include: {
        credentials: {
          where: { environment },
        },
      },
    });

    if (!provider) {
      throw new Error(`Provider '${providerKeyOrId}' not found.`);
    }

    // Merge with existing decrypted credentials if partial update (to preserve clientSecret if empty)
    let finalCredentials = { ...credentials };
    const existingCred = provider.credentials?.[0];
    if (existingCred) {
      try {
        const existingDecrypted = decryptJson(existingCred.credentialsEncrypted);
        for (const [key, value] of Object.entries(credentials)) {
          // If value is empty or masked, keep the existing plaintext secret
          if (value === "" || value === null || (typeof value === "string" && value.includes("••••"))) {
            if (existingDecrypted && existingDecrypted[key]) {
              finalCredentials[key] = existingDecrypted[key];
            }
          }
        }
      } catch (err) {
        console.warn("Could not decrypt existing credentials during merge:", err.message);
      }
    }

    // Encrypt with AES-256-GCM
    const credentialsEncrypted = encryptJson(finalCredentials);
    const configurationEncrypted = configuration ? encryptJson(configuration) : null;

    const saved = await prisma.integrationCredential.upsert({
      where: {
        providerId_environment: {
          providerId: provider.id,
          environment,
        },
      },
      update: {
        credentialsEncrypted,
        encryptionVersion: "v1",
        configurationEncrypted,
        status: "ACTIVE",
        updatedById: userId ? Number(userId) : null,
        lastTestedAt: new Date(),
        lastTestStatus: "SUCCESS",
        lastTestMessage: "Configuration updated and encrypted with AES-256-GCM.",
      },
      create: {
        providerId: provider.id,
        environment,
        credentialName: `${provider.providerName} Platform Credential`,
        credentialsEncrypted,
        encryptionVersion: "v1",
        configurationEncrypted,
        status: "ACTIVE",
        createdById: userId ? Number(userId) : null,
        updatedById: userId ? Number(userId) : null,
        lastTestedAt: new Date(),
        lastTestStatus: "SUCCESS",
        lastTestMessage: "Configuration created and encrypted with AES-256-GCM.",
      },
    });

    return {
      success: true,
      providerId: provider.id,
      providerKey: provider.providerKey,
      environment: saved.environment,
      status: saved.status,
      maskedCredentials: sanitizeConfig(finalCredentials, true),
      updatedAt: saved.updatedAt,
    };
  }

  /**
   * Decrypt and return plaintext credentials for internal platform execution only.
   * NEVER pass this result back in an HTTP response to any tenant or client!
   */
  static async getDecryptedCredentials(providerKeyOrId, environment = "production") {
    const aliases = this._resolveKeyAliases(providerKeyOrId);
    const provider = await prisma.integrationProvider.findFirst({
      where: {
        OR: [
          { id: { in: aliases } },
          { providerKey: { in: aliases } },
        ],
      },
      include: {
        credentials: {
          where: { environment },
          take: 1,
        },
      },
    });

    if (!provider) {
      return null;
    }

    const cred = provider.credentials?.[0];
    if (!cred || !cred.credentialsEncrypted) {
      return null;
    }

    try {
      const credentials = decryptJson(cred.credentialsEncrypted);
      const configuration = cred.configurationEncrypted ? decryptJson(cred.configurationEncrypted) : null;
      return {
        provider,
        credentialId: cred.id,
        credentials: credentials || {},
        configuration: configuration || {},
        environment: cred.environment,
      };
    } catch (err) {
      console.warn(`[IntegrationProviderService] Notice decrypting credentials for provider '${provider.providerKey}':`, err.message);
      return null;
    }
  }

  /**
   * Toggle provider enabled / active status
   */
  static async toggleProvider(providerKeyOrId, { isEnabled, isActive }) {
    const provider = await prisma.integrationProvider.findFirst({
      where: {
        OR: [{ id: providerKeyOrId }, { providerKey: providerKeyOrId }],
      },
    });

    if (!provider) {
      throw new Error(`Provider '${providerKeyOrId}' not found.`);
    }

    const updated = await prisma.integrationProvider.update({
      where: { id: provider.id },
      data: {
        ...(isEnabled !== undefined ? { isEnabled: Boolean(isEnabled) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return updated;
  }

  /**
   * Test configured credentials
   */
  static async testCredentials(providerKeyOrId, environment = "production") {
    const data = await this.getDecryptedCredentials(providerKeyOrId, environment);
    if (!data || !data.credentials) {
      throw new Error(`No credentials configured for '${providerKeyOrId}' in '${environment}'.`);
    }

    const { provider, credentialId, credentials } = data;
    let testStatus = "SUCCESS";
    let testMessage = "Credentials successfully decrypted and verified.";

    // Provider specific sanity checks
    switch (provider.providerKey) {
      case "google_workspace":
        if (!credentials.clientId || !credentials.clientSecret) {
          testStatus = "FAILED";
          testMessage = "Missing required clientId or clientSecret for Google Workspace.";
        }
        break;
      case "microsoft_365":
      case "microsoft_teams":
        if (!credentials.clientId || !credentials.clientSecret) {
          testStatus = "FAILED";
          testMessage = "Missing required clientId or clientSecret for Microsoft.";
        }
        break;
      case "slack":
        if (!credentials.clientId || !credentials.clientSecret) {
          testStatus = "FAILED";
          testMessage = "Missing required clientId or clientSecret for Slack.";
        }
        break;
      case "brevo":
        if (!credentials.apiKey) {
          testStatus = "FAILED";
          testMessage = "Missing required apiKey for Brevo.";
        }
        break;
      case "whatsapp_business":
        if (!credentials.phoneNumberId || !credentials.accessToken) {
          testStatus = "FAILED";
          testMessage = "Missing required phoneNumberId or accessToken for WhatsApp Business.";
        }
        break;
    }

    await prisma.integrationCredential.update({
      where: { id: credentialId },
      data: {
        lastTestedAt: new Date(),
        lastTestStatus: testStatus,
        lastTestMessage: testMessage,
      },
    });

    return {
      providerKey: provider.providerKey,
      status: testStatus,
      message: testMessage,
      testedAt: new Date(),
    };
  }
}

module.exports = IntegrationProviderService;
