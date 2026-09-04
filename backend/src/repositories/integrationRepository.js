const prisma = require("../config/prismaClient");

/**
 * Integration Repository
 * Handles OrganisationIntegration, OrganisationApiKey, and OrganisationWebhook operations
 */

/* Integrations */
const getOrgIntegrations = async (organisationId) => {
  return await prisma.organisationIntegration.findMany({
    where: { organisationId: Number(organisationId) },
    orderBy: { createdAt: "desc" },
  });
};

const createOrUpdateIntegration = async (organisationId, provider, data) => {
  const existing = await prisma.organisationIntegration.findFirst({
    where: {
      organisationId: Number(organisationId),
      provider,
    },
  });

  if (existing) {
    return await prisma.organisationIntegration.update({
      where: { id: existing.id },
      data: {
        status: data.status || "CONNECTED",
        configEncrypted: data.configEncrypted || existing.configEncrypted,
        lastSyncedAt: new Date(),
      },
    });
  }

  return await prisma.organisationIntegration.create({
    data: {
      organisationId: Number(organisationId),
      provider,
      status: data.status || "CONNECTED",
      configEncrypted: data.configEncrypted || null,
      connectedById: Number(data.connectedById),
    },
  });
};

const deleteIntegration = async (id) => {
  return await prisma.organisationIntegration.delete({
    where: { id: String(id) },
  });
};

/* API Keys */
const getOrgApiKeys = async (organisationId) => {
  return await prisma.organisationApiKey.findMany({
    where: { organisationId: Number(organisationId) },
    orderBy: { createdAt: "desc" },
  });
};

const createApiKey = async (keyData) => {
  return await prisma.organisationApiKey.create({
    data: {
      organisationId: Number(keyData.organisationId),
      name: keyData.name,
      keyPrefix: keyData.keyPrefix,
      keyHash: keyData.keyHash,
      permissions: keyData.permissions || ["*"],
      status: keyData.status || "ACTIVE",
      expiresAt: keyData.expiresAt ? new Date(keyData.expiresAt) : null,
      createdById: Number(keyData.createdById),
    },
  });
};

const revokeApiKey = async (id) => {
  return await prisma.organisationApiKey.update({
    where: { id: String(id) },
    data: { status: "REVOKED" },
  });
};

/* Webhooks */
const getOrgWebhooks = async (organisationId) => {
  return await prisma.organisationWebhook.findMany({
    where: { organisationId: Number(organisationId) },
    orderBy: { createdAt: "desc" },
  });
};

const createWebhook = async (webhookData) => {
  return await prisma.organisationWebhook.create({
    data: {
      organisationId: Number(webhookData.organisationId),
      url: webhookData.url,
      events: webhookData.events || ["*"],
      secret: webhookData.secret,
      status: webhookData.status || "ACTIVE",
      createdById: Number(webhookData.createdById),
    },
  });
};

const deleteWebhook = async (id) => {
  return await prisma.organisationWebhook.delete({
    where: { id: String(id) },
  });
};

module.exports = {
  getOrgIntegrations,
  createOrUpdateIntegration,
  deleteIntegration,
  getOrgApiKeys,
  createApiKey,
  revokeApiKey,
  getOrgWebhooks,
  createWebhook,
  deleteWebhook,
};
