const prisma = require("../config/prismaClient");
const EntitlementService = require("./entitlementService");

/**
 * Quota & Usage Metering Service
 * Enforces dynamic caps for AI requests, OCR pages, storage GB, and active users.
 */
class QuotaService {
  /**
   * Get billing period start & end date for the active cycle
   */
  static getBillingPeriodWindow() {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { periodStart, periodEnd };
  }

  /**
   * Get live usage statistics for an organisation across all resources
   */
  static async getOrganisationUsage(organisationId) {
    const orgIdStr = String(organisationId);
    const { periodStart } = this.getBillingPeriodWindow();

    const [aiCount, ocrCount, storageUsage, userCount] = await Promise.all([
      // Count AI requests in current month
      prisma.aILog.count({
        where: {
          organisationId: orgIdStr,
          createdAt: { gte: periodStart },
          requestStatus: "SUCCESS",
        },
      }).catch(() => 0),

      // Count OCR jobs in current month
      prisma.oCRJob.count({
        where: {
          organisationId: orgIdStr,
          createdAt: { gte: periodStart },
          status: { in: ["COMPLETED", "SUCCESS"] },
        },
      }).catch(() => 0),

      // Get Storage usage record
      prisma.organisationStorageUsage.findUnique({
        where: { organisationId: orgIdStr },
      }).catch(() => null),

      // Count active users in organisation
      prisma.user.count({
        where: {
          organisation_id: Number(organisationId) || undefined,
          status: "active",
        },
      }).catch(() => 1),
    ]);

    const usedStorageGB = storageUsage ? Number(storageUsage.usedStorageGB) : 0;
    const totalFiles = storageUsage ? storageUsage.totalFiles : 0;

    return {
      aiRequests: aiCount,
      ocrPages: ocrCount,
      usedStorageGB,
      totalFiles,
      activeUsers: userCount,
      periodStart,
    };
  }

  /**
   * Generic quota checker against plan limits
   */
  static async checkQuota(organisationId, quotaKey, requestedAmount = 1) {
    const limit = await EntitlementService.getLimit(organisationId, quotaKey);
    if (limit === null || limit === undefined) return { allowed: true, limit: Infinity, current: 0 };

    const usage = await this.getOrganisationUsage(organisationId);

    let current = 0;
    if (quotaKey === "ai.requests_per_month") current = usage.aiRequests;
    else if (quotaKey === "ocr.pages_per_month") current = usage.ocrPages;
    else if (quotaKey === "storage.gb") current = usage.usedStorageGB;
    else if (quotaKey === "users.max") current = usage.activeUsers;

    const allowed = (current + requestedAmount) <= limit;
    return {
      allowed,
      limit,
      current,
      remaining: Math.max(0, limit - current),
    };
  }

  /**
   * Verify and enforce AI request quota prior to model inference
   */
  static async checkAndIncrementAI(organisationId, userId, estimatedTokens = 150) {
    const hasAI = await EntitlementService.hasFeature(organisationId, "ai.processing");
    if (!hasAI) {
      const err = new Error("AI processing is not enabled in your organisation's subscription plan. Please upgrade to use AI tools.");
      err.statusCode = 403;
      err.code = "FEATURE_NOT_IN_PLAN";
      throw err;
    }

    const { allowed, limit, current } = await this.checkQuota(organisationId, "ai.requests_per_month", 1);
    if (!allowed) {
      const err = new Error(`Monthly AI request quota exceeded (${current}/${limit} requests used). Upgrade your plan to increase limits.`);
      err.statusCode = 403;
      err.code = "QUOTA_EXCEEDED";
      throw err;
    }

    return true;
  }

  /**
   * Verify and enforce OCR pages quota prior to document optical extraction
   */
  static async checkAndIncrementOCR(organisationId, userId, pageCount = 1) {
    const hasOCR = await EntitlementService.hasFeature(organisationId, "ocr.processing");
    if (!hasOCR) {
      const err = new Error("OCR document extraction is not enabled in your organisation's subscription plan.");
      err.statusCode = 403;
      err.code = "FEATURE_NOT_IN_PLAN";
      throw err;
    }

    const { allowed, limit, current } = await this.checkQuota(organisationId, "ocr.pages_per_month", pageCount);
    if (!allowed) {
      const err = new Error(`Monthly OCR quota exceeded (${current}/${limit} pages used). Please upgrade your subscription.`);
      err.statusCode = 403;
      err.code = "QUOTA_EXCEEDED";
      throw err;
    }

    return true;
  }

  /**
   * Verify storage quota before uploading a document
   */
  static async checkStorageQuota(organisationId, newFileSizeBytes = 0) {
    const storageLimitGB = (await EntitlementService.getLimit(organisationId, "storage.gb")) || 10;
    const orgIdStr = String(organisationId);

    const storageUsage = await prisma.organisationStorageUsage.findUnique({
      where: { organisationId: orgIdStr },
    });

    const currentUsedGB = storageUsage ? Number(storageUsage.usedStorageGB) : 0;
    const addedGB = Number((newFileSizeBytes / (1024 * 1024 * 1024)).toFixed(6));

    if ((currentUsedGB + addedGB) > storageLimitGB) {
      const err = new Error(`Storage quota limit reached (${currentUsedGB.toFixed(2)} GB of ${storageLimitGB} GB used). Free up space or upgrade your subscription plan.`);
      err.statusCode = 403;
      err.code = "STORAGE_QUOTA_EXCEEDED";
      throw err;
    }

    return true;
  }

  /**
   * Record uploaded file size into organisation storage usage table
   */
  static async recordStorageAddition(organisationId, fileSizeBytes) {
    const orgIdStr = String(organisationId);
    const addedGB = Number((fileSizeBytes / (1024 * 1024 * 1024)).toFixed(6));

    await prisma.organisationStorageUsage.upsert({
      where: { organisationId: orgIdStr },
      update: {
        usedStorageGB: { increment: addedGB },
        totalFiles: { increment: 1 },
        totalDocuments: { increment: 1 },
        lastUploadedAt: new Date(),
      },
      create: {
        organisationId: orgIdStr,
        totalAllocatedGB: 50,
        usedStorageGB: addedGB,
        totalFiles: 1,
        totalDocuments: 1,
        lastUploadedAt: new Date(),
      },
    }).catch(() => null);
  }

  /**
   * Record removed file size from organisation storage usage table
   */
  static async recordStorageDeletion(organisationId, fileSizeBytes) {
    const orgIdStr = String(organisationId);
    const removedGB = Number((fileSizeBytes / (1024 * 1024 * 1024)).toFixed(6));

    const existing = await prisma.organisationStorageUsage.findUnique({
      where: { organisationId: orgIdStr },
    });

    if (existing) {
      const nextGB = Math.max(0, Number(existing.usedStorageGB) - removedGB);
      const nextFiles = Math.max(0, existing.totalFiles - 1);
      await prisma.organisationStorageUsage.update({
        where: { organisationId: orgIdStr },
        data: {
          usedStorageGB: nextGB,
          totalFiles: nextFiles,
          totalDocuments: Math.max(0, existing.totalDocuments - 1),
        },
      }).catch(() => null);
    }
  }
}

module.exports = QuotaService;
