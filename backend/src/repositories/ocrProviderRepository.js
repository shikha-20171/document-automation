const prisma = require("../config/prismaClient");

/**
 * OCR Provider Repository
 * Handles OCRProvider and OCRServiceHealth database operations
 */

const findById = async (id) => {
  return await prisma.oCRProvider.findUnique({
    where: { id: String(id) },
    include: {
      profiles: true,
      serviceHealth: true,
      _count: { select: { profiles: true, jobs: true, logs: true } },
    },
  });
};

const findByCode = async (providerCode) => {
  return await prisma.oCRProvider.findUnique({
    where: { providerCode: String(providerCode) },
    include: { profiles: true, serviceHealth: true },
  });
};

const findAll = async ({ status, connectionStatus } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (connectionStatus) where.connectionStatus = connectionStatus;

  return await prisma.oCRProvider.findMany({
    where,
    orderBy: [{ priority: "asc" }, { providerName: "asc" }],
    include: {
      profiles: true,
      serviceHealth: true,
      _count: { select: { profiles: true, jobs: true } },
    },
  });
};

const create = async (providerData) => {
  return await prisma.oCRProvider.create({
    data: {
      providerName: providerData.providerName,
      providerCode: providerData.providerCode.toLowerCase().replace(/\s+/g, "_"),
      description: providerData.description || null,
      apiEndpoint: providerData.apiEndpoint || null,
      credentialsEncrypted: providerData.credentialsEncrypted || null,
      authType: providerData.authType || "API_KEY",
      region: providerData.region || "global",
      status: providerData.status || "ACTIVE",
      connectionStatus: providerData.connectionStatus || "CONNECTED",
      priority: providerData.priority ? Number(providerData.priority) : 1,
      isEnabled: providerData.isEnabled !== undefined ? Boolean(providerData.isEnabled) : true,
      isDefault: Boolean(providerData.isDefault),
      supportedFormats: providerData.supportedFormats || ["PDF", "PNG", "JPG", "TIFF", "WEBP"],
    },
  });
};

const update = async (id, updateData) => {
  return await prisma.oCRProvider.update({
    where: { id: String(id) },
    data: updateData,
  });
};

const deleteProvider = async (id) => {
  return await prisma.oCRProvider.delete({
    where: { id: String(id) },
  });
};

module.exports = {
  findById,
  findByCode,
  findAll,
  create,
  update,
  deleteProvider,
};
