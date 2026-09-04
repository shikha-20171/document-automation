const prisma = require("../config/prismaClient");
const AuditLogService = require("./auditLogService");

/**
 * Data Retention Worker Engine
 * Evaluates storage retention policies and enforces document archiving / purging lifecycle
 */
class RetentionWorker {
  /**
   * Run retention policy evaluation sweep
   * @param {Object} options - { organisationId, actorUserId, actorName, req }
   */
  static async runSweep({ organisationId = null, actorUserId = null, actorName = "Retention Worker Engine", req = null } = {}) {
    try {
      const whereClause = { status: "ACTIVE" };
      if (organisationId) {
        whereClause.organisationId = String(organisationId);
      }

      const policies = await prisma.storageRetentionPolicy.findMany({
        where: whereClause,
      });

      const results = [];
      let totalAffected = 0;

      for (const policy of policies) {
        const orgIdNum = policy.organisationId ? Number(policy.organisationId) : (organisationId ? Number(organisationId) : null);
        if (!orgIdNum) continue;

        const cutoffDate = new Date(Date.now() - (policy.retentionDays || 365) * 24 * 60 * 60 * 1000);

        // Find documents older than retention period that are still active
        const expiredDocs = await prisma.document.findMany({
          where: {
            organisation_id: orgIdNum,
            created_at: { lt: cutoffDate },
            status: { notIn: ["PURGED", "ARCHIVED"] },
          },
          select: { id: true, name: true, created_at: true },
          take: 500,
        });

        if (expiredDocs.length > 0) {
          const docIds = expiredDocs.map((d) => d.id);
          const targetStatus = policy.actionOnExpiry === "ARCHIVE" || policy.actionOnExpiry === "MOVE_TO_COLD_STORAGE"
            ? "ARCHIVED"
            : "PURGED";

          await prisma.document.updateMany({
            where: { id: { in: docIds } },
            data: { status: targetStatus },
          });

          totalAffected += expiredDocs.length;

          // Audit log for this policy execution
          AuditLogService.log({
            actorUserId: actorUserId ? String(actorUserId) : null,
            actorName: actorName || "Retention Worker",
            actorRole: "SYSTEM_WORKER",
            organisationId: orgIdNum,
            module: "STORAGE_RETENTION",
            action: `RETENTION_${targetStatus}_ACTION`,
            resourceType: "RETENTION_POLICY",
            resourceId: policy.id,
            resourceName: policy.policyName,
            severity: "INFO",
            status: "SUCCESS",
            metadata: {
              policyId: policy.id,
              policyName: policy.policyName,
              action: policy.actionOnExpiry,
              retentionDays: policy.retentionDays,
              affectedDocumentCount: expiredDocs.length,
              sampleDocumentIds: docIds.slice(0, 10),
            },
            req,
          });

          results.push({
            policyId: policy.id,
            policyName: policy.policyName,
            actionApplied: targetStatus,
            documentsProcessed: expiredDocs.length,
          });
        } else {
          results.push({
            policyId: policy.id,
            policyName: policy.policyName,
            actionApplied: "NONE",
            documentsProcessed: 0,
          });
        }
      }

      return {
        success: true,
        evaluatedPoliciesCount: policies.length,
        totalAffectedDocuments: totalAffected,
        results,
        executedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[RetentionWorker] Sweep error:", error);
      throw error;
    }
  }
}

module.exports = RetentionWorker;
