const prisma = require("../config/prismaClient");

/**
 * AI Provider Repository
 * Handles AIProvider and AIServiceHealth database operations
 */

const findById = async (id) => {
  return await prisma.aIProvider.findUnique({
    where: { id: String(id) },
    include: {
      models: true,
      serviceHealth: true,
      _count: { select: { models: true, jobs: true, logs: true } },
    },
  });
};

const findByCode = async (providerCode) => {
  return await prisma.aIProvider.findUnique({
    where: { providerCode: String(providerCode) },
    include: { models: true, serviceHealth: true },
  });
};

const findAll = async ({ status, connectionStatus } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (connectionStatus) where.connectionStatus = connectionStatus;

  return await prisma.aIProvider.findMany({
    where,
    orderBy: [{ priority: "asc" }, { providerName: "asc" }],
    include: {
      models: true,
      serviceHealth: true,
      _count: { select: { models: true } },
    },
  });
};

const create = async (providerData) => {
  return await prisma.aIProvider.create({
    data: {
      providerName: providerData.providerName,
      providerCode: providerData.providerCode.toLowerCase().replace(/\s+/g, "_"),
      description: providerData.description || null,
      baseUrl: providerData.baseUrl || null,
      apiVersion: providerData.apiVersion || null,
      apiKeyEncrypted: providerData.apiKeyEncrypted || null,
      region: providerData.region || null,
      status: providerData.status || "ACTIVE",
      connectionStatus: providerData.connectionStatus || "DISCONNECTED",
      priority: providerData.priority ? Number(providerData.priority) : 1,
      isDefault: Boolean(providerData.isDefault),
      supportsChat: providerData.supportsChat ?? true,
      supportsVision: Boolean(providerData.supportsVision),
      supportsOCR: Boolean(providerData.supportsOCR),
      supportsStreaming: providerData.supportsStreaming ?? true,
      requestTimeoutMs: Number(providerData.requestTimeoutMs || 60000),
      maxRetries: Number(providerData.maxRetries || 3),
      healthScore: providerData.healthScore ? Number(providerData.healthScore) : null,
      createdBy: providerData.createdBy || null,
    },
  });
};

const update = async (id, updateData) => {
  return await prisma.aIProvider.update({
    where: { id: String(id) },
    data: updateData,
  });
};

const updateConnectionStatus = async (id, connectionStatus, healthScore = null) => {
  return await prisma.aIProvider.update({
    where: { id: String(id) },
    data: {
      connectionStatus,
      lastConnectedAt: connectionStatus === "CONNECTED" ? new Date() : undefined,
      lastHealthCheckAt: new Date(),
      healthScore: healthScore !== null ? Number(healthScore) : undefined,
    },
  });
};

const deleteProvider = async (id) => {
  return await prisma.aIProvider.delete({
    where: { id: String(id) },
  });
};

module.exports = {
  findById,
  findByCode,
  findAll,
  create,
  update,
  updateConnectionStatus,
  deleteProvider,
};
