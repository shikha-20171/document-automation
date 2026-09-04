const prisma = require("../../config/prismaClient");
const StorageService = require("./StorageService");
const StorageQuotaService = require("./StorageQuotaService");
const { ListObjectsV2Command, HeadObjectCommand } = require("@aws-sdk/client-s3");

class StorageReconciliationService {
  /**
   * Reconcile storage usage for an organisation non-destructively
   * Compares calculated active document bytes vs organisation_storage_usage row
   */
  static async reconcileOrganisationUsage(organisationId, options = { dryRun: true }) {
    const orgId = Number(organisationId);
    if (!orgId) return null;

    const actualUsage = await StorageQuotaService.getOrganisationUsage(orgId);

    const storedUsageRecord = await prisma.organisationStorageUsage.findUnique({
      where: { organisationId: String(orgId) },
    }).catch(() => null);

    const storedUsedGB = storedUsageRecord?.usedStorageGB ? Number(storedUsageRecord.usedStorageGB) : 0;
    const differenceGB = Number(Math.abs(actualUsage.usedGB - storedUsedGB).toFixed(3));
    const isDesynchronized = differenceGB > 0.001;

    let fixed = false;
    if (isDesynchronized && !options.dryRun) {
      await StorageQuotaService.syncOrganisationStorageUsageRecord(orgId);
      fixed = true;
    }

    return {
      organisationId: orgId,
      actualUsedGB: actualUsage.usedGB,
      actualUsedBytes: actualUsage.usedBytes,
      actualDocumentsCount: actualUsage.totalDocuments,
      storedUsedGB,
      isDesynchronized,
      differenceGB,
      fixed,
    };
  }

  /**
   * Check for PostgreSQL documents whose S3 objects are missing (Broken References)
   */
  static async findBrokenDocumentReferences(organisationId = null) {
    const where = {
      status: { in: ["ACTIVE", "PROCESSING"] },
      s3_key: { not: null },
    };
    if (organisationId) {
      where.organisation_id = Number(organisationId);
    }

    const docs = await prisma.document.findMany({
      where,
      select: {
        id: true,
        organisation_id: true,
        name: true,
        s3_bucket: true,
        s3_key: true,
        status: true,
        size: true,
      },
    });

    let client = null;
    let internalConfig = null;
    try {
      internalConfig = await StorageService.getInternalConfig();
      client = await StorageService.getS3Client();
    } catch (err) {
      return {
        success: false,
        error: "AWS S3 client not configured or unreachable for reconciliation.",
        brokenReferences: [],
      };
    }

    const broken = [];
    for (const doc of docs) {
      try {
        await client.send(new HeadObjectCommand({
          Bucket: doc.s3_bucket || internalConfig.bucketName,
          Key: doc.s3_key,
        }));
      } catch (err) {
        if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
          broken.push({
            documentId: doc.id,
            organisationId: doc.organisation_id,
            name: doc.name,
            s3Key: doc.s3_key,
            issue: "S3_OBJECT_NOT_FOUND",
          });
        }
      }
    }

    return {
      success: true,
      totalChecked: docs.length,
      brokenCount: broken.length,
      brokenReferences: broken,
    };
  }

  /**
   * Scan for S3 objects that have no active PostgreSQL record (Orphaned S3 Objects)
   */
  static async findOrphanedS3Objects(organisationId = null, maxObjects = 500) {
    let client = null;
    let internalConfig = null;
    try {
      internalConfig = await StorageService.getInternalConfig();
      client = await StorageService.getS3Client();
    } catch (err) {
      return {
        success: false,
        error: "AWS S3 client not configured or unreachable.",
        orphanedObjects: [],
      };
    }

    const prefix = organisationId ? `${organisationId}/` : "";
    const listCmd = new ListObjectsV2Command({
      Bucket: internalConfig.bucketName,
      Prefix: prefix,
      MaxKeys: maxObjects,
    });

    const listRes = await client.send(listCmd);
    const objects = listRes.Contents || [];

    const activeDocs = await prisma.document.findMany({
      where: {
        status: { in: ["ACTIVE", "PROCESSING"] },
      },
      select: { s3_key: true },
    });

    const activeKeySet = new Set(activeDocs.map((d) => d.s3_key).filter(Boolean));

    const orphans = [];
    for (const obj of objects) {
      // Ignore system test markers and folder keys
      if (obj.Key.startsWith("_docucore_system/") || obj.Key.endsWith("/")) continue;

      if (!activeKeySet.has(obj.Key)) {
        orphans.push({
          key: obj.Key,
          sizeBytes: obj.Size,
          lastModified: obj.LastModified,
          issue: "NO_ACTIVE_DATABASE_RECORD",
        });
      }
    }

    return {
      success: true,
      totalScanned: objects.length,
      orphansCount: orphans.length,
      orphanedObjects: orphans,
    };
  }

  /**
   * Run a full non-destructive storage reconciliation audit
   */
  static async runFullStorageAudit() {
    const orgs = await prisma.organisation.findMany({ select: { id: true, name: true } });
    const usageAudits = [];

    for (const org of orgs) {
      const u = await this.reconcileOrganisationUsage(org.id, { dryRun: true });
      if (u) {
        usageAudits.push({ orgName: org.name, ...u });
      }
    }

    return {
      auditedAt: new Date().toISOString(),
      organizationsChecked: orgs.length,
      desynchronizedUsages: usageAudits.filter((u) => u.isDesynchronized),
    };
  }
}

module.exports = StorageReconciliationService;
