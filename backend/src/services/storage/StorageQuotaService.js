const prisma = require("../../config/prismaClient");

const DEFAULT_STORAGE_LIMIT_GB = 10;
const BYTES_PER_GB = 1024 * 1024 * 1024;

class StorageQuotaService {
  /**
   * Get an organisation's current storage quota limit in Gigabytes
   */
  static async getOrganisationStorageLimitGB(organisationId) {
    const orgId = Number(organisationId);
    if (!orgId) return DEFAULT_STORAGE_LIMIT_GB;

    try {
      // 1. Check active subscription
      const subscription = await prisma.organisationSubscription.findFirst({
        where: {
          organisationId: String(orgId),
          status: "ACTIVE",
        },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      });

      if (subscription) {
        if (subscription.customStorageLimitGB && subscription.customStorageLimitGB > 0) {
          return subscription.customStorageLimitGB;
        }
        if (subscription.plan?.storageLimitGB && subscription.plan.storageLimitGB > 0) {
          return subscription.plan.storageLimitGB;
        }
      }

      // 2. Check storage config override if present
      const config = await prisma.storageConfig.findFirst({
        where: { isGlobalDefault: true },
      });

      return config?.allocatedQuotaGB || DEFAULT_STORAGE_LIMIT_GB;
    } catch (err) {
      console.error("[StorageQuotaService] Error resolving quota limit:", err.message);
      return DEFAULT_STORAGE_LIMIT_GB;
    }
  }

  /**
   * Calculate exact storage usage for an organisation from PostgreSQL document records
   */
  static async getOrganisationUsage(organisationId) {
    const orgId = Number(organisationId);
    if (!orgId) {
      return {
        usedBytes: 0,
        usedGB: 0,
        limitGB: DEFAULT_STORAGE_LIMIT_GB,
        limitBytes: DEFAULT_STORAGE_LIMIT_GB * BYTES_PER_GB,
        percentageUsed: 0,
        totalDocuments: 0,
        isOverQuota: false,
      };
    }

    try {
      const docs = await prisma.document.findMany({
        where: {
          organisation_id: orgId,
          status: { not: "DELETED" },
        },
        select: { size: true, file_size_bytes: true },
      });

      let usedBytes = 0;
      for (const d of docs) {
        if (d.file_size_bytes && Number(d.file_size_bytes) > 0) {
          usedBytes += Number(d.file_size_bytes);
        } else if (d.size > 500) {
          // Stored as raw bytes in legacy record
          usedBytes += Math.round(d.size);
        } else {
          // Stored as MB float
          usedBytes += Math.round((d.size || 0) * 1024 * 1024);
        }
      }

      const usedGB = Number((usedBytes / BYTES_PER_GB).toFixed(3));
      const limitGB = await this.getOrganisationStorageLimitGB(orgId);
      const limitBytes = limitGB * BYTES_PER_GB;
      const percentageUsed = limitBytes > 0 ? Number(((usedBytes / limitBytes) * 100).toFixed(2)) : 0;
      const isOverQuota = usedBytes > limitBytes;

      return {
        usedBytes,
        usedGB,
        limitGB,
        limitBytes,
        percentageUsed,
        totalDocuments: docs.length,
        isOverQuota,
      };
    } catch (err) {
      console.error("[StorageQuotaService] Error calculating usage:", err.message);
      return {
        usedBytes: 0,
        usedGB: 0,
        limitGB: DEFAULT_STORAGE_LIMIT_GB,
        limitBytes: DEFAULT_STORAGE_LIMIT_GB * BYTES_PER_GB,
        percentageUsed: 0,
        totalDocuments: 0,
        isOverQuota: false,
      };
    }
  }

  /**
   * Validate if an organisation can upload a file of the given byte size
   */
  static async validateUploadQuota(organisationId, fileSizeBytes) {
    const orgId = Number(organisationId);
    const bytesToAdd = Number(fileSizeBytes) || 0;

    const currentUsage = await this.getOrganisationUsage(orgId);
    const projectedBytes = currentUsage.usedBytes + bytesToAdd;

    if (projectedBytes > currentUsage.limitBytes) {
      const remainingBytes = Math.max(0, currentUsage.limitBytes - currentUsage.usedBytes);
      const remainingMB = (remainingBytes / (1024 * 1024)).toFixed(1);
      const limitGB = currentUsage.limitGB;

      return {
        allowed: false,
        error: "Storage limit reached. Please upgrade your plan or free up storage.",
        details: {
          currentUsageGB: currentUsage.usedGB,
          limitGB,
          remainingMB,
          fileSizeMB: (bytesToAdd / (1024 * 1024)).toFixed(2),
        },
      };
    }

    return {
      allowed: true,
      currentUsage,
    };
  }

  /**
   * Sync organisation_storage_usage row in database
   */
  static async syncOrganisationStorageUsageRecord(organisationId) {
    const orgId = Number(organisationId);
    if (!orgId) return null;

    try {
      const usage = await this.getOrganisationUsage(orgId);
      const healthStatus = usage.isOverQuota
        ? "EXCEEDED"
        : usage.percentageUsed >= 90
        ? "CRITICAL"
        : usage.percentageUsed >= 75
        ? "WARNING"
        : "HEALTHY";

      return await prisma.organisationStorageUsage.upsert({
        where: { organisationId: String(orgId) },
        update: {
          totalAllocatedGB: usage.limitGB,
          usedStorageGB: usage.usedGB,
          totalDocuments: usage.totalDocuments,
          healthStatus,
          lastCalculatedAt: new Date(),
        },
        create: {
          organisationId: String(orgId),
          totalAllocatedGB: usage.limitGB,
          usedStorageGB: usage.usedGB,
          totalDocuments: usage.totalDocuments,
          healthStatus,
          lastCalculatedAt: new Date(),
        },
      });
    } catch (err) {
      console.error("[StorageQuotaService] Error syncing usage record:", err.message);
      return null;
    }
  }
}

module.exports = StorageQuotaService;
