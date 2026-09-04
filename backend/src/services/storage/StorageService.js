const prisma = require("../../config/prismaClient");
const StorageSecurityService = require("./StorageSecurityService");
const S3StorageProvider = require("./S3StorageProvider");
const StorageQuotaService = require("./StorageQuotaService");
const AuditLogService = require("../auditLogService");

class StorageService {
  /**
   * Get active decrypted storage configuration for internal service execution
   */
  static async getInternalConfig() {
    // 1. Check storageConfig table
    const config = await prisma.storageConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    }).catch(() => null);

    // 2. Check platformIntegration table
    const integration = await prisma.platformIntegration.findFirst({
      where: { provider: "AWS_S3" },
    }).catch(() => null);

    let accessKeyId = "";
    let secretAccessKey = "";
    let kmsKeyId = null;

    if (config?.accessKeyIdEncrypted) {
      accessKeyId = StorageSecurityService.decrypt(config.accessKeyIdEncrypted) || "";
    }
    if (config?.secretAccessKeyEncrypted) {
      secretAccessKey = StorageSecurityService.decrypt(config.secretAccessKeyEncrypted) || "";
    }
    if (config?.kmsKeyIdEncrypted) {
      kmsKeyId = StorageSecurityService.decrypt(config.kmsKeyIdEncrypted);
    }

    if (!accessKeyId && integration?.clientIdEncrypted) {
      accessKeyId = StorageSecurityService.decrypt(integration.clientIdEncrypted) || "";
    }
    if (!secretAccessKey && integration?.clientSecretEncrypted) {
      secretAccessKey = StorageSecurityService.decrypt(integration.clientSecretEncrypted) || "";
    }

    // Fallback to environment variables if not yet configured in DB
    if (!accessKeyId) accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
    if (!secretAccessKey) secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";

    const settings = integration?.settings || {};
    const bucketName = config?.bucketName || settings.bucketName || process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || "docucore-enterprise-vault";
    const region = config?.bucketRegion || settings.region || process.env.AWS_REGION || "ap-south-1";
    const basePrefix = config?.basePrefix || "";
    const encryptionType = config?.encryptionType || "SSE-S3";
    const connectionStatus = config?.connectionStatus || (secretAccessKey ? "CONNECTED" : "NOT_CONFIGURED");

    return {
      bucketName,
      region,
      basePrefix,
      accessKeyId,
      secretAccessKey,
      kmsKeyId,
      encryptionType,
      connectionStatus,
      lastTestedAt: config?.lastTestedAt || null,
      lastConnectionError: config?.lastConnectionError || null,
      endpoint: settings.endpoint || null,
    };
  }

  /**
   * Get safe masked storage configuration for Super Admin UI presentation
   */
  static async getSafeStorageConfig() {
    const internal = await this.getInternalConfig();
    const hasCredentials = Boolean(internal.accessKeyId && internal.secretAccessKey);

    return {
      provider: "AWS_S3",
      bucketName: internal.bucketName,
      region: internal.region,
      basePrefix: internal.basePrefix,
      accessKeyIdMasked: internal.accessKeyId ? StorageSecurityService.maskSecret(internal.accessKeyId, 4) : "",
      secretAccessKeyMasked: internal.secretAccessKey ? "••••••••••••••••" : "",
      hasCredentials,
      encryptionType: internal.encryptionType || "SSE-S3",
      kmsKeyIdMasked: internal.kmsKeyId ? StorageSecurityService.maskSecret(internal.kmsKeyId, 4) : "",
      connectionStatus: hasCredentials ? internal.connectionStatus : "NOT_CONFIGURED",
      lastTestedAt: internal.lastTestedAt,
      lastConnectionError: internal.lastConnectionError,
    };
  }

  /**
   * Instantiate an authorized S3Client with decrypted credentials
   */
  static async getS3Client() {
    const internal = await this.getInternalConfig();
    if (!internal.accessKeyId || !internal.secretAccessKey) {
      throw new Error("AWS S3 credentials are not configured. Please configure AWS S3 in Super Admin Storage Management.");
    }
    return S3StorageProvider.createClient({
      region: internal.region,
      accessKeyId: internal.accessKeyId,
      secretAccessKey: internal.secretAccessKey,
      endpoint: internal.endpoint,
    });
  }

  /**
   * Update AWS S3 configuration from Super Admin UI
   */
  static async updateStorageConfig(data, actor = {}) {
    const bucketName = data.bucketName || "docucore-enterprise-vault";
    const region = data.region || "ap-south-1";
    const basePrefix = data.basePrefix || "";
    const encryptionType = data.encryptionType || "SSE-S3";
    const kmsKeyId = data.kmsKeyId || null;

    let accessKeyId = data.accessKeyId;
    let secretAccessKey = data.secretAccessKey;

    // If existing credentials should be kept
    if (!accessKeyId || accessKeyId.includes("••")) {
      const current = await this.getInternalConfig();
      accessKeyId = current.accessKeyId;
    }
    if (!secretAccessKey || secretAccessKey.includes("••")) {
      const current = await this.getInternalConfig();
      secretAccessKey = current.secretAccessKey;
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS Access Key ID and Secret Access Key are required.");
    }

    // 1. Perform live connection test before persisting
    const testRes = await S3StorageProvider.testConnection({
      region,
      bucketName,
      accessKeyId,
      secretAccessKey,
      endpoint: data.endpoint || null,
    });

    if (!testRes.success) {
      await AuditLogService.log({
        action: "STORAGE_CONFIGURATION_FAILED",
        status: "FAILED",
        actorName: actor.email || "Super Admin",
        actorRole: "SUPER_ADMIN",
        module: "SECURITY",
        metadata: {
          provider: "AWS_S3",
          bucket: bucketName,
          region,
          error: testRes.error,
        },
      }).catch(() => null);

      const err = new Error(testRes.error);
      err.status = testRes.status;
      throw err;
    }

    // 2. Encrypt credentials with AES-256-GCM
    const accessKeyIdEncrypted = StorageSecurityService.encrypt(accessKeyId);
    const secretAccessKeyEncrypted = StorageSecurityService.encrypt(secretAccessKey);
    const kmsKeyIdEncrypted = kmsKeyId ? StorageSecurityService.encrypt(kmsKeyId) : null;

    // 3. Persist to storage_configs
    const existingConfig = await prisma.storageConfig.findFirst({ orderBy: { updatedAt: "desc" } }).catch(() => null);
    if (existingConfig) {
      await prisma.storageConfig.update({
        where: { id: existingConfig.id },
        data: {
          bucketName,
          bucketRegion: region,
          basePrefix,
          accessKeyIdEncrypted,
          secretAccessKeyEncrypted,
          kmsKeyIdEncrypted,
          encryptionType,
          connectionStatus: "CONNECTED",
          lastTestedAt: new Date(),
          lastConnectionError: null,
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.storageConfig.create({
        data: {
          bucketName,
          bucketRegion: region,
          basePrefix,
          accessKeyIdEncrypted,
          secretAccessKeyEncrypted,
          kmsKeyIdEncrypted,
          encryptionType,
          connectionStatus: "CONNECTED",
          lastTestedAt: new Date(),
          isGlobalDefault: true,
          status: "ACTIVE",
        },
      });
    }

    // 4. Also synchronize with platform_integrations
    await prisma.platformIntegration.upsert({
      where: { provider: "AWS_S3" },
      update: {
        name: "AWS S3 Enterprise Cloud Storage",
        isEnabled: true,
        status: "ACTIVE",
        healthStatus: "HEALTHY",
        clientIdEncrypted: accessKeyIdEncrypted,
        clientSecretEncrypted: secretAccessKeyEncrypted,
        settings: {
          bucketName,
          region,
          basePrefix,
          encryptionType,
        },
      },
      create: {
        provider: "AWS_S3",
        name: "AWS S3 Enterprise Cloud Storage",
        category: "STORAGE",
        isEnabled: true,
        status: "ACTIVE",
        healthStatus: "HEALTHY",
        clientIdEncrypted: accessKeyIdEncrypted,
        clientSecretEncrypted: secretAccessKeyEncrypted,
        settings: {
          bucketName,
          region,
          basePrefix,
          encryptionType,
        },
      },
    }).catch(() => null);

    // 5. Audit log
    await AuditLogService.log({
      action: "AWS_STORAGE_CONFIGURED",
      status: "SUCCESS",
      actorName: actor.email || "Super Admin",
      actorRole: "SUPER_ADMIN",
      module: "SECURITY",
      metadata: {
        provider: "AWS_S3",
        bucket: bucketName,
        region,
        encryptionType,
      },
    }).catch(() => null);

    return await this.getSafeStorageConfig();
  }

  /**
   * Execute real live AWS S3 connection test
   */
  static async testConnection(data = {}, actor = {}) {
    let accessKeyId = data.accessKeyId;
    let secretAccessKey = data.secretAccessKey;
    let region = data.region;
    let bucketName = data.bucketName;

    // If using stored configuration
    if (!accessKeyId || accessKeyId.includes("••")) {
      const current = await this.getInternalConfig();
      accessKeyId = current.accessKeyId;
      secretAccessKey = current.secretAccessKey;
      region = region || current.region;
      bucketName = bucketName || current.bucketName;
    }

    if (!accessKeyId || !secretAccessKey) {
      return {
        success: false,
        status: "NOT_CONFIGURED",
        error: "AWS S3 credentials have not been configured yet.",
      };
    }

    const testRes = await S3StorageProvider.testConnection({
      region,
      bucketName,
      accessKeyId,
      secretAccessKey,
      endpoint: data.endpoint || null,
    });

    // Update last test timestamp in DB
    const config = await prisma.storageConfig.findFirst({ orderBy: { updatedAt: "desc" } }).catch(() => null);
    if (config) {
      await prisma.storageConfig.update({
        where: { id: config.id },
        data: {
          lastTestedAt: new Date(),
          connectionStatus: testRes.success ? "CONNECTED" : "CONNECTION_ERROR",
          lastConnectionError: testRes.success ? null : testRes.error,
        },
      }).catch(() => null);
    }

    await AuditLogService.log({
      action: "AWS_STORAGE_CONNECTION_TESTED",
      status: testRes.success ? "SUCCESS" : "FAILED",
      actorName: actor.email || "Super Admin",
      actorRole: "SUPER_ADMIN",
      module: "SECURITY",
      metadata: {
        provider: "AWS_S3",
        bucket: bucketName,
        region,
        latencyMs: testRes.latencyMs,
        error: testRes.error || null,
      },
    }).catch(() => null);

    return testRes;
  }

  /**
   * Disconnect AWS S3 storage safely
   */
  static async disconnect(actor = {}) {
    const config = await prisma.storageConfig.findFirst({ orderBy: { updatedAt: "desc" } }).catch(() => null);
    if (config) {
      await prisma.storageConfig.update({
        where: { id: config.id },
        data: {
          connectionStatus: "DISABLED",
          status: "DISABLED",
        },
      });
    }

    await prisma.platformIntegration.updateMany({
      where: { provider: "AWS_S3" },
      data: {
        isEnabled: false,
        status: "DISABLED",
        healthStatus: "DISCONNECTED",
      },
    }).catch(() => null);

    await AuditLogService.log({
      action: "AWS_STORAGE_DISCONNECTED",
      status: "SUCCESS",
      actorName: actor.email || "Super Admin",
      actorRole: "SUPER_ADMIN",
      module: "SECURITY",
      metadata: {
        message: "AWS S3 storage disabled by platform administrator.",
      },
    }).catch(() => null);

    return {
      success: true,
      message: "AWS S3 storage disconnected successfully. Existing files remain safe in your S3 bucket.",
    };
  }

  /**
   * Platform-wide storage statistics
   */
  static async getPlatformStorageStats() {
    const totalOrganisations = await prisma.organisation.count();
    const docAgg = await prisma.document.aggregate({
      where: { status: { not: "DELETED" } },
      _sum: { size: true },
      _count: { id: true },
    });

    const usedMB = docAgg._sum.size || 0;
    const usedBytes = Math.round(usedMB * 1024 * 1024);
    const usedGB = Number((usedBytes / (1024 * 1024 * 1024)).toFixed(3));
    const allocatedGB = (totalOrganisations || 1) * 100;
    const utilizationPct = allocatedGB > 0 ? Number(((usedGB / allocatedGB) * 100).toFixed(2)) : 0;

    const safeConfig = await this.getSafeStorageConfig();

    return {
      totalOrganizations: totalOrganisations,
      totalAllocatedStorage: `${allocatedGB} GB`,
      allocatedGB,
      usedStorage: `${usedGB} GB`,
      usedGB,
      usedStorageBytes: usedBytes,
      totalDocuments: docAgg._count.id || 0,
      storageUtilization: `${utilizationPct}%`,
      utilizationPct,
      provider: `AWS S3 (${safeConfig.bucketName})`,
      connectionStatus: safeConfig.connectionStatus,
      region: safeConfig.region,
      bucket: safeConfig.bucketName,
      lastTestedAt: safeConfig.lastTestedAt,
    };
  }

  /**
   * Upload Document to AWS S3 with Subscription Quota Verification
   */
  static async uploadDocument({
    organisationId,
    userId = null,
    uploadedBy = "User",
    fileBuffer,
    fileName,
    originalName = null,
    mimeType = "application/pdf",
    folder = null,
    departmentId = null,
    teamId = null,
    actor = {},
  }) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error("No file buffer provided for upload.");
    }

    const orgId = Number(organisationId);
    const fileSizeBytes = fileBuffer.length;
    const sizeInMB = Number((fileSizeBytes / (1024 * 1024)).toFixed(3));
    const safeDocName = StorageSecurityService.sanitizeFilename(fileName || originalName || "document.pdf");
    const safeOrigName = originalName || safeDocName;

    // 1. Subscription Quota Verification
    const quotaCheck = await StorageQuotaService.validateUploadQuota(orgId, fileSizeBytes);
    if (!quotaCheck.allowed) {
      await AuditLogService.log({
        action: "STORAGE_QUOTA_EXCEEDED",
        status: "BLOCKED",
        organisationId: String(orgId),
        actorName: actor.email || uploadedBy,
        actorRole: "ORG_ADMIN",
        module: "SECURITY",
        metadata: quotaCheck.details,
      }).catch(() => null);

      const quotaErr = new Error(quotaCheck.error);
      quotaErr.statusCode = 403;
      quotaErr.details = quotaCheck.details;
      throw quotaErr;
    }

    // 2. Resolve S3 storage provider and credentials
    const internalConfig = await this.getInternalConfig();
    const client = await this.getS3Client();

    // 3. Generate provisional document record ID
    const provisionalDoc = await prisma.document.create({
      data: {
        organisation_id: orgId,
        department_id: departmentId ? Number(departmentId) : null,
        team_id: teamId ? Number(teamId) : null,
        created_by_user_id: userId ? Number(userId) : null,
        name: safeDocName,
        original_name: safeOrigName,
        type: mimeType,
        mime_type: mimeType,
        size: sizeInMB,
        file_size_bytes: BigInt(fileSizeBytes),
        storage_provider: "aws_s3",
        s3_bucket: internalConfig.bucketName,
        folder: folder || "General",
        status: "PROCESSING",
        uploaded_by: uploadedBy,
      },
    });

    // 4. Build tenant-isolated S3 key: {orgId}/documents/{docId}/original/{fileName}
    const s3Key = StorageSecurityService.buildObjectKey({
      organisationId: orgId,
      documentId: provisionalDoc.id,
      category: "original",
      fileName: safeDocName,
      basePrefix: internalConfig.basePrefix,
    });

    // 5. Upload buffer to S3
    try {
      await S3StorageProvider.putObject({
        client,
        bucketName: internalConfig.bucketName,
        key: s3Key,
        buffer: fileBuffer,
        mimeType,
        sseType: internalConfig.encryptionType,
        kmsKeyId: internalConfig.kmsKeyId,
      });
    } catch (s3Err) {
      // Clean up provisional document record if S3 upload failed
      await prisma.document.delete({ where: { id: provisionalDoc.id } }).catch(() => null);
      throw new Error(`AWS S3 Upload Failed: ${s3Err.message}`);
    }

    // 6. Update document with finalized S3 key and ACTIVE status
    const finalizedDoc = await prisma.document.update({
      where: { id: provisionalDoc.id },
      data: {
        s3_key: s3Key,
        status: "ACTIVE",
      },
    });

    // 7. Synchronize organisation storage usage
    await StorageQuotaService.syncOrganisationStorageUsageRecord(orgId);

    // 8. Audit log
    await AuditLogService.log({
      action: "DOCUMENT_UPLOADED",
      status: "SUCCESS",
      organisationId: String(orgId),
      actorName: actor.email || uploadedBy,
      actorRole: "ORG_ADMIN",
      module: "PLATFORM",
      metadata: {
        documentId: finalizedDoc.id,
        fileName: safeDocName,
        sizeBytes: fileSizeBytes,
        s3Bucket: internalConfig.bucketName,
        s3Key,
      },
    }).catch(() => null);

    return finalizedDoc;
  }

  /**
   * Generate secure presigned download URL after strict authorization verification
   */
  static async generateDownloadUrl({ documentId, organisationId, userId = null, expiresInSeconds = 900 }) {
    const docId = Number(documentId);
    const orgId = Number(organisationId);

    const doc = await prisma.document.findUnique({
      where: { id: docId },
    });

    if (!doc || doc.status === "DELETED") {
      throw new Error("Document not found.");
    }

    if (doc.organisation_id !== orgId) {
      throw new Error("Unauthorized: Document does not belong to your organisation.");
    }

    if (!doc.s3_key) {
      throw new Error("Document binary is not stored in AWS S3.");
    }

    // Ensure key starts with organisation prefix (security boundary check)
    if (!StorageSecurityService.isKeyOwnedByOrg(doc.s3_key, orgId)) {
      throw new Error("Tenant isolation violation: S3 object key does not match organisation ID.");
    }

    const internalConfig = await this.getInternalConfig();
    const client = await this.getS3Client();

    const presignedUrl = await S3StorageProvider.getPresignedDownloadUrl({
      client,
      bucketName: doc.s3_bucket || internalConfig.bucketName,
      key: doc.s3_key,
      expiresInSeconds,
      responseContentDisposition: `inline; filename="${doc.name || "document.pdf"}"`,
    });

    return {
      documentId: doc.id,
      name: doc.name,
      mimeType: doc.mime_type || doc.type,
      sizeBytes: Number(doc.file_size_bytes || (doc.size * 1024 * 1024)),
      downloadUrl: presignedUrl,
      expiresInSeconds,
    };
  }

  /**
   * Delete Document from AWS S3 and PostgreSQL with Full State Safety & Idempotency
   */
  static async deleteDocument({ documentId, organisationId, actor = {} }) {
    const docId = Number(documentId);
    const orgId = Number(organisationId);

    const doc = await prisma.document.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      throw new Error("Document not found.");
    }

    if (doc.organisation_id !== orgId) {
      throw new Error("Unauthorized: Document does not belong to your organisation.");
    }

    // 1. Idempotency Check: if already DELETED, do not double-decrement or throw error
    if (doc.status === "DELETED") {
      return {
        success: true,
        alreadyDeleted: true,
        message: "Document has already been deleted.",
        documentId: docId,
      };
    }

    // 2. Mark DELETE_PENDING state in PostgreSQL
    await prisma.document.update({
      where: { id: docId },
      data: { status: "DELETE_PENDING" },
    }).catch(() => null);

    // 3. Attempt S3 object deletion
    let s3Success = false;
    let s3Error = null;

    if (doc.s3_key) {
      try {
        const internalConfig = await this.getInternalConfig();
        const client = await this.getS3Client();
        await S3StorageProvider.deleteObject({
          client,
          bucketName: doc.s3_bucket || internalConfig.bucketName,
          key: doc.s3_key,
        });
        s3Success = true;
      } catch (err) {
        s3Success = false;
        s3Error = err;
      }
    } else {
      // Document had no S3 key attached (e.g. metadata-only legacy entry)
      s3Success = true;
    }

    // 4. Handle S3 deletion failure
    if (!s3Success) {
      // Revert/mark document as DELETE_FAILED to preserve state and retry capability
      await prisma.document.update({
        where: { id: docId },
        data: { status: "DELETE_FAILED" },
      }).catch(() => null);

      // Audit log the failure
      await AuditLogService.log({
        action: "DOCUMENT_DELETE_FAILED",
        status: "FAILED",
        organisationId: String(orgId),
        actorName: actor.email || "User",
        actorRole: "ORG_ADMIN",
        module: "PLATFORM",
        metadata: {
          documentId: docId,
          fileName: doc.name,
          s3Key: doc.s3_key,
          error: s3Error?.message || "AWS S3 deletion failed",
        },
      }).catch(() => null);

      const deleteErr = new Error(`Failed to delete document binary from AWS S3: ${s3Error?.message || "Storage error"}. Database state preserved as DELETE_FAILED.`);
      deleteErr.status = "DELETE_FAILED";
      deleteErr.documentId = docId;
      throw deleteErr;
    }

    // 5. S3 deletion succeeded: mark DELETED in PostgreSQL
    await prisma.document.update({
      where: { id: docId },
      data: {
        status: "DELETED",
      },
    });

    // 6. Synchronize organisation storage usage (decrement)
    await StorageQuotaService.syncOrganisationStorageUsageRecord(orgId);

    // 7. Audit log success
    await AuditLogService.log({
      action: "DOCUMENT_DELETED",
      status: "SUCCESS",
      organisationId: String(orgId),
      actorName: actor.email || "User",
      actorRole: "ORG_ADMIN",
      module: "PLATFORM",
      metadata: {
        documentId: docId,
        fileName: doc.name,
        s3Key: doc.s3_key,
      },
    }).catch(() => null);

    return {
      success: true,
      message: "Document deleted successfully from AWS S3 storage and database.",
      documentId: docId,
    };
  }
}

module.exports = StorageService;
