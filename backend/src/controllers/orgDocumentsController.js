const prisma = require("../config/prismaClient");
const StorageService = require("../services/storage/StorageService");
const StorageQuotaService = require("../services/storage/StorageQuotaService");

const getAuthContext = (req) => {
  const orgId = req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || 1;
  const userId = req.user?.id || req.user?.userId || 1;
  const userName = req.user?.name || req.user?.email || "Organisation Admin";
  return {
    organisationId: Number(orgId) || 1,
    userId: Number(userId) || 1,
    userName,
    role: req.user?.role || "ORGANISATION_ADMIN",
  };
};

/**
 * List all documents for the organization
 * GET /api/org-admin/documents
 */
const getOrgDocuments = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const { category, type, search, status } = req.query;

    const where = {
      organisation_id: organisationId,
      status: { not: "DELETED" },
    };

    if (type && type !== "All") {
      where.type = { contains: String(type), mode: "insensitive" };
    }

    if (search && search.trim()) {
      where.OR = [
        { name: { contains: String(search).trim(), mode: "insensitive" } },
        { uploaded_by: { contains: String(search).trim(), mode: "insensitive" } },
      ];
    }

    const [docs, totalCount, approvalsCount, quotaUsage] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { created_at: "desc" },
        include: {
          approvalRequests: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { id: true, status: true },
          },
        },
      }).catch(() => []),
      prisma.document.count({ where: { organisation_id: organisationId, status: { not: "DELETED" } } }).catch(() => 0),
      prisma.approvalRequest.count({
        where: { organisationId, status: "PENDING" },
      }).catch(() => 0),
      StorageQuotaService.getOrganisationUsage(organisationId),
    ]);

    const formatted = docs.map((d) => {
      const ext = d.name.split(".").pop()?.toUpperCase() || "PDF";
      const sizeBytes = Number(d.file_size_bytes || (d.size * 1024 * 1024));
      const mbSize = sizeBytes > 0 ? (sizeBytes / (1024 * 1024)).toFixed(2) + " MB" : `${d.size || 0.1} MB`;
      const approval = d.approvalRequests?.[0];

      let docStatus = "Active";
      if (approval?.status === "PENDING") docStatus = "Pending Review";
      else if (approval?.status === "APPROVED") docStatus = "Approved";
      else if (approval?.status === "REJECTED") docStatus = "Rejected";

      let categoryTag = d.type || "General";
      if (categoryTag.includes("Offer") || categoryTag.includes("Employee")) categoryTag = "HR";
      else if (categoryTag.includes("NDA") || categoryTag.includes("Agreement") || categoryTag.includes("Contract")) categoryTag = "Contracts";
      else if (categoryTag.includes("Invoice") || categoryTag.includes("Tax")) categoryTag = "Invoices";
      else if (categoryTag.includes("Policy")) categoryTag = "Policies";

      return {
        id: String(d.id),
        name: d.name,
        originalName: d.original_name || d.name,
        type: d.type || "Document",
        mimeType: d.mime_type || "application/pdf",
        status: docStatus,
        owner: d.uploaded_by || "Administrator",
        storageProvider: d.storage_provider || "aws_s3",
        hasS3Object: Boolean(d.s3_key),
        lastModified: new Date(d.updated_at || d.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        tags: [categoryTag, ext].filter(Boolean),
        size: mbSize,
        sizeBytes,
        createdAt: d.created_at,
      };
    });

    res.json({
      success: true,
      data: formatted,
      stats: {
        totalDocuments: totalCount,
        usedStorageGB: `${quotaUsage.usedGB} GB`,
        limitStorageGB: `${quotaUsage.limitGB} GB`,
        percentageUsed: `${quotaUsage.percentageUsed}%`,
        isOverQuota: quotaUsage.isOverQuota,
        pendingApprovals: approvalsCount,
        activeDocuments: formatted.filter((d) => d.status === "Active" || d.status === "Approved").length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Upload document directly to AWS S3 storage
 * POST /api/org-admin/documents/upload
 */
const uploadOrgDocument = async (req, res, next) => {
  try {
    const context = getAuthContext(req);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file provided in form-data ('file')." });
    }

    const { folder, departmentId, teamId, name } = req.body;

    const doc = await StorageService.uploadDocument({
      organisationId: context.organisationId,
      userId: context.userId,
      uploadedBy: context.userName,
      fileBuffer: file.buffer,
      fileName: name || file.originalname,
      originalName: file.originalname,
      mimeType: file.mimetype,
      folder: folder || "General",
      departmentId,
      teamId,
      actor: { email: req.user?.email || context.userName, ipAddress: req.ip },
    });

    res.status(201).json({
      success: true,
      message: `Document "${doc.name}" uploaded successfully to AWS S3!`,
      data: {
        id: String(doc.id),
        name: doc.name,
        type: doc.type,
        mimeType: doc.mime_type,
        size: `${(doc.size).toFixed(2)} MB`,
        storageProvider: doc.storage_provider,
        uploadedBy: doc.uploaded_by,
        createdAt: doc.created_at,
      },
    });
  } catch (err) {
    if (err.statusCode === 403) {
      return res.status(403).json({
        success: false,
        status: "QUOTA_EXCEEDED",
        message: err.message,
        details: err.details,
      });
    }
    next(err);
  }
};

/**
 * Create a new document in the repository (JSON payload)
 * POST /api/org-admin/documents
 */
const createOrgDocument = async (req, res, next) => {
  try {
    const context = getAuthContext(req);
    const { name, title, type = "General Document", content, folder } = req.body;
    const rawName = name || title;

    if (!rawName) {
      return res.status(400).json({ success: false, message: "Document name is required." });
    }

    const docName = rawName.endsWith(".pdf") || rawName.endsWith(".docx") || rawName.endsWith(".txt")
      ? rawName
      : `${rawName}.pdf`;

    const fileContent = content ? String(content) : `DocuCore Document Content: ${docName}`;
    const fileBuffer = Buffer.from(fileContent, "utf8");

    const doc = await StorageService.uploadDocument({
      organisationId: context.organisationId,
      userId: context.userId,
      uploadedBy: context.userName,
      fileBuffer,
      fileName: docName,
      originalName: docName,
      mimeType: "application/pdf",
      folder: folder || "General",
      actor: { email: req.user?.email || context.userName, ipAddress: req.ip },
    });

    res.status(201).json({
      success: true,
      message: `Document "${docName}" successfully created and saved to AWS S3!`,
      data: {
        id: String(doc.id),
        name: doc.name,
        type: doc.type,
        size: `${doc.size.toFixed(2)} MB`,
        owner: doc.uploaded_by,
        createdAt: doc.created_at,
      },
    });
  } catch (err) {
    if (err.statusCode === 403) {
      return res.status(403).json({
        success: false,
        status: "QUOTA_EXCEEDED",
        message: err.message,
        details: err.details,
      });
    }
    next(err);
  }
};

/**
 * Get single document details
 * GET /api/org-admin/documents/:id
 */
const getOrgDocumentById = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const id = Number(req.params.id);

    const doc = await prisma.document.findFirst({
      where: { id, organisation_id: organisationId, status: { not: "DELETED" } },
      include: {
        approvalRequests: {
          include: {
            workflow: { select: { name: true } },
            actions: true,
          },
        },
      },
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    res.json({
      success: true,
      data: {
        id: String(doc.id),
        name: doc.name,
        originalName: doc.original_name || doc.name,
        type: doc.type,
        mimeType: doc.mime_type,
        size: `${(doc.size).toFixed(2)} MB`,
        storageProvider: doc.storage_provider,
        hasS3Object: Boolean(doc.s3_key),
        uploadedBy: doc.uploaded_by,
        createdAt: doc.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate secure presigned download URL
 * GET /api/org-admin/documents/:id/download
 */
const getDocumentDownloadUrl = async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const id = Number(req.params.id);

    const downloadInfo = await StorageService.generateDownloadUrl({
      documentId: id,
      organisationId,
      userId,
      expiresInSeconds: 900, // 15 minutes
    });

    res.json({
      success: true,
      data: downloadInfo,
    });
  } catch (err) {
    res.status(err.message.includes("Unauthorized") ? 403 : 400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Delete document from AWS S3 and PostgreSQL
 * DELETE /api/org-admin/documents/:id
 */
const deleteOrgDocument = async (req, res, next) => {
  try {
    const { organisationId, userName } = getAuthContext(req);
    const id = Number(req.params.id);

    const result = await StorageService.deleteDocument({
      documentId: id,
      organisationId,
      actor: { email: req.user?.email || userName, ipAddress: req.ip },
    });

    res.json(result);
  } catch (err) {
    res.status(err.message.includes("Unauthorized") ? 403 : 400).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getOrgDocuments,
  createOrgDocument,
  uploadOrgDocument,
  getOrgDocumentById,
  getDocumentDownloadUrl,
  deleteOrgDocument,
};
