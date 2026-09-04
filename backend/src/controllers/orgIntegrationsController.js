const prisma = require("../config/prismaClient");
const { encryptText, hashString } = require("../utils/cryptoUtils");
const crypto = require("crypto");
const IntegrationManager = require("../services/integrations/IntegrationManager");
const AuditLogService = require("../services/AuditLogService");
const GoogleDriveAdapter = require("../services/integrations/GoogleDriveAdapter");
const SlackAdapter = require("../services/integrations/SlackAdapter");
const MicrosoftTeamsAdapter = require("../services/integrations/MicrosoftTeamsAdapter");
const AwsS3Adapter = require("../services/integrations/AwsS3Adapter");
const SmtpEmailAdapter = require("../services/integrations/SmtpEmailAdapter");
const WhatsAppAdapter = require("../services/integrations/WhatsAppAdapter");
const WebhookDeliveryService = require("../services/integrations/WebhookDeliveryService");
const CustomRestAdapter = require("../services/integrations/CustomRestAdapter");

function getOrgId(req) {
  if (req.user && req.user.organisation_id) return Number(req.user.organisation_id);
  if (req.user && req.user.organisationId) return Number(req.user.organisationId);
  if (req.organisationId) return Number(req.organisationId);
  return 1;
}

function normalizeProvider(providerStr) {
  return IntegrationManager.normalizeProviderId(providerStr);
}

/**
 * 1. PROVIDERS CATALOG & INTEGRATIONS LIST
 */
const getProvidersCatalog = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const catalog = await IntegrationManager.getCatalog(organisationId);
    res.status(200).json({ success: true, data: catalog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getIntegrations = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const catalog = await IntegrationManager.getCatalog(organisationId);
    res.status(200).json({ success: true, data: catalog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/integrations/:id
 */
const getIntegrationById = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const { id } = req.params;
    const providerEnum = normalizeProvider(id);

    const catalog = await IntegrationManager.getCatalog(organisationId);
    const providerMeta = catalog.find((p) => p.id === providerEnum || p.slug === id.toLowerCase());

    if (!providerMeta) {
      return res.status(404).json({ success: false, message: `Integration '${id}' not found in SRS catalog.` });
    }

    const logs = await prisma.integrationLog.findMany({
      where: { organisationId, provider: providerMeta.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    res.status(200).json({
      success: true,
      data: {
        ...providerMeta,
        logs: logs.map((l) => ({
          id: l.id,
          action: l.action,
          status: l.status,
          executionTimeMs: l.executionTimeMs,
          errorMessage: l.errorMessage,
          createdAt: l.createdAt,
          externalId: l.externalId,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/integrations/:provider/connect or configure
 */
const connectProvider = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const providerEnum = normalizeProvider(req.params.provider || req.body.provider);

    if (!providerEnum) {
      return res.status(400).json({ success: false, message: "Invalid integration provider." });
    }

    const stateToken = Buffer.from(JSON.stringify({ organisationId, provider: providerEnum, ts: Date.now() })).toString("base64");

    // 1. Google Workspace
    if (providerEnum === "GOOGLE_WORKSPACE" || providerEnum === "GOOGLE_DRIVE") {
      const platformConfig = await IntegrationManager.getPlatformConfig("GOOGLE_WORKSPACE");
      const adapter = new GoogleDriveAdapter(platformConfig);
      if (!adapter.isConfigured() || !platformConfig.isEnabled) {
        return res.status(400).json({
          success: false,
          status: "NOT_CONFIGURED",
          message: "Google Workspace is currently unavailable. Please contact your platform administrator.",
        });
      }
      return res.status(200).json({ success: true, requiresRedirect: true, authUrl: adapter.getAuthUrl(stateToken) });
    }

    // 2. Microsoft 365
    if (providerEnum === "MICROSOFT_365" || providerEnum === "MICROSOFT_TEAMS") {
      const platformConfig = await IntegrationManager.getPlatformConfig("MICROSOFT_365");
      const adapter = new MicrosoftTeamsAdapter(platformConfig);
      if (!adapter.isConfigured() || !platformConfig.isEnabled) {
        return res.status(400).json({
          success: false,
          status: "NOT_CONFIGURED",
          message: "Microsoft 365 is currently unavailable. Please contact your platform administrator.",
        });
      }
      return res.status(200).json({ success: true, requiresRedirect: true, authUrl: adapter.getAuthUrl(stateToken) });
    }

    // 3. Slack
    if (providerEnum === "SLACK") {
      const platformConfig = await IntegrationManager.getPlatformConfig("SLACK");
      const adapter = new SlackAdapter(platformConfig);
      if (req.body.botToken) {
        const testRes = await adapter.testConnection(req.body.botToken);
        if (!testRes.success) {
          return res.status(400).json({ success: false, message: `Slack token invalid: ${testRes.error}` });
        }

        const record = await prisma.organisationIntegration.upsert({
          where: { organisationId_provider: { organisationId, provider: "SLACK" } },
          update: {
            status: "CONNECTED",
            category: "COMMUNICATION",
            accountName: testRes.accountName,
            accessTokenEncrypted: encryptText(req.body.botToken),
            connectedAt: new Date(),
            lastSyncedAt: new Date(),
          },
          create: {
            organisationId,
            provider: "SLACK",
            category: "COMMUNICATION",
            status: "CONNECTED",
            accountName: testRes.accountName,
            accessTokenEncrypted: encryptText(req.body.botToken),
            connectedAt: new Date(),
            lastSyncedAt: new Date(),
          },
        });

        return res.status(200).json({ success: true, message: "Slack connected successfully!", data: record });
      }

      if (!adapter.isConfigured() || !platformConfig.isEnabled) {
        return res.status(400).json({
          success: false,
          status: "NOT_CONFIGURED",
          message: "Slack is currently unavailable. Please contact your platform administrator.",
        });
      }

      return res.status(200).json({ success: true, requiresRedirect: true, authUrl: adapter.getAuthUrl(stateToken) });
    }

    // 4. AWS S3
    if (providerEnum === "AWS_S3") {
      const platformConfig = await IntegrationManager.getPlatformConfig("AWS_S3");
      if (!platformConfig.isConfigured || !platformConfig.isEnabled) {
        return res.status(400).json({
          success: false,
          status: "NOT_CONFIGURED",
          message: "AWS S3 storage is currently unavailable. Please contact your platform administrator.",
        });
      }

      const s3Settings = platformConfig.settings || {};
      const s3Config = {
        region: req.body.region || s3Settings.region || process.env.AWS_REGION || "us-east-1",
        bucket: req.body.bucket || s3Settings.bucketName || s3Settings.bucket || process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET,
        accessKeyId: req.body.accessKeyId || s3Settings.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: req.body.secretAccessKey || s3Settings.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      };

      const adapter = new AwsS3Adapter(s3Config);
      const testRes = await adapter.testConnection();
      if (!testRes.success) {
        return res.status(400).json({ success: false, message: `AWS S3 verification failed: ${testRes.error}` });
      }

      const record = await prisma.organisationIntegration.upsert({
        where: { organisationId_provider: { organisationId, provider: "AWS_S3" } },
        update: {
          status: "CONNECTED",
          category: "STORAGE",
          accountName: `AWS S3 (${s3Config.bucket})`,
          metadata: { region: s3Config.region, bucket: s3Config.bucket },
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
        create: {
          organisationId,
          provider: "AWS_S3",
          category: "STORAGE",
          status: "CONNECTED",
          accountName: `AWS S3 (${s3Config.bucket})`,
          metadata: { region: s3Config.region, bucket: s3Config.bucket },
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
      });

      return res.status(200).json({ success: true, message: "AWS S3 storage connected successfully!", data: record });
    }

    // 5. SMTP & Email
    if (providerEnum === "SMTP_EMAIL") {
      const platformConfig = await IntegrationManager.getPlatformConfig("SMTP_EMAIL");
      if (!platformConfig.isConfigured || !platformConfig.isEnabled) {
        return res.status(400).json({
          success: false,
          status: "NOT_CONFIGURED",
          message: "Email service is currently unavailable. Please contact your platform administrator.",
        });
      }

      const smtpSettings = platformConfig.settings || {};
      const smtpConfig = {
        host: req.body.host || smtpSettings.host || process.env.SMTP_HOST,
        port: Number(req.body.port || smtpSettings.port || process.env.SMTP_PORT || 587),
        secure: Boolean(req.body.secure !== undefined ? req.body.secure : smtpSettings.secure),
        user: req.body.user || smtpSettings.user || process.env.SMTP_USER,
        pass: req.body.pass || smtpSettings.password || process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
        fromEmail: req.body.fromEmail || smtpSettings.fromEmail || process.env.SMTP_FROM_EMAIL || "notifications@docucore.ai",
        fromName: req.body.fromName || smtpSettings.fromName || process.env.SMTP_FROM_NAME || "DocuCore",
      };

      const adapter = new SmtpEmailAdapter(smtpConfig);
      const testRes = await adapter.testConnection();
      if (!testRes.success) {
        return res.status(400).json({ success: false, message: `SMTP verification failed: ${testRes.error}` });
      }

      const record = await prisma.organisationIntegration.upsert({
        where: { organisationId_provider: { organisationId, provider: "SMTP_EMAIL" } },
        update: {
          status: "CONNECTED",
          category: "COMMUNICATION",
          accountName: `${smtpConfig.host}:${smtpConfig.port}`,
          accountEmail: smtpConfig.fromEmail,
          metadata: { host: smtpConfig.host, port: smtpConfig.port, fromEmail: smtpConfig.fromEmail, fromName: smtpConfig.fromName },
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
        create: {
          organisationId,
          provider: "SMTP_EMAIL",
          category: "COMMUNICATION",
          status: "CONNECTED",
          accountName: `${smtpConfig.host}:${smtpConfig.port}`,
          accountEmail: smtpConfig.fromEmail,
          metadata: { host: smtpConfig.host, port: smtpConfig.port, fromEmail: smtpConfig.fromEmail, fromName: smtpConfig.fromName },
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
      });

      return res.status(200).json({ success: true, message: "SMTP server connected successfully!", data: record });
    }

    // 6. WhatsApp Business API
    if (providerEnum === "WHATSAPP_BUSINESS") {
      const platformConfig = await IntegrationManager.getPlatformConfig("WHATSAPP_BUSINESS");
      if (!platformConfig.isConfigured || !platformConfig.isEnabled) {
        return res.status(400).json({
          success: false,
          status: "NOT_CONFIGURED",
          message: "WhatsApp Business is currently unavailable. Please contact your platform administrator.",
        });
      }

      const waSettings = platformConfig.settings || {};
      const waConfig = {
        accessToken: req.body.accessToken || waSettings.accessToken || process.env.WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: req.body.phoneNumberId || waSettings.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID,
        businessAccountId: req.body.businessAccountId || waSettings.businessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
      };

      const adapter = new WhatsAppAdapter(waConfig);
      const testRes = await adapter.testConnection();
      if (!testRes.success) {
        return res.status(400).json({ success: false, message: `WhatsApp API verification failed: ${testRes.error}` });
      }

      const record = await prisma.organisationIntegration.upsert({
        where: { organisationId_provider: { organisationId, provider: "WHATSAPP_BUSINESS" } },
        update: {
          status: "CONNECTED",
          category: "COMMUNICATION",
          accountName: testRes.verifiedName || "WhatsApp Business Account",
          accountEmail: testRes.displayPhoneNumber,
          metadata: { phoneNumberId: waConfig.phoneNumberId, businessAccountId: waConfig.businessAccountId },
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
        create: {
          organisationId,
          provider: "WHATSAPP_BUSINESS",
          category: "COMMUNICATION",
          status: "CONNECTED",
          accountName: testRes.verifiedName || "WhatsApp Business Account",
          accountEmail: testRes.displayPhoneNumber,
          metadata: { phoneNumberId: waConfig.phoneNumberId, businessAccountId: waConfig.businessAccountId },
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
      });

      return res.status(200).json({ success: true, message: "WhatsApp Business connected successfully!", data: record });
    }

    res.status(400).json({ success: false, message: `Provider ${providerEnum} not configured.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/integrations/:provider/callback
 */
const oauthCallback = async (req, res) => {
  const provider = req.params.provider;
  const { code, state, error, error_description } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (error) {
    return res.redirect(`${frontendUrl}/org-admin/integrations?error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/org-admin/integrations?error=Authorization+code+missing`);
  }

  try {
    let organisationId = 1;
    let providerEnum = normalizeProvider(provider);

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
        if (decoded.organisationId) organisationId = Number(decoded.organisationId);
        if (decoded.provider) providerEnum = normalizeProvider(decoded.provider);
      } catch {}
    }

    if (providerEnum === "GOOGLE_WORKSPACE" || providerEnum === "GOOGLE_DRIVE") {
      const platformConfig = await IntegrationManager.getPlatformConfig("GOOGLE_WORKSPACE");
      const adapter = new GoogleDriveAdapter(platformConfig);
      const tokenData = await adapter.exchangeCode(code);

      await prisma.organisationIntegration.upsert({
        where: { organisationId_provider: { organisationId, provider: "GOOGLE_WORKSPACE" } },
        update: {
          status: "CONNECTED",
          category: "STORAGE",
          accountName: tokenData.accountName,
          accountEmail: tokenData.accountEmail,
          accessTokenEncrypted: encryptText(tokenData.accessToken),
          refreshTokenEncrypted: tokenData.refreshToken ? encryptText(tokenData.refreshToken) : undefined,
          expiresAt: tokenData.expiresAt,
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
        create: {
          organisationId,
          provider: "GOOGLE_WORKSPACE",
          category: "STORAGE",
          status: "CONNECTED",
          accountName: tokenData.accountName,
          accountEmail: tokenData.accountEmail,
          accessTokenEncrypted: encryptText(tokenData.accessToken),
          refreshTokenEncrypted: tokenData.refreshToken ? encryptText(tokenData.refreshToken) : null,
          expiresAt: tokenData.expiresAt,
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
      });

      return res.redirect(`${frontendUrl}/org-admin/integrations/google-workspace?connected=true`);
    }

    if (providerEnum === "SLACK") {
      const platformConfig = await IntegrationManager.getPlatformConfig("SLACK");
      const adapter = new SlackAdapter(platformConfig);
      const tokenData = await adapter.exchangeCode(code);

      await prisma.organisationIntegration.upsert({
        where: { organisationId_provider: { organisationId, provider: "SLACK" } },
        update: {
          status: "CONNECTED",
          category: "COMMUNICATION",
          accountName: tokenData.accountName,
          accountEmail: tokenData.accountEmail,
          accessTokenEncrypted: encryptText(tokenData.accessToken),
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
        create: {
          organisationId,
          provider: "SLACK",
          category: "COMMUNICATION",
          status: "CONNECTED",
          accountName: tokenData.accountName,
          accountEmail: tokenData.accountEmail,
          accessTokenEncrypted: encryptText(tokenData.accessToken),
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
      });

      return res.redirect(`${frontendUrl}/org-admin/integrations/slack?connected=true`);
    }

    if (providerEnum === "MICROSOFT_365" || providerEnum === "MICROSOFT_TEAMS") {
      const platformConfig = await IntegrationManager.getPlatformConfig("MICROSOFT_365");
      const adapter = new MicrosoftTeamsAdapter(platformConfig);
      const tokenData = await adapter.exchangeCode(code);

      await prisma.organisationIntegration.upsert({
        where: { organisationId_provider: { organisationId, provider: providerEnum } },
        update: {
          status: "CONNECTED",
          category: "COMMUNICATION",
          accountName: tokenData.accountName,
          accountEmail: tokenData.accountEmail,
          accessTokenEncrypted: encryptText(tokenData.accessToken),
          refreshTokenEncrypted: tokenData.refreshToken ? encryptText(tokenData.refreshToken) : undefined,
          expiresAt: tokenData.expiresAt,
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
        create: {
          organisationId,
          provider: providerEnum,
          category: "COMMUNICATION",
          status: "CONNECTED",
          accountName: tokenData.accountName,
          accountEmail: tokenData.accountEmail,
          accessTokenEncrypted: encryptText(tokenData.accessToken),
          refreshTokenEncrypted: tokenData.refreshToken ? encryptText(tokenData.refreshToken) : null,
          expiresAt: tokenData.expiresAt,
          connectedAt: new Date(),
          lastSyncedAt: new Date(),
        },
      });

      const slug = providerEnum === "MICROSOFT_365" ? "microsoft-365" : "microsoft-teams";
      return res.redirect(`${frontendUrl}/org-admin/integrations/${slug}?connected=true`);
    }

    // Log connection audit event
    await AuditLogService.log({
      organisationId,
      actorName: "Organisation Admin",
      actorRole: "ORG_ADMIN",
      actorType: "ORG_ADMIN",
      module: "INTEGRATIONS",
      action: "INTEGRATION_CONNECTED",
      resourceType: "ORGANISATION_INTEGRATION",
      resourceName: providerEnum,
      severity: "INFO",
      metadata: { provider: providerEnum },
      req,
    }).catch(() => null);

    res.redirect(`${frontendUrl}/org-admin/integrations?connected=true`);
  } catch (err) {
    res.redirect(`${frontendUrl}/org-admin/integrations?error=${encodeURIComponent(err.message)}`);
  }
};

/**
 * POST /api/integrations/:provider/test
 */
const testConnection = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const providerId = normalizeProvider(req.params.provider || req.params.id);

    const testResult = await IntegrationManager.testConnection(organisationId, providerId);

    await AuditLogService.log({
      organisationId,
      actorUserId: req.user?.id || null,
      actorName: req.user?.first_name ? `${req.user.first_name} ${req.user.last_name || ""}`.trim() : "Org Admin",
      actorRole: req.user?.role || "ORG_ADMIN",
      actorType: req.user?.role || "ORG_ADMIN",
      module: "INTEGRATIONS",
      action: "INTEGRATION_TESTED",
      resourceType: "ORGANISATION_INTEGRATION",
      resourceName: providerId,
      severity: testResult.success ? "INFO" : "WARNING",
      status: testResult.success ? "SUCCESS" : "FAILURE",
      metadata: { provider: providerId, success: testResult.success, error: testResult.error || null },
      req,
    }).catch(() => null);

    res.status(200).json({
      success: testResult.success,
      status: testResult.status,
      data: testResult,
      message: testResult.success ? "Integration test passed successfully!" : (testResult.error || "Connection test failed"),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/integrations/:provider/actions/:action
 */
const executeProviderAction = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const provider = normalizeProvider(req.params.provider);
    const action = req.params.action;

    const result = await IntegrationManager.executeAction(organisationId, provider, action, req.body);
    res.status(200).json({
      success: true,
      message: `Action '${action}' executed successfully on ${provider}.`,
      data: result.data,
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/integrations/:id/disconnect or DELETE /api/integrations/:id
 */
const disconnectIntegration = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const id = req.params.id;
    const providerEnum = normalizeProvider(id);

    await prisma.organisationIntegration.deleteMany({
      where: { organisationId, provider: providerEnum },
    });

    await IntegrationManager.logActivity(organisationId, providerEnum, "DISCONNECT", "SUCCESS", null, null, null, 10);

    await AuditLogService.log({
      organisationId,
      actorUserId: req.user?.id || null,
      actorName: req.user?.first_name ? `${req.user.first_name} ${req.user.last_name || ""}`.trim() : "Org Admin",
      actorRole: req.user?.role || "ORG_ADMIN",
      actorType: req.user?.role || "ORG_ADMIN",
      module: "INTEGRATIONS",
      action: "INTEGRATION_DISCONNECTED",
      resourceType: "ORGANISATION_INTEGRATION",
      resourceName: providerEnum,
      severity: "WARNING",
      metadata: { provider: providerEnum },
      req,
    }).catch(() => null);

    res.status(200).json({
      success: true,
      message: "Integration disconnected successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/integrations/:provider/logs
 */
const getIntegrationLogs = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const providerEnum = normalizeProvider(req.params.provider);

    const logs = await prisma.integrationLog.findMany({
      where: { organisationId, provider: providerEnum },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── API Keys Controller Methods ──────────────────────────────────────────
const getOrgApiKeys = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const keys = await prisma.organisationApiKey.findMany({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: keys });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateOrgApiKey = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const { name, scopes } = req.body;

    const rawKey = `dc_live_${crypto.randomBytes(24).toString("hex")}`;
    const prefix = rawKey.substring(0, 12) + "...";
    const hashed = hashString(rawKey);

    const created = await prisma.organisationApiKey.create({
      data: {
        organisationId,
        name: name || "Developer API Key",
        apiKeyHash: hashed,
        apiKeyPrefix: prefix,
        scopes: scopes || ["read", "write"],
        status: "ACTIVE",
      },
    });

    res.status(201).json({
      success: true,
      message: "API Key created successfully. Store this key safely; it will not be displayed again.",
      data: {
        id: created.id,
        name: created.name,
        apiKey: rawKey,
        prefix,
        createdAt: created.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const revokeOrgApiKey = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const { id } = req.params;

    await prisma.organisationApiKey.deleteMany({
      where: { id: Number(id) || undefined, organisationId },
    });

    res.status(200).json({ success: true, message: "API key revoked." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Webhooks Controller Methods ─────────────────────────────────────────
const getWebhooks = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const hooks = await prisma.organisationWebhook.findMany({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: hooks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createWebhook = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const { name, url, events } = req.body;

    const rawSecret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    const hashedSecret = hashString(rawSecret);

    const created = await prisma.organisationWebhook.create({
      data: {
        organisationId,
        name: name || "DocuCore Webhook",
        url,
        secretHash: hashedSecret,
        events: events || ["document.created", "document.approved", "document.signed"],
        status: "ACTIVE",
      },
    });

    res.status(201).json({
      success: true,
      message: "Webhook created successfully.",
      data: {
        id: created.id,
        name: created.name,
        url: created.url,
        secret: rawSecret,
        events: created.events,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateWebhook = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const { id } = req.params;
    const { name, url, events, status } = req.body;

    const updated = await prisma.organisationWebhook.updateMany({
      where: { id: Number(id), organisationId },
      data: { name, url, events, status },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteWebhook = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const { id } = req.params;

    await prisma.organisationWebhook.deleteMany({
      where: { id: Number(id), organisationId },
    });

    res.status(200).json({ success: true, message: "Webhook deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const testWebhook = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const { id } = req.params;

    const webhook = await prisma.organisationWebhook.findFirst({
      where: { id: Number(id), organisationId },
    });

    if (!webhook) {
      return res.status(404).json({ success: false, message: "Webhook not found." });
    }

    const deliveryResult = await WebhookDeliveryService.deliverWebhook(webhook, "webhook.test", {
      test: true,
      timestamp: new Date().toISOString(),
      message: "DocuCore test ping event.",
    });

    res.status(200).json({ success: true, message: "Webhook test ping dispatched.", data: deliveryResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWebhookDeliveries = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId: Number(id) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.status(200).json({ success: true, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const retryWebhookDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await WebhookDeliveryService.retryDelivery(Number(id));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Custom REST Controller Methods ──────────────────────────────────────
const getCustomRestIntegrations = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const list = await prisma.customRestIntegration.findMany({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCustomRestIntegration = async (req, res) => {
  try {
    const organisationId = getOrgId(req);
    const { name, baseUrl, authType, authConfig, headers, timeoutMs } = req.body;

    const created = await prisma.customRestIntegration.create({
      data: {
        organisationId,
        name,
        baseUrl,
        authType: authType || "NONE",
        authConfig: authConfig || undefined,
        headers: headers || undefined,
        timeoutMs: timeoutMs || 10000,
        status: "ACTIVE",
      },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const testCustomRest = async (req, res) => {
  try {
    const result = await CustomRestAdapter.executeRequest(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProvidersCatalog,
  getIntegrations,
  getIntegrationById,
  connectProvider,
  oauthCallback,
  testConnection,
  executeProviderAction,
  disconnectIntegration,
  getIntegrationLogs,
  getOrgApiKeys,
  generateOrgApiKey,
  revokeOrgApiKey,
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookDeliveries,
  retryWebhookDelivery,
  getCustomRestIntegrations,
  createCustomRestIntegration,
  testCustomRest,
};
