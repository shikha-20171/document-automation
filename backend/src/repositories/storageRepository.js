const prisma = require("../config/prismaClient");

/**
 * Storage Repository
 * Handles StorageConfig, OrganisationStorageUsage, StorageBackup, StorageAlert, StorageRetentionPolicy
 */

/* Storage Config */
const getStorageConfig = async () => {
  return await prisma.storageConfig.findFirst({
    where: { isActive: true },
  });
};

const updateStorageConfig = async (id, configData) => {
  return await prisma.storageConfig.update({
    where: { id: String(id) },
    data: configData,
  });
};

/* Organisation Storage Usage */
const getOrgStorageUsage = async (organisationId) => {
  return await prisma.organisationStorageUsage.findUnique({
    where: { organisationId: Number(organisationId) },
  });
};

const getAllOrgStorageUsages = async () => {
  return await prisma.organisationStorageUsage.findMany({
    orderBy: { usedStorageBytes: "desc" },
  });
};

const updateOrgStorageUsage = async (organisationId, { usedBytes, totalFiles, quotaBytes }) => {
  const data = {};
  if (usedBytes !== undefined) {
    data.usedStorageBytes = BigInt(usedBytes);
    data.usedStorageGB = Number((Number(usedBytes) / (1024 * 1024 * 1024)).toFixed(3));
  }
  if (totalFiles !== undefined) data.totalFiles = Number(totalFiles);
  if (quotaBytes !== undefined) {
    data.storageQuotaBytes = BigInt(quotaBytes);
    data.storageQuotaGB = Number((Number(quotaBytes) / (1024 * 1024 * 1024)).toFixed(3));
  }

  return await prisma.organisationStorageUsage.upsert({
    where: { organisationId: Number(organisationId) },
    update: data,
    create: {
      organisationId: Number(organisationId),
      storageQuotaBytes: data.storageQuotaBytes || BigInt(10 * 1024 * 1024 * 1024),
      storageQuotaGB: data.storageQuotaGB || 10,
      usedStorageBytes: data.usedStorageBytes || BigInt(0),
      usedStorageGB: data.usedStorageGB || 0,
      totalFiles: data.totalFiles || 0,
    },
  });
};

/* Backups */
const getBackups = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [backups, total] = await Promise.all([
    prisma.storageBackup.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.storageBackup.count(),
  ]);

  return {
    backups,
    total,
    page: Number(page),
    limit: Number(limit),
  };
};

const createBackup = async (backupData) => {
  return await prisma.storageBackup.create({
    data: {
      backupName: backupData.backupName,
      backupType: backupData.backupType || "FULL",
      status: backupData.status || "IN_PROGRESS",
      sizeBytes: backupData.sizeBytes ? BigInt(backupData.sizeBytes) : null,
      sizeGB: backupData.sizeGB ? Number(backupData.sizeGB) : null,
      location: backupData.location || "S3",
      retentionDays: Number(backupData.retentionDays || 30),
    },
  });
};

/* Alerts */
const getStorageAlerts = async () => {
  return await prisma.storageAlert.findMany({
    orderBy: { createdAt: "desc" },
  });
};

module.exports = {
  getStorageConfig,
  updateStorageConfig,
  getOrgStorageUsage,
  getAllOrgStorageUsages,
  updateOrgStorageUsage,
  getBackups,
  createBackup,
  getStorageAlerts,
};
