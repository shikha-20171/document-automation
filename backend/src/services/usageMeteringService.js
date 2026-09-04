const prisma = require("../config/prismaClient");

class UsageMeteringService {
  /**
   * Aggregate live organisation usage and compute entitlement percentages
   */
  static async getOrganisationUsage(organisationId) {
    const orgId = Number(organisationId);

    // 1. Get Plan Limits
    let sub = null;
    try {
      sub = await prisma.organisationSubscription.findFirst({
        where: { organisationId: String(orgId) },
        include: { plan: true },
      });
    } catch {}

    const plan = sub?.plan ? {
      name: sub.plan.planName,
      max_ai_requests: sub.plan.aiCredits || 500000,
      max_storage_gb: sub.plan.storageLimitGB || 100,
      max_users: sub.plan.userLimit || 50,
      max_templates: 500,
      max_workflows: 500,
    } : {
      name: "Enterprise",
      max_ai_requests: 500000,
      max_storage_gb: 100,
      max_users: 50,
      max_templates: 500,
      max_workflows: 500,
    };

    // 2. Count AI Requests
    let aiUsed = 0;
    try {
      aiUsed = await prisma.aILog.count({
        where: { organisationId: orgId },
      });
    } catch {
      aiUsed = 0;
    }

    // 3. Count OCR Extractions
    let ocrUsed = 0;
    try {
      ocrUsed = await prisma.documentExtraction.count({
        where: { organisationId: orgId },
      });
    } catch {
      ocrUsed = 0;
    }

    // 4. Calculate Storage Size
    let storageBytesUsed = 0;
    let documentsCount = 0;
    try {
      const docAgg = await prisma.document.aggregate({
        where: { organisation_id: orgId },
        _sum: { size: true },
        _count: { id: true },
      });
      storageBytesUsed = docAgg._sum.size || 0;
      documentsCount = docAgg._count.id || 0;
    } catch {
      storageBytesUsed = 0;
      documentsCount = 0;
    }

    // 5. Count Workflows
    let workflowsCount = 0;
    try {
      workflowsCount = await prisma.approvalRequest.count({
        where: { organisationId: orgId },
      });
    } catch {
      workflowsCount = 0;
    }

    // 6. Count E-Sign Envelopes
    let esignCount = 0;
    try {
      esignCount = await prisma.signatureEnvelope.count({
        where: { organisationId: orgId },
      });
    } catch {
      esignCount = 0;
    }

    // 7. Count Bulk Jobs
    let bulkRecordsCount = 0;
    try {
      const bulkAgg = await prisma.bulkGenerationJob.aggregate({
        where: { organisationId: orgId },
        _sum: { processedRecords: true },
      });
      bulkRecordsCount = bulkAgg._sum.processedRecords || 0;
    } catch {
      bulkRecordsCount = 0;
    }

    // 8. Count Active Users
    let usersCount = 0;
    try {
      usersCount = await prisma.user.count({
        where: { organisation_id: orgId },
      });
    } catch {
      usersCount = 1;
    }

    const maxStorageBytes = (plan.max_storage_gb || 100) * 1024 * 1024 * 1024;
    const maxAi = plan.max_ai_requests || 500000;
    const maxOcr = 50000;
    const maxDocs = 10000;

    return {
      planName: plan.name,
      metrics: {
        aiRequests: {
          used: aiUsed,
          limit: maxAi,
          remaining: Math.max(0, maxAi - aiUsed),
          percentage: Number(((aiUsed / maxAi) * 100).toFixed(1)),
        },
        ocrPages: {
          used: ocrUsed,
          limit: maxOcr,
          remaining: Math.max(0, maxOcr - ocrUsed),
          percentage: Number(((ocrUsed / maxOcr) * 100).toFixed(1)),
        },
        storage: {
          usedBytes: storageBytesUsed,
          usedMb: Number((storageBytesUsed / (1024 * 1024)).toFixed(2)),
          limitGb: plan.max_storage_gb || 100,
          remainingBytes: Math.max(0, maxStorageBytes - storageBytesUsed),
          percentage: Number(((storageBytesUsed / maxStorageBytes) * 100).toFixed(2)),
        },
        documents: {
          used: documentsCount,
          limit: maxDocs,
          remaining: Math.max(0, maxDocs - documentsCount),
          percentage: Number(((documentsCount / maxDocs) * 100).toFixed(1)),
        },
        users: {
          used: usersCount,
          limit: plan.max_users || 50,
          remaining: Math.max(0, (plan.max_users || 50) - usersCount),
          percentage: Number(((usersCount / (plan.max_users || 50)) * 100).toFixed(1)),
        },
        workflows: {
          used: workflowsCount,
          limit: plan.max_workflows || 500,
        },
        eSignEnvelopes: {
          used: esignCount,
          limit: 1000,
        },
        bulkRecords: {
          used: bulkRecordsCount,
        },
      },
    };
  }
}

module.exports = UsageMeteringService;
