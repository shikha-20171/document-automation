const fs = require('fs');
const path = require('path');
const prisma = require('../config/prismaClient');
const { getOrganisationCompanyProfile } = require('./organisationProfileService');
const { generateDocumentNumber } = require('../utils/documentNumberGenerator');
const { generateUnifiedDocumentPdf } = require('./documentPdfService');
const { generateUnifiedDocumentDocx } = require('./documentDocxService');
const transporter = require('../config/mail');
const AuditLogService = require('./auditLogService');
const OCRService = require('./ocrService');
const DocumentClassifierService = require('./documentClassifierService');
const DocumentValidationService = require('./documentValidationService');
const DocumentChatService = require('./documentChatService');

/**
 * List documents for an organisation with RBAC, tab filters, search, and relations
 */
async function listDocuments(organisationId, query = {}, user = {}) {
  const {
    documentType,
    category,
    status,
    clientId,
    search,
    tab = 'ALL',
    departmentId,
    teamId,
    page = 1,
    limit = 25,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * take;

  const where = { organisationId };

  // Tab Filtering
  const upperTab = String(tab).toUpperCase();
  if (upperTab === 'ARCHIVED') {
    where.isArchived = true;
  } else {
    where.isArchived = false;
  }

  const userId = user?.id ? parseInt(user.id, 10) : null;
  const userEmail = user?.email ? String(user.email).trim().toLowerCase() : '';
  const userRole = (user?.role || '').toUpperCase();
  const userDeptId = (user?.department_id || user?.departmentId) ? parseInt(user.department_id || user.departmentId, 10) : null;
  const userTeamId = (user?.team_id || user?.teamId) ? parseInt(user.team_id || user.teamId, 10) : null;

  // Role-Based Access Control (RBAC) with Strict Department Isolation
  if (userRole === 'STAFF' || userRole === 'EMPLOYEE') {
    // Employees access only documents created by them, assigned to them, or shared with them within their department
    const personalConditions = [
      { createdByUserId: userId },
      { assignedToId: userId },
      { shares: { some: { OR: [{ sharedWithUserId: userId }, { sharedWithEmail: userEmail }] } } },
    ];
    if (userDeptId) {
      where.AND = [
        { OR: [{ departmentId: userDeptId }, { departmentId: null, createdByUserId: userId }] },
        { OR: personalConditions },
      ];
    } else {
      where.OR = personalConditions;
    }
  } else if (userRole === 'TEAM_LEADER') {
    // Team Leader accesses team documents, their own created/assigned, or shared within their department
    const tlConditions = [
      { createdByUserId: userId },
      { assignedToId: userId },
      { shares: { some: { OR: [{ sharedWithUserId: userId }, { sharedWithEmail: userEmail }] } } },
    ];
    if (userTeamId) {
      tlConditions.push({ teamId: userTeamId });
    }
    if (userDeptId) {
      where.AND = [
        { OR: [{ departmentId: userDeptId }, { departmentId: null, createdByUserId: userId }] },
        { OR: tlConditions },
      ];
    } else {
      where.OR = tlConditions;
    }
  } else if (userRole === 'DEPARTMENT_MANAGER') {
    // Department Manager strictly isolated to department documents, their own created/assigned, or shared
    if (userDeptId) {
      where.OR = [
        { departmentId: userDeptId },
        { createdByUserId: userId },
        { assignedToId: userId },
        { shares: { some: { OR: [{ sharedWithUserId: userId }, { sharedWithEmail: userEmail }] } } },
      ];
    } else {
      where.OR = [
        { createdByUserId: userId },
        { assignedToId: userId },
        { shares: { some: { OR: [{ sharedWithUserId: userId }, { sharedWithEmail: userEmail }] } } },
      ];
    }
  }
  // ORGANISATION_ADMIN and SUPER_ADMIN have tenant-wide access across all departments

  // Specific Tab Constraints
  if (upperTab === 'MY_DOCUMENTS' && userId) {
    where.createdByUserId = userId;
  } else if (upperTab === 'DRAFTS') {
    where.status = 'DRAFT';
  } else if (upperTab === 'ASSIGNED_TO_ME' && userId) {
    where.assignedToId = userId;
  } else if (upperTab === 'PENDING_APPROVAL') {
    where.approvalStatus = 'PENDING_APPROVAL';
  } else if (upperTab === 'PENDING_SIGNATURE') {
    where.signatureStatus = 'PENDING_SIGNATURE';
  } else if (upperTab === 'COMPLETED') {
    where.status = 'COMPLETED';
  } else if (upperTab === 'REJECTED') {
    where.approvalStatus = 'REJECTED';
  } else if (upperTab === 'SHARED') {
    where.shares = {
      some: {
        OR: [
          ...(userId ? [{ sharedWithUserId: userId }] : []),
          ...(userEmail ? [{ sharedWithEmail: userEmail }] : []),
        ],
      },
    };
  }

  if (documentType && documentType !== 'All') where.documentType = documentType;
  if (category && category !== 'All') where.category = category;
  if (status && status !== 'ALL') where.status = status.toUpperCase();
  if (clientId) where.clientId = clientId;
  if (departmentId) where.departmentId = parseInt(departmentId, 10);
  if (teamId) where.teamId = parseInt(teamId, 10);

  if (search) {
    const searchCondition = [
      { documentNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { clientName: { contains: search, mode: 'insensitive' } },
      { documentType: { contains: search, mode: 'insensitive' } },
      { createdByName: { contains: search, mode: 'insensitive' } },
      { assignedToName: { contains: search, mode: 'insensitive' } },
    ];
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchCondition }];
      delete where.OR;
    } else {
      where.OR = searchCondition;
    }
  }

  const [totalCount, documents] = await Promise.all([
    prisma.unifiedDocument.count({ where }),
    prisma.unifiedDocument.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' },
      include: {
        template: { select: { id: true, name: true, category: true } },
        acceptance: true,
        approvalRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { actions: { orderBy: { createdAt: 'desc' }, take: 1 } },
        },
        signatureEnvelopes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { signers: true, fields: true },
        },
        shares: true,
        _count: { select: { versions: true, recipients: true, comments: true } },
      },
    }),
  ]);

  return {
    data: documents,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(totalCount / take),
    },
  };
}

/**
 * Get aggregated metrics
 */
async function getDocumentMetrics(organisationId) {
  const [totalCount, draftCount, generatedCount, sentCount, viewedCount, acceptedCount, rejectedCount] =
    await Promise.all([
      prisma.unifiedDocument.count({ where: { organisationId, isArchived: false } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'DRAFT', isArchived: false } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'GENERATED', isArchived: false } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'SENT', isArchived: false } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'VIEWED', isArchived: false } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'COMPLETED', isArchived: false } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'REJECTED', isArchived: false } }),
    ]);

  return {
    totalCount,
    draftCount,
    generatedCount,
    sentCount,
    viewedCount,
    acceptedCount,
    rejectedCount,
  };
}

/**
 * Get document by ID with full relations
 */
async function getDocumentById(id, organisationId) {
  const document = await prisma.unifiedDocument.findFirst({
    where: { id, organisationId },
    include: {
      template: true,
      versions: { orderBy: { versionNumber: 'desc' } },
      statusHistory: { orderBy: { createdAt: 'desc' } },
      recipients: { orderBy: { sentAt: 'desc' } },
      acceptance: true,
      approvalRequests: {
        orderBy: { createdAt: 'desc' },
        include: { actions: true, history: true },
      },
      signatureEnvelopes: {
        orderBy: { createdAt: 'desc' },
        include: { signers: { orderBy: { order: 'asc' } }, fields: true },
      },
      shares: true,
      comments: { orderBy: { createdAt: 'desc' } },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 25 },
      organisation: { select: { id: true, name: true, branch: true, city: true } },
    },
  });

  if (!document) {
    throw new Error('Document not found.');
  }

  return document;
}

/**
 * Create a new document (Version 1)
 */
async function createDocument(organisationId, userId, userName, payload, req = null) {
  const user = req?.user || {};
  const {
    title,
    documentType = 'Custom Document',
    category = 'General',
    clientId,
    clientName,
    clientEmail,
    clientPhone,
    clientAddress,
    clientContactPerson,
    senderData,
    recipientData,
    content = [],
    financialData,
    variables = {},
    templateId,
    aiPrompt,
    status = 'DRAFT',
  } = payload;

  if (!title || !title.trim()) throw new Error('Document title is required.');

  // Generate sequential document number
  const documentNumber = await generateDocumentNumber(organisationId, documentType);

  // Dynamic tenant identity from current organization
  const orgProfile = await getOrganisationCompanyProfile(organisationId);
  const orgCompanyName = senderData?.companyName || orgProfile.companyName || 'DocuCore Technologies';
  const orgLegalName = senderData?.legalName || orgProfile.legalName || `${orgCompanyName} Pvt Ltd`;
  let finalSenderData = {
    companyName: orgCompanyName,
    legalName: orgLegalName,
    registeredAddress: senderData?.registeredAddress || orgProfile.registeredAddress,
    billingAddress: senderData?.billingAddress || orgProfile.billingAddress,
    email: senderData?.email || orgProfile.email,
    phone: senderData?.phone || orgProfile.phone,
    website: senderData?.website || orgProfile.website,
    gstin: senderData?.gstin || orgProfile.gstin,
    pan: senderData?.pan || orgProfile.pan,
    cin: senderData?.cin || orgProfile.cin,
    authorisedSignatory: senderData?.authorisedSignatory || orgProfile.authorisedSignatory,
    paymentDetails: senderData?.paymentDetails || orgProfile.paymentDetails,
    ...(senderData || {}),
  };

  // Template Independence Guarantee:
  // Capture immutable snapshot of template structure used at creation time
  let templateSnapshot = null;
  if (templateId) {
    const sourceTpl = await prisma.unifiedDocumentTemplate.findUnique({
      where: { id: templateId },
      select: { name: true, category: true, documentType: true, layoutConfig: true, defaultVariables: true, sections: true },
    });
    if (sourceTpl) {
      templateSnapshot = sourceTpl;
    }
  }

  const initialSections = Array.isArray(content) ? content : [];
  const finalStatus = payload.submitApproval ? 'PENDING_APPROVAL' : status.toUpperCase();
  const initialApprovalStatus = payload.submitApproval ? 'PENDING_APPROVAL' : (payload.approvalStatus || 'NONE');

  const newDoc = await prisma.unifiedDocument.create({
    data: {
      organisationId,
      documentNumber,
      title: title.trim(),
      documentType: documentType.trim(),
      category: category.trim(),
      status: finalStatus,
      departmentId: payload.departmentId ? parseInt(payload.departmentId, 10) : ((user?.department_id || user?.departmentId) ? parseInt(user.department_id || user.departmentId, 10) : null),
      departmentName: payload.departmentName || null,
      teamId: payload.teamId ? parseInt(payload.teamId, 10) : ((user?.team_id || user?.teamId) ? parseInt(user.team_id || user.teamId, 10) : null),
      teamName: payload.teamName || null,
      ownerId: payload.ownerId ? parseInt(payload.ownerId, 10) : (userId ? parseInt(userId, 10) : null),
      ownerName: payload.ownerName || userName || null,
      assignedToId: payload.assignedToId ? parseInt(payload.assignedToId, 10) : null,
      assignedToName: payload.assignedToName || null,
      assignedToEmail: payload.assignedToEmail || null,
      assignedAt: payload.assignedToId ? new Date() : null,
      assignmentInstructions: payload.assignmentInstructions || null,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      priority: payload.priority || 'NORMAL',
      approvalRequired: Boolean(payload.approvalRequired || payload.submitApproval),
      signatureRequired: Boolean(payload.signatureRequired),
      approvalStatus: initialApprovalStatus,
      signatureStatus: payload.signatureStatus || 'NONE',
      clientId: clientId || null,
      clientName: clientName?.trim() || null,
      clientEmail: clientEmail?.trim() || null,
      clientPhone: clientPhone?.trim() || null,
      clientAddress: clientAddress?.trim() || null,
      clientContactPerson: clientContactPerson?.trim() || null,
      senderData: finalSenderData,
      recipientData: recipientData || null,
      content: initialSections,
      financialData: financialData || null,
      variables: variables || {},
      templateId: templateId || null,
      templateSnapshot: templateSnapshot || null,
      currentVersion: 1,
      createdByUserId: userId ? parseInt(userId, 10) : null,
      createdByName: userName || null,
      aiPrompt: aiPrompt?.trim() || null,
      versions: {
        create: {
          versionNumber: 1,
          title: title.trim(),
          content: initialSections,
          financialData: financialData || null,
          variables: variables || {},
          templateSnapshot: templateSnapshot || null,
          changeSummary: aiPrompt ? 'Initial AI document generation' : 'Initial document creation (v1)',
          createdById: userId ? parseInt(userId, 10) : null,
          createdByName: userName || null,
        },
      },
      statusHistory: {
        create: {
          previousStatus: null,
          newStatus: finalStatus,
          reason: aiPrompt ? 'Generated via AI Natural-Language Prompt' : 'Initial draft created',
          actorType: 'USER',
          actorId: String(userId || '0'),
          actorName: userName || 'System User',
        },
      },
    },
    include: {
      versions: true,
      template: true,
    },
  });

  // Write to dedicated audit log table
  await prisma.unifiedDocumentAuditLog.create({
    data: {
      organisationId,
      documentId: newDoc.id,
      documentNumber: newDoc.documentNumber,
      documentTitle: newDoc.title,
      userId: userId ? parseInt(userId, 10) : null,
      userName: userName || 'System User',
      action: 'CREATED',
      newStatus: newDoc.status,
      details: aiPrompt ? 'Created via AI Universal Document Builder' : 'Document created',
    },
  }).catch(() => {});

  try {
    await AuditLogService.log({
      organisationId,
      actorId: userId ? String(userId) : null,
      actorName: userName || 'System User',
      module: 'DOCUMENT_BUILDER',
      action: 'DOCUMENT_CREATED',
      resourceType: 'UNIFIED_DOCUMENT',
      resourceId: newDoc.id,
      resourceName: newDoc.documentNumber,
      afterData: { title: newDoc.title, type: newDoc.documentType, version: 1 },
      req,
    });
  } catch (err) {
    console.warn('[UnifiedDocumentService] Audit log skipped:', err.message);
  }

  return newDoc;
}

/**
 * Update document and increment version (v2, v3...)
 */
async function updateDocument(id, organisationId, userId, userName, payload, req = null) {
  const existing = await getDocumentById(id, organisationId);

  const nextVersion = (existing.currentVersion || 1) + 1;
  const updateData = {
    currentVersion: nextVersion,
  };

  if (payload.title !== undefined) updateData.title = payload.title.trim();
  if (payload.documentType !== undefined) updateData.documentType = payload.documentType.trim();
  if (payload.category !== undefined) updateData.category = payload.category.trim();
  if (payload.clientName !== undefined) updateData.clientName = payload.clientName?.trim() || null;
  if (payload.clientEmail !== undefined) updateData.clientEmail = payload.clientEmail?.trim() || null;
  if (payload.clientPhone !== undefined) updateData.clientPhone = payload.clientPhone?.trim() || null;
  if (payload.clientAddress !== undefined) updateData.clientAddress = payload.clientAddress?.trim() || null;
  if (payload.clientContactPerson !== undefined) updateData.clientContactPerson = payload.clientContactPerson?.trim() || null;
  if (payload.clientId !== undefined) updateData.clientId = payload.clientId || null;
  if (payload.content !== undefined) updateData.content = payload.content;
  if (payload.financialData !== undefined) updateData.financialData = payload.financialData;
  if (payload.variables !== undefined) updateData.variables = payload.variables;
  if (payload.senderData !== undefined) updateData.senderData = payload.senderData;
  if (payload.recipientData !== undefined) updateData.recipientData = payload.recipientData;

  // Status transition handling
  let statusHistoryCreate = undefined;
  if (payload.status && payload.status.toUpperCase() !== existing.status) {
    const newStatus = payload.status.toUpperCase();
    updateData.status = newStatus;
    statusHistoryCreate = {
      previousStatus: existing.status,
      newStatus,
      reason: payload.statusReason || `Status updated to ${newStatus}`,
      actorType: 'USER',
      actorId: String(userId || '0'),
      actorName: userName || 'System User',
    };
  }

  const changeSummary = payload.changeSummary || `Version ${nextVersion} saved with updates`;

  const updatedDoc = await prisma.$transaction(async (tx) => {
    // 1. Snapshot into version history
    await tx.unifiedDocumentVersion.create({
      data: {
        documentId: id,
        versionNumber: nextVersion,
        title: updateData.title || existing.title,
        content: updateData.content !== undefined ? updateData.content : existing.content,
        financialData: updateData.financialData !== undefined ? updateData.financialData : existing.financialData,
        variables: updateData.variables !== undefined ? updateData.variables : existing.variables,
        templateSnapshot: existing.templateSnapshot,
        changeSummary,
        createdById: userId ? parseInt(userId, 10) : null,
        createdByName: userName || null,
      },
    });

    // 2. Add status history if status changed
    if (statusHistoryCreate) {
      await tx.unifiedDocumentStatusHistory.create({
        data: {
          documentId: id,
          ...statusHistoryCreate,
        },
      });
    }

    // 3. Update main document record
    return tx.unifiedDocument.update({
      where: { id },
      data: updateData,
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
        template: true,
        acceptance: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
  });

  try {
    await AuditLogService.log({
      organisationId,
      actorId: userId ? String(userId) : null,
      actorName: userName || 'System User',
      module: 'DOCUMENT_BUILDER',
      action: 'DOCUMENT_UPDATED',
      resourceType: 'UNIFIED_DOCUMENT',
      resourceId: id,
      resourceName: existing.documentNumber,
      beforeData: { version: existing.currentVersion, status: existing.status },
      afterData: { version: nextVersion, status: updatedDoc.status },
      req,
    });
  } catch (err) {
    console.warn('[UnifiedDocumentService] Audit log skipped:', err.message);
  }

  return updatedDoc;
}

/**
 * Restore a specific version of a document
 */
async function restoreDocumentVersion(id, versionNumber, organisationId, userId, userName, req = null) {
  const existing = await getDocumentById(id, organisationId);

  const targetVersion = await prisma.unifiedDocumentVersion.findFirst({
    where: { documentId: id, versionNumber: parseInt(versionNumber, 10) },
  });

  if (!targetVersion) {
    throw new Error(`Version ${versionNumber} not found.`);
  }

  const newVersionNum = (existing.currentVersion || 1) + 1;
  const changeSummary = `Restored to version ${versionNumber}`;

  const restored = await prisma.$transaction(async (tx) => {
    // Record new version snapshot
    await tx.unifiedDocumentVersion.create({
      data: {
        documentId: id,
        versionNumber: newVersionNum,
        title: targetVersion.title,
        content: targetVersion.content,
        financialData: targetVersion.financialData,
        variables: targetVersion.variables,
        templateSnapshot: targetVersion.templateSnapshot,
        changeSummary,
        createdById: userId ? parseInt(userId, 10) : null,
        createdByName: userName || null,
      },
    });

    // Update document record with target version's content
    return tx.unifiedDocument.update({
      where: { id },
      data: {
        title: targetVersion.title,
        content: targetVersion.content,
        financialData: targetVersion.financialData,
        variables: targetVersion.variables,
        currentVersion: newVersionNum,
      },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
        template: true,
      },
    });
  });

  return restored;
}

/**
 * Delete a document
 */
async function deleteDocument(id, organisationId, userId, userName, req = null) {
  const existing = await getDocumentById(id, organisationId);

  await prisma.unifiedDocument.delete({ where: { id } });

  try {
    await AuditLogService.log({
      organisationId,
      actorId: userId ? String(userId) : null,
      actorName: userName || 'System User',
      module: 'DOCUMENT_BUILDER',
      action: 'DOCUMENT_DELETED',
      resourceType: 'UNIFIED_DOCUMENT',
      resourceId: id,
      resourceName: existing.documentNumber,
      beforeData: { title: existing.title, documentNumber: existing.documentNumber },
      req,
    });
  } catch (err) {
    console.warn('[UnifiedDocumentService] Audit log skipped:', err.message);
  }

  return { success: true, message: `Document ${existing.documentNumber} deleted successfully.` };
}

/**
 * Duplicate a document into a fresh draft
 */
async function duplicateDocument(id, organisationId, userId, userName, req = null) {
  const original = await getDocumentById(id, organisationId);

  const duplicatePayload = {
    title: `${original.title} (Copy)`,
    documentType: original.documentType,
    category: original.category,
    clientId: original.clientId,
    clientName: original.clientName,
    clientEmail: original.clientEmail,
    clientPhone: original.clientPhone,
    clientAddress: original.clientAddress,
    clientContactPerson: original.clientContactPerson,
    senderData: original.senderData,
    recipientData: original.recipientData,
    content: original.content,
    financialData: original.financialData,
    variables: original.variables,
    templateId: original.templateId,
    status: 'DRAFT',
  };

  return createDocument(organisationId, userId, userName, duplicatePayload, req);
}

/**
 * Save document structure as a reusable template
 */
async function saveDocumentAsTemplate(id, organisationId, { name, category, description }) {
  const doc = await getDocumentById(id, organisationId);

  // Strip client-specific instance data from sections to make a clean reusable template
  const genericSections = (Array.isArray(doc.content) ? doc.content : []).map((sec) => {
    let cleanBody = sec.body;
    if (cleanBody && doc.clientName) {
      cleanBody = cleanBody.replace(new RegExp(doc.clientName, 'g'), '{{client_name}}');
    }
    return {
      id: sec.id,
      type: sec.type,
      title: sec.title,
      body: cleanBody,
      tableData: sec.tableData,
    };
  });

  const template = await prisma.unifiedDocumentTemplate.create({
    data: {
      organisationId,
      name: (name || `${doc.title} Template`).trim(),
      category: category ? category.trim() : doc.category,
      documentType: doc.documentType,
      description: description ? description.trim() : `Template generated from ${doc.documentNumber}`,
      layoutConfig: { primaryColor: '#1e3a8a', theme: 'modern' },
      sections: genericSections,
      defaultVariables: doc.variables || {},
      isStandard: false,
    },
  });

  return template;
}

/**
 * Send document via email with PDF attachment & public view link
 */
async function sendDocumentEmail(id, organisationId, userId, userName, { recipientEmail, recipientName, customMessage, subject }, req = null) {
  const document = await getDocumentById(id, organisationId);
  const cleanEmail = (recipientEmail || document.clientEmail || '').trim().toLowerCase();

  if (!cleanEmail) throw new Error('Recipient email address is required.');

  // 1. Generate real vector PDF
  const pdfBuffer = await generateUnifiedDocumentPdf(document);

  // 2. View Link
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const viewLink = `${frontendUrl}/documents/view/${document.publicShareToken}`;

  const senderEmail = transporter.getSenderEmail();
  const senderName = transporter.getSenderName();
  const companyName = document.senderData?.companyName || document.organisation?.name || senderName;

  const emailSubject = subject || `${document.documentType}: ${document.title} from ${companyName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #1e3a8a; padding: 28px 32px; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
        .content { padding: 32px; }
        .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 6px; margin-bottom: 16px; }
        .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; font-size: 14px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; font-weight: 600; font-size: 14px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .footer { padding: 20px 32px; background: #f1f5f9; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${companyName}</h1>
          <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">${document.documentType} Notification</div>
        </div>
        <div class="content">
          <div class="badge">${document.documentNumber} • ${document.documentType.toUpperCase()}</div>
          <p style="font-size: 15px; line-height: 1.5;">
            Dear <strong>${recipientName || document.clientContactPerson || document.clientName || 'Partner'}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            ${customMessage || `Please find attached your official document for <strong>${document.title}</strong>. You can review the complete document and execute your digital sign-off directly online.`}
          </p>

          <div class="details-box">
            <div>Document: <strong>${document.title}</strong></div>
            <div style="margin-top: 6px;">Document Number: <strong>${document.documentNumber}</strong></div>
            <div style="margin-top: 6px;">Version: <strong>v${document.currentVersion || 1}.0</strong></div>
          </div>

          <div style="text-align: center;">
            <a href="${viewLink}" class="btn" target="_blank">Review & Sign Document Online</a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px;">
            A print-ready copy is attached as a PDF for your records.
          </p>
        </div>
        <div class="footer">
          Sent securely via DocuCore AI • Enterprise Document Automation Platform
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${companyName}" <${senderEmail}>`,
    to: cleanEmail,
    subject: emailSubject,
    html,
    attachments: [
      {
        filename: `${document.documentNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  let deliveryStatus = 'SENT';
  let deliveryError = null;

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[UnifiedDocumentService] Document ${document.documentNumber} dispatched to ${cleanEmail}. ID:`, info.messageId);
  } catch (err) {
    console.error(`[UnifiedDocumentService] Email send failed for ${cleanEmail}:`, err.message);
    deliveryStatus = 'FAILED';
    deliveryError = err.message;
  }

  // Record recipient
  await prisma.unifiedDocumentRecipient.create({
    data: {
      documentId: id,
      recipientEmail: cleanEmail,
      recipientName: recipientName || document.clientContactPerson || document.clientName,
      sentByUserId: userId ? parseInt(userId, 10) : null,
      sentByName: userName || null,
      deliveryStatus,
      deliveryError,
    },
  });

  // Advance status to SENT
  if (deliveryStatus === 'SENT' && ['DRAFT', 'GENERATED'].includes(document.status)) {
    await prisma.unifiedDocument.update({
      where: { id },
      data: { status: 'SENT' },
    });

    await prisma.unifiedDocumentStatusHistory.create({
      data: {
        documentId: id,
        previousStatus: document.status,
        newStatus: 'SENT',
        reason: `Dispatched to ${cleanEmail}`,
        actorType: 'USER',
        actorId: String(userId || '0'),
        actorName: userName || 'System User',
      },
    });
  }

  if (deliveryStatus === 'FAILED') throw new Error(`Email dispatch failed: ${deliveryError}`);

  return { success: true, message: `Document sent to ${cleanEmail}`, viewLink };
}

/**
 * Get public document by share token
 */
async function getPublicDocument(token, reqIp = null, userAgent = null) {
  const document = await prisma.unifiedDocument.findUnique({
    where: { publicShareToken: token },
    include: {
      acceptance: true,
      organisation: { select: { name: true, branch: true, city: true } },
    },
  });

  if (!document) throw new Error('Document not found or link has expired.');

  // Transition from SENT to VIEWED
  if (document.status === 'SENT') {
    await prisma.unifiedDocument.update({
      where: { id: document.id },
      data: { status: 'VIEWED' },
    });

    await prisma.unifiedDocumentStatusHistory.create({
      data: {
        documentId: document.id,
        previousStatus: 'SENT',
        newStatus: 'VIEWED',
        reason: `Recipient accessed portal (${reqIp || 'web'})`,
        actorType: 'CLIENT',
        actorName: document.clientName || 'Counterparty',
      },
    });
    document.status = 'VIEWED';
  }

  return document;
}

/**
 * Handle public decision (Accept / Reject)
 */
async function respondToPublicDocument(token, payload, reqIp = null, userAgent = null) {
  let rawDecision = payload.decision || payload.action || '';
  if (rawDecision === 'ACCEPT') rawDecision = 'ACCEPTED';
  if (rawDecision === 'REJECT') rawDecision = 'REJECTED';
  const validDecision = String(rawDecision).toUpperCase();

  if (!['ACCEPTED', 'REJECTED'].includes(validDecision)) {
    throw new Error('Invalid decision. Must be ACCEPTED or REJECTED.');
  }
  const { signerName, signerEmail, signerDesignation, clientComments, signatureData } = payload;
  if (!signerName || !signerName.trim()) throw new Error('Signer name is required.');
  if (!signerEmail || !signerEmail.trim()) throw new Error('Signer email is required.');

  const document = await prisma.unifiedDocument.findUnique({
    where: { publicShareToken: token },
    include: { acceptance: true },
  });

  if (!document) throw new Error('Document not found or link has expired.');
  if (document.acceptance) {
    throw new Error(`This document has already been ${document.acceptance.decision.toLowerCase()}.`);
  }

  const acceptance = await prisma.unifiedDocumentAcceptance.create({
    data: {
      documentId: document.id,
      decision: validDecision,
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim().toLowerCase(),
      signerDesignation: signerDesignation?.trim() || null,
      clientComments: clientComments?.trim() || null,
      signatureData: signatureData || null,
      signerIp: reqIp || null,
      userAgent: userAgent ? userAgent.substring(0, 255) : null,
    },
  });

  await prisma.unifiedDocument.update({
    where: { id: document.id },
    data: { status: validDecision },
  });

  await prisma.unifiedDocumentStatusHistory.create({
    data: {
      documentId: document.id,
      previousStatus: document.status,
      newStatus: validDecision,
      reason: `Client responded: ${validDecision} by ${signerName.trim()} (${signerEmail.trim()})`,
      actorType: 'CLIENT',
      actorId: signerEmail.trim(),
      actorName: signerName.trim(),
    },
  });

  return { success: true, decision: validDecision, acceptance };
}

/**
 * Generate PDF buffer for document
 */
async function generatePdfForDocument(id, organisationId) {
  const doc = await getDocumentById(id, organisationId);
  return generateUnifiedDocumentPdf(doc);
}

/**
 * Generate DOCX buffer for document
 */
async function generateDocxForDocument(id, organisationId) {
  const doc = await getDocumentById(id, organisationId);
  return generateUnifiedDocumentDocx(doc);
}

/**
 * Generate PDF by public share token
 */
async function generatePublicPdf(token) {
  const document = await prisma.unifiedDocument.findUnique({
    where: { publicShareToken: token },
    include: { organisation: true },
  });
  if (!document) throw new Error('Document not found.');
  return generateUnifiedDocumentPdf(document);
}

/**
 * Generate DOCX by public share token
 */
async function generatePublicDocx(token) {
  const document = await prisma.unifiedDocument.findUnique({
    where: { publicShareToken: token },
    include: { organisation: true },
  });
  if (!document) throw new Error('Document not found.');
  return generateUnifiedDocumentDocx(document);
}

/**
 * Assign document to department, team, or user
 */
async function assignDocument(id, organisationId, payload, user, req = null) {
  const doc = await getDocumentById(id, organisationId);
  const {
    departmentId,
    departmentName,
    teamId,
    teamName,
    assignedToId,
    assignedToName,
    assignedToEmail,
    instructions,
    dueDate,
    priority = 'NORMAL',
    approvalRequired,
    signatureRequired,
  } = payload;

  const targetUserId = assignedToId ? parseInt(assignedToId, 10) : null;
  const updated = await prisma.unifiedDocument.update({
    where: { id },
    data: {
      departmentId: departmentId ? parseInt(departmentId, 10) : doc.departmentId,
      departmentName: departmentName || doc.departmentName,
      teamId: teamId ? parseInt(teamId, 10) : doc.teamId,
      teamName: teamName || doc.teamName,
      assignedToId: targetUserId,
      assignedToName: assignedToName || doc.assignedToName,
      assignedToEmail: assignedToEmail || doc.assignedToEmail,
      assignedAt: targetUserId ? new Date() : doc.assignedAt,
      assignmentInstructions: instructions || doc.assignmentInstructions,
      dueDate: dueDate ? new Date(dueDate) : doc.dueDate,
      priority: priority || doc.priority,
      approvalRequired: approvalRequired !== undefined ? Boolean(approvalRequired) : doc.approvalRequired,
      signatureRequired: signatureRequired !== undefined ? Boolean(signatureRequired) : doc.signatureRequired,
    },
  });

  // Create In-App Notification for Assignee
  if (targetUserId) {
    await prisma.notification.create({
      data: {
        organisation_id: organisationId,
        user_id: targetUserId,
        title: `Document Assigned: ${doc.title}`,
        message: `You have been assigned "${doc.title}" by ${user.name || user.full_name || 'Administrator'}. Priority: ${priority}.`,
        type: 'ASSIGNMENT',
        link: `/documents/view?id=${doc.id}`,
      },
    }).catch(() => {});
  }

  // Record in Audit Log
  await prisma.unifiedDocumentAuditLog.create({
    data: {
      organisationId,
      documentId: id,
      documentNumber: doc.documentNumber,
      documentTitle: doc.title,
      userId: user.id ? parseInt(user.id, 10) : null,
      userName: user.name || user.full_name || 'System User',
      userRole: user.role || 'STAFF',
      action: 'ASSIGNED',
      details: `Assigned to ${assignedToName || 'User ID ' + targetUserId}. Priority: ${priority}`,
      metadata: { departmentName, teamName, dueDate, priority, instructions },
    },
  }).catch(() => {});

  return updated;
}

/**
 * Share document with internal users, department, team, or external party
 */
async function shareDocument(id, organisationId, payload, user, req = null) {
  const doc = await getDocumentById(id, organisationId);
  const {
    sharedWithEmail,
    sharedWithUserId,
    sharedWithDepartmentId,
    sharedWithTeamId,
    shareType = 'USER',
    permissions = { view: true, comment: true, edit: false, download: true, approve: false, sign: false },
  } = payload;

  const targetUserId = sharedWithUserId ? parseInt(sharedWithUserId, 10) : null;
  const cleanEmail = sharedWithEmail ? String(sharedWithEmail).trim().toLowerCase() : null;

  const shareRecord = await prisma.unifiedDocumentShare.create({
    data: {
      documentId: id,
      organisationId,
      sharedWithEmail: cleanEmail,
      sharedWithUserId: targetUserId,
      sharedWithDepartmentId: sharedWithDepartmentId ? parseInt(sharedWithDepartmentId, 10) : null,
      sharedWithTeamId: sharedWithTeamId ? parseInt(sharedWithTeamId, 10) : null,
      shareType,
      permissions,
      createdById: user.id ? parseInt(user.id, 10) : null,
    },
  });

  // Notify recipient
  if (targetUserId) {
    await prisma.notification.create({
      data: {
        organisation_id: organisationId,
        user_id: targetUserId,
        title: `Document Shared: ${doc.title}`,
        message: `${user.name || user.full_name || 'A team member'} shared "${doc.title}" with you.`,
        type: 'DOCUMENT_SHARED',
        link: `/documents/view?id=${doc.id}`,
      },
    }).catch(() => {});
  }

  // Audit log
  await prisma.unifiedDocumentAuditLog.create({
    data: {
      organisationId,
      documentId: id,
      documentNumber: doc.documentNumber,
      documentTitle: doc.title,
      userId: user.id ? parseInt(user.id, 10) : null,
      userName: user.name || user.full_name || 'System User',
      userRole: user.role || 'STAFF',
      action: 'SHARED',
      details: `Shared with ${cleanEmail || 'User ID ' + targetUserId} (${shareType})`,
      metadata: { permissions },
    },
  }).catch(() => {});

  return shareRecord;
}

/**
 * Submit document for approval (Hierarchical Multi-Tier Workflow)
 * Workflow stages:
 * Step 1: Employee -> Team Leader (STAGE_TEAM_LEADER)
 * Step 2: Team Leader -> Department Manager (STAGE_DEPARTMENT_MANAGER)
 * Step 3: Department Manager -> Organisation Admin (STAGE_ORGANISATION_ADMIN)
 */
async function submitForApproval(id, organisationId, payload, user, req = null) {
  const doc = await getDocumentById(id, organisationId);
  const userRole = (user?.role || 'STAFF').toUpperCase();
  const { comments = 'Submitted for formal review' } = payload || {};

  // Determine initial workflow stage based on submitter role
  let initialStage = 'STAGE_TEAM_LEADER';
  let targetApproverRole = 'TEAM_LEADER';
  let stepOrder = 1;

  if (userRole === 'TEAM_LEADER') {
    initialStage = 'STAGE_DEPARTMENT_MANAGER';
    targetApproverRole = 'DEPARTMENT_MANAGER';
    stepOrder = 2;
  } else if (userRole === 'DEPARTMENT_MANAGER') {
    initialStage = 'STAGE_ORGANISATION_ADMIN';
    targetApproverRole = 'ORGANISATION_ADMIN';
    stepOrder = 3;
  } else if (userRole === 'ORGANISATION_ADMIN' || userRole === 'SUPER_ADMIN') {
    initialStage = 'STAGE_ORGANISATION_ADMIN';
    targetApproverRole = 'ORGANISATION_ADMIN';
    stepOrder = 3;
  }

  const approverUserId = payload?.approverId ? parseInt(payload.approverId, 10) : null;
  const approverRole = payload?.approverRole || targetApproverRole;
  const submitterDeptId = doc.departmentId || (user?.department_id ? parseInt(user.department_id, 10) : null);
  const submitterTeamId = doc.teamId || (user?.team_id ? parseInt(user.team_id, 10) : null);

  // 1. Update Document Status
  const updated = await prisma.unifiedDocument.update({
    where: { id },
    data: {
      status: 'PENDING_APPROVAL',
      approvalStatus: 'PENDING_APPROVAL',
      approvalRequired: true,
      departmentId: submitterDeptId,
      teamId: submitterTeamId,
    },
  });

  // 2. Create Approval Request with proper stage and step order
  const approvalReq = await prisma.approvalRequest.create({
    data: {
      organisationId,
      unifiedDocumentId: id,
      documentName: doc.title,
      requestedById: user.id ? parseInt(user.id, 10) : 1,
      assignedApproverId: approverUserId,
      assignedApproverRole: approverRole,
      currentStepOrder: stepOrder,
      status: 'PENDING',
      stage: initialStage,
      comments,
      history: {
        create: {
          userId: user.id ? parseInt(user.id, 10) : null,
          userRole: userRole,
          action: 'SUBMITTED',
          comment: `${comments} (Target: ${initialStage.replace('STAGE_', '').replace('_', ' ')})`,
        },
      },
    },
  });

  // 3. Status history entry
  await prisma.unifiedDocumentStatusHistory.create({
    data: {
      documentId: id,
      previousStatus: doc.status,
      newStatus: 'PENDING_APPROVAL',
      reason: `${comments} - Initiated approval workflow at ${initialStage}`,
      actorType: 'USER',
      actorId: String(user.id || '0'),
      actorName: user.name || user.full_name || 'System User',
    },
  }).catch(() => {});

  // 4. Send In-App Notifications to Target Approvers
  try {
    const approverQuery = {
      organisation_id: organisationId,
      role: approverRole,
    };
    if (submitterDeptId && approverRole !== 'ORGANISATION_ADMIN') {
      approverQuery.department_id = submitterDeptId;
    }

    const targetUsers = approverUserId
      ? [{ id: approverUserId }]
      : await prisma.user.findMany({
          where: approverQuery,
          select: { id: true },
        });

    for (const target of targetUsers) {
      await prisma.notification.create({
        data: {
          organisation_id: organisationId,
          user_id: target.id,
          title: `Approval Required: ${doc.title}`,
          message: `"${doc.title}" requires your review as ${approverRole.replace('_', ' ')}. Submitted by ${user.name || user.full_name}.`,
          type: 'APPROVAL_REQUEST',
          link: `/approvals?id=${approvalReq.id}&docId=${doc.id}`,
        },
      }).catch(() => {});
    }
  } catch (_) {}

  // 5. Audit log
  await prisma.unifiedDocumentAuditLog.create({
    data: {
      organisationId,
      documentId: id,
      documentNumber: doc.documentNumber,
      documentTitle: doc.title,
      userId: user.id ? parseInt(user.id, 10) : null,
      userName: user.name || user.full_name || 'System User',
      userRole: userRole,
      action: 'SUBMITTED_FOR_APPROVAL',
      previousStatus: doc.status,
      newStatus: 'PENDING_APPROVAL',
      details: `${comments} - Routed to ${approverRole}`,
      metadata: { approverRole, approverUserId, stage: initialStage, stepOrder },
    },
  }).catch(() => {});

  return { document: updated, approvalRequest: approvalReq };
}

/**
 * Process Approval Action (Approve / Forward / Reject / Request Changes)
 * Implements full 3-tier hierarchical escalation:
 * Step 1 (Team Leader) -> Step 2 (Department Manager) -> Step 3 (Org Admin) -> Approved
 */
async function processApproval(id, organisationId, payload, user, req = null) {
  const doc = await getDocumentById(id, organisationId);
  const { action, comments = '' } = payload;
  const upperAction = String(action).toUpperCase();
  const actingRole = (user?.role || 'STAFF').toUpperCase();

  // Find latest pending approval request
  const approvalReq = await prisma.approvalRequest.findFirst({
    where: { unifiedDocumentId: id, organisationId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  if (!approvalReq) {
    throw new Error('No pending approval request found for this document.');
  }

  let finalReqStatus = 'PENDING';
  let newDocStatus = 'PENDING_APPROVAL';
  let newApprovalStatus = 'PENDING_APPROVAL';
  let nextStage = approvalReq.stage || 'STAGE_TEAM_LEADER';
  let nextApproverRole = approvalReq.assignedApproverRole || 'TEAM_LEADER';
  let nextStepOrder = approvalReq.currentStepOrder || 1;
  let actionLabel = upperAction;

  if (upperAction === 'APPROVE' || upperAction === 'APPROVED' || upperAction === 'FORWARD') {
    // Check which tier we are advancing from
    const isAtStage1 = nextStage === 'STAGE_TEAM_LEADER' || approvalReq.assignedApproverRole === 'TEAM_LEADER';
    const isAtStage2 = nextStage === 'STAGE_DEPARTMENT_MANAGER' || approvalReq.assignedApproverRole === 'DEPARTMENT_MANAGER';

    if (isAtStage1 && actingRole !== 'ORGANISATION_ADMIN' && actingRole !== 'SUPER_ADMIN') {
      // Step 1: Team Leader approves -> Forward to Department Manager (Step 2)
      nextStage = 'STAGE_DEPARTMENT_MANAGER';
      nextApproverRole = 'DEPARTMENT_MANAGER';
      nextStepOrder = 2;
      finalReqStatus = 'PENDING';
      newDocStatus = 'PENDING_APPROVAL';
      newApprovalStatus = 'PENDING_APPROVAL';
      actionLabel = 'APPROVED_BY_TEAM_LEAD_FORWARDED_TO_DEPT_MANAGER';
    } else if (isAtStage2 && actingRole !== 'ORGANISATION_ADMIN' && actingRole !== 'SUPER_ADMIN') {
      // Step 2: Department Manager approves -> Forward to Organisation Admin (Step 3)
      nextStage = 'STAGE_ORGANISATION_ADMIN';
      nextApproverRole = 'ORGANISATION_ADMIN';
      nextStepOrder = 3;
      finalReqStatus = 'PENDING';
      newDocStatus = 'PENDING_APPROVAL';
      newApprovalStatus = 'PENDING_APPROVAL';
      actionLabel = 'APPROVED_BY_DEPT_MANAGER_FORWARDED_TO_ORG_ADMIN';
    } else {
      // Step 3 (or Org Admin approving directly): Final Executive Approval!
      nextStage = 'APPROVED';
      nextApproverRole = null;
      nextStepOrder = 3;
      finalReqStatus = 'APPROVED';
      newApprovalStatus = 'APPROVED';
      newDocStatus = doc.signatureRequired ? 'PENDING_SIGNATURE' : 'APPROVED';
      actionLabel = 'FINAL_APPROVAL_GRANTED';
    }
  } else if (upperAction === 'REJECT' || upperAction === 'REJECTED') {
    nextStage = 'REJECTED';
    finalReqStatus = 'REJECTED';
    newApprovalStatus = 'REJECTED';
    newDocStatus = 'REJECTED';
    actionLabel = 'REJECTED';
  } else if (upperAction === 'REQUEST_CHANGES' || upperAction === 'CHANGES_REQUESTED') {
    nextStage = 'CHANGES_REQUESTED';
    finalReqStatus = 'PENDING';
    newApprovalStatus = 'CHANGES_REQUESTED';
    newDocStatus = 'CHANGES_REQUESTED';
    actionLabel = 'CHANGES_REQUESTED';
  }

  // Update document status
  const updatedDoc = await prisma.unifiedDocument.update({
    where: { id },
    data: {
      status: newDocStatus,
      approvalStatus: newApprovalStatus,
    },
  });

  // Update approval request
  await prisma.approvalRequest.update({
    where: { id: approvalReq.id },
    data: {
      status: finalReqStatus,
      stage: nextStage,
      assignedApproverRole: nextApproverRole,
      currentStepOrder: nextStepOrder,
      previousApproverName: user.name || user.full_name || actingRole,
      currentApproverName: finalReqStatus === 'APPROVED' ? (user.name || user.full_name) : null,
      comments: comments || undefined,
    },
  });

  // Record action & history
  await prisma.approvalAction.create({
    data: {
      approvalRequestId: approvalReq.id,
      performedById: user.id ? parseInt(user.id, 10) : null,
      action: actionLabel,
      comment: comments,
      stepOrder: nextStepOrder,
    },
  });

  await prisma.approvalHistoryItem.create({
    data: {
      approvalRequestId: approvalReq.id,
      userId: user.id ? parseInt(user.id, 10) : null,
      userRole: actingRole,
      action: actionLabel,
      comment: comments,
    },
  });

  // Status history
  await prisma.unifiedDocumentStatusHistory.create({
    data: {
      documentId: id,
      previousStatus: doc.status,
      newStatus: newDocStatus,
      reason: `Approval decision: ${actionLabel}. ${comments}`,
      actorType: 'USER',
      actorId: String(user.id || '0'),
      actorName: user.name || user.full_name || 'Reviewer',
    },
  }).catch(() => {});

  // Notifications
  if (finalReqStatus === 'PENDING' && nextApproverRole) {
    // Notify users of the next role in this department
    try {
      const nextQuery = {
        organisation_id: organisationId,
        role: nextApproverRole,
      };
      if (doc.departmentId && nextApproverRole !== 'ORGANISATION_ADMIN') {
        nextQuery.department_id = doc.departmentId;
      }
      const nextApprovers = await prisma.user.findMany({
        where: nextQuery,
        select: { id: true },
      });
      for (const target of nextApprovers) {
        await prisma.notification.create({
          data: {
            organisation_id: organisationId,
            user_id: target.id,
            title: `Document Forwarded for Approval: ${doc.title}`,
            message: `"${doc.title}" was reviewed by ${user.name || user.full_name} and forwarded to you for ${nextApproverRole.replace('_', ' ')} sign-off.`,
            type: 'APPROVAL_REQUEST',
            link: `/approvals?id=${approvalReq.id}&docId=${doc.id}`,
          },
        }).catch(() => {});
      }
    } catch (_) {}
  } else if (finalReqStatus === 'APPROVED' || finalReqStatus === 'REJECTED' || newApprovalStatus === 'CHANGES_REQUESTED') {
    // Notify submitter/creator
    if (doc.createdByUserId) {
      try {
        await prisma.notification.create({
          data: {
            organisation_id: organisationId,
            user_id: doc.createdByUserId,
            title: finalReqStatus === 'APPROVED' ? `Document Approved: ${doc.title}` : `Document ${newApprovalStatus}: ${doc.title}`,
            message: `Your document "${doc.title}" has been ${newApprovalStatus.toLowerCase().replace('_', ' ')} by ${user.name || user.full_name}. ${comments ? `Feedback: "${comments}"` : ''}`,
            type: finalReqStatus === 'APPROVED' ? 'APPROVAL_SUCCESS' : 'APPROVAL_UPDATE',
            link: `/documents/editor?id=${doc.id}`,
          },
        }).catch(() => {});
      } catch (_) {}
    }
  }

  // Audit log
  await prisma.unifiedDocumentAuditLog.create({
    data: {
      organisationId,
      documentId: id,
      documentNumber: doc.documentNumber,
      documentTitle: doc.title,
      userId: user.id ? parseInt(user.id, 10) : null,
      userName: user.name || user.full_name || 'Approver',
      userRole: user.role || 'APPROVER',
      action: upperAction,
      previousStatus: doc.status,
      newStatus: newDocStatus,
      details: comments || `Approval decision: ${upperAction}`,
    },
  }).catch(() => {});

  return {
    document: updatedDoc,
    approvalStatus: newApprovalStatus,
    canSendForSignature: newApprovalStatus === 'APPROVED',
  };
}

/**
 * Send document for E-Signature
 */
async function sendForSignature(id, organisationId, payload, user, req = null) {
  const doc = await getDocumentById(id, organisationId);
  let { title, signingOrder = 'SEQUENTIAL', signers = [], fields = [] } = payload || {};

  if ((!signers || signers.length === 0) && (payload?.signerEmail || doc.clientEmail)) {
    signers = [
      {
        name: payload?.signerName || doc.clientName || payload?.signerEmail || 'Authorized Signatory',
        email: payload?.signerEmail || doc.clientEmail,
        role: 'SIGNER',
        order: 1,
      },
    ];
  }

  if (!signers || signers.length === 0) {
    throw new Error('At least one signer is required.');
  }

  // 1. Create Signature Envelope with signers and fields
  const envelope = await prisma.signatureEnvelope.create({
    data: {
      organisationId,
      unifiedDocumentId: id,
      title: title || `E-Signature: ${doc.title}`,
      signingOrder,
      status: 'PENDING',
      createdById: user?.id ? parseInt(user.id, 10) : null,
      signers: {
        create: signers.map((s, idx) => ({
          name: s.name.trim(),
          email: s.email.trim().toLowerCase(),
          role: s.role || 'SIGNER',
          order: s.order || idx + 1,
          status: 'PENDING',
        })),
      },
      fields: {
        create: (fields || []).map((f) => ({
          recipientEmail: f.recipientEmail?.trim().toLowerCase() || signers[0]?.email?.trim().toLowerCase(),
          type: f.type || 'SIGNATURE',
          label: f.label || 'Signature',
          page: f.page || 1,
          posX: f.posX || 100,
          posY: f.posY || 100,
          width: f.width || 200,
          height: f.height || 60,
          required: f.required !== false,
        })),
      },
    },
    include: { signers: true, fields: true },
  });

  // 2. Update Unified Document Status
  await prisma.unifiedDocument.update({
    where: { id },
    data: {
      status: 'PENDING_SIGNATURE',
      signatureStatus: 'PENDING_SIGNATURE',
      signatureRequired: true,
    },
  });

  // 3. Status History
  await prisma.unifiedDocumentStatusHistory.create({
    data: {
      documentId: id,
      previousStatus: doc.status,
      newStatus: 'PENDING_SIGNATURE',
      reason: `Signature request initiated for ${signers.map((s) => s.email).join(', ')}`,
      actorType: 'USER',
      actorId: String(user?.id || '0'),
      actorName: user?.name || user?.full_name || 'System User',
    },
  }).catch(() => {});

  // 4. Audit Log
  await prisma.unifiedDocumentAuditLog.create({
    data: {
      organisationId,
      documentId: id,
      documentNumber: doc.documentNumber,
      documentTitle: doc.title,
      userId: user?.id ? parseInt(user.id, 10) : null,
      userName: user?.name || user?.full_name || 'System User',
      userRole: user?.role || 'STAFF',
      action: 'SIGNATURE_REQUESTED',
      previousStatus: doc.status,
      newStatus: 'PENDING_SIGNATURE',
      details: `Dispatched to ${signers.length} signers: ${signers.map((s) => s.email).join(', ')}`,
      metadata: { envelopeId: envelope.id, signersCount: signers.length },
    },
  }).catch(() => {});

  return envelope;
}

/**
 * Sign Document Recipient Step
 */
async function signDocument(envelopeIdOrDocId, recipientIdOrPayload, signatureData, req = null) {
  const crypto = require('crypto');

  let signer = null;
  let envelope = null;
  let envelopeId = envelopeIdOrDocId;

  if (typeof recipientIdOrPayload === 'object' || !recipientIdOrPayload || typeof recipientIdOrPayload === 'string' && recipientIdOrPayload.length > 20) {
    const payload = typeof recipientIdOrPayload === 'object' ? recipientIdOrPayload : (req?.body || {});
    // Check if envelope exists for this unified document
    envelope = await prisma.signatureEnvelope.findFirst({
      where: {
        OR: [
          { id: envelopeIdOrDocId },
          { unifiedDocumentId: envelopeIdOrDocId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: { signers: true, unifiedDocument: true },
    });

    if (envelope) {
      envelopeId = envelope.id;
      signer = envelope.signers?.[0];
      signatureData = payload?.signatureData || signatureData || 'DIGITALLY_EXECUTED_SIGNATURE';
    } else {
      const doc = await prisma.unifiedDocument.findUnique({ where: { id: envelopeIdOrDocId } });
      if (!doc) throw new Error('Document not found for signing.');
      const newEnvelope = await prisma.signatureEnvelope.create({
        data: {
          organisationId: doc.organisationId,
          unifiedDocumentId: doc.id,
          title: `E-Signature: ${doc.title}`,
          status: 'PENDING',
          signers: {
            create: [
              {
                name: payload?.signerName || doc.clientName || 'Authorized Signatory',
                email: payload?.signerEmail || doc.clientEmail || 'signer@client.com',
                role: 'SIGNER',
                order: 1,
                status: 'PENDING',
              },
            ],
          },
        },
        include: { signers: true, unifiedDocument: true },
      });
      envelopeId = newEnvelope.id;
      signer = newEnvelope.signers[0];
      signatureData = payload?.signatureData || signatureData || 'DIGITALLY_EXECUTED_SIGNATURE';
    }
  } else {
    signer = await prisma.signatureRecipient.findFirst({
      where: { id: recipientIdOrPayload, envelopeId },
      include: { envelope: { include: { unifiedDocument: true } } },
    });
  }

  if (!signer) {
    throw new Error('Signature recipient record not found.');
  }

  if (signer.status === 'SIGNED') {
    return { success: true, message: 'Already signed.', signer };
  }

  const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1';
  const userAgent = req?.headers?.['user-agent'] || 'DocuCore Digital Signature Engine';

  // 1. Mark signer as signed
  const updatedSigner = await prisma.signatureRecipient.update({
    where: { id: signer.id },
    data: {
      status: 'SIGNED',
      signedAt: new Date(),
      signatureData: signatureData || 'DIGITALLY_EXECUTED_SIGNATURE',
      ipAddress: String(ipAddress).substring(0, 50),
      userAgent: String(userAgent).substring(0, 255),
    },
  });

  // 2. Check remaining signers
  const pendingCount = await prisma.signatureRecipient.count({
    where: { envelopeId, status: 'PENDING' },
  });

  let envelopeCompleted = false;
  let certHash = null;

  if (pendingCount === 0) {
    envelopeCompleted = true;
    const resolvedDocId = signer.envelope?.unifiedDocumentId || signer.envelope?.documentId || envelope?.unifiedDocumentId || envelopeIdOrDocId;
    const certString = `DOCUCORE-CERT-${envelopeId}-${resolvedDocId}-${Date.now()}`;
    certHash = `SHA256:${crypto.createHash('sha256').update(certString).digest('hex')}`;

    await prisma.signatureEnvelope.update({
      where: { id: envelopeId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        certificateHash: certHash,
      },
    });

    // Mark Unified Document COMPLETED
    const targetDocId = signer.envelope?.unifiedDocumentId || envelope?.unifiedDocumentId || (resolvedDocId && resolvedDocId.includes('-') ? resolvedDocId : null);
    if (targetDocId) {
      const doc = await prisma.unifiedDocument.update({
        where: { id: targetDocId },
        data: {
          status: 'COMPLETED',
          signatureStatus: 'COMPLETED',
        },
      });


      // Immutable version snapshot of final completed document
      await prisma.unifiedDocumentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: (doc.currentVersion || 1) + 1,
          title: `${doc.title} (Final Signed)`,
          content: doc.content,
          financialData: doc.financialData,
          variables: doc.variables,
          templateSnapshot: doc.templateSnapshot,
          changeSummary: `Final signed document certified (${certHash})`,
          createdByName: signer.name,
        },
      }).catch(() => {});

      // Notify owner / creator
      if (doc.createdByUserId) {
        await prisma.notification.create({
          data: {
            organisation_id: doc.organisationId,
            user_id: doc.createdByUserId,
            title: `Document Fully Signed: ${doc.title}`,
            message: `All parties have completed digital signatures for "${doc.title}". Certificate: ${certHash.substring(0, 16)}...`,
            type: 'SIGNATURE_COMPLETED',
            link: `/documents/final/${doc.id}`,
          },
        }).catch(() => {});
      }

      // Audit log
      await prisma.unifiedDocumentAuditLog.create({
        data: {
          organisationId: doc.organisationId,
          documentId: doc.id,
          documentNumber: doc.documentNumber,
          documentTitle: doc.title,
          userName: signer.name,
          action: 'SIGNED',
          previousStatus: 'PENDING_SIGNATURE',
          newStatus: 'COMPLETED',
          details: `Executed by ${signer.name} (${signer.email}). Certificate: ${certHash}`,
          ipAddress: String(ipAddress),
          metadata: { certHash },
        },
      }).catch(() => {});
    }
  } else {
    // Partially signed
    if (signer.envelope.unifiedDocumentId) {
      await prisma.unifiedDocument.update({
        where: { id: signer.envelope.unifiedDocumentId },
        data: { signatureStatus: 'PARTIALLY_SIGNED' },
      });
    }
  }

  return {
    success: true,
    message: envelopeCompleted ? 'All signatures completed! Document finalized.' : 'Signature recorded.',
    signer: updatedSigner,
    completed: envelopeCompleted,
    certificateHash: certHash,
  };
}

/**
 * Archive document
 */
async function archiveDocument(id, organisationId, user, req = null) {
  const doc = await getDocumentById(id, organisationId);
  const updated = await prisma.unifiedDocument.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  });

  await prisma.unifiedDocumentAuditLog.create({
    data: {
      organisationId,
      documentId: id,
      documentNumber: doc.documentNumber,
      documentTitle: doc.title,
      userId: user.id ? parseInt(user.id, 10) : null,
      userName: user.name || user.full_name || 'System User',
      userRole: user.role || 'STAFF',
      action: 'ARCHIVED',
      details: 'Document moved to archive',
    },
  }).catch(() => {});

  return updated;
}

/**
 * Restore archived document
 */
async function restoreDocument(id, organisationId, user, req = null) {
  const doc = await getDocumentById(id, organisationId);
  const updated = await prisma.unifiedDocument.update({
    where: { id },
    data: {
      isArchived: false,
      archivedAt: null,
    },
  });

  await prisma.unifiedDocumentAuditLog.create({
    data: {
      organisationId,
      documentId: id,
      documentNumber: doc.documentNumber,
      documentTitle: doc.title,
      userId: user.id ? parseInt(user.id, 10) : null,
      userName: user.name || user.full_name || 'System User',
      userRole: user.role || 'STAFF',
      action: 'RESTORED',
      details: 'Document restored from archive',
    },
  }).catch(() => {});

  return updated;
}

/**
 * Add comment to document
 */
async function addComment(id, organisationId, payload, user, req = null) {
  const doc = await getDocumentById(id, organisationId);
  const { comment, sectionId } = payload;
  if (!comment || !comment.trim()) throw new Error('Comment text is required.');

  const commentRecord = await prisma.unifiedDocumentComment.create({
    data: {
      documentId: id,
      organisationId,
      userId: user.id ? parseInt(user.id, 10) : null,
      userName: user.name || user.full_name || 'System User',
      userRole: user.role || 'STAFF',
      comment: comment.trim(),
      sectionId: sectionId || null,
    },
  });

  return commentRecord;
}

/**
 * Get audit logs for document
 */
async function getAuditLogs(id, organisationId) {
  return prisma.unifiedDocumentAuditLog.findMany({
    where: { documentId: id, organisationId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Upload and process document through intelligence pipeline
 */
async function uploadAndProcessDocument(organisationId, user, file, body = {}, req = null) {
  if (!file || !file.buffer) {
    throw new Error('Document file is required for processing.');
  }

  const startTime = Date.now();
  const originalName = file.originalname || 'document.pdf';
  const mimeType = file.mimetype || 'application/pdf';
  const fileSize = file.size || file.buffer.length;

  // 1. File Storage
  const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const uploadDir = path.join(__dirname, '../../uploads/documents');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, safeName);
  fs.writeFileSync(filePath, file.buffer);
  const fileUrl = `/uploads/documents/${safeName}`;

  // 2. OCR / Text Extraction
  let rawText = '';
  let ocrConfidence = 0.95;
  try {
    const ocrResult = await OCRService.extractText({
      buffer: file.buffer,
      mimeType,
      language: 'eng',
    });
    rawText = ocrResult?.text || '';
    ocrConfidence = ocrResult?.confidence || 0.95;
  } catch (err) {
    console.warn('[uploadAndProcessDocument] OCR warning, using fallback parser:', err.message);
    rawText = file.buffer.toString('utf8').slice(0, 5000);
  }

  // 3. Document Classification
  const classification = await DocumentClassifierService.classifyDocument(rawText, originalName);
  const detectedDocType = classification.documentType || 'Custom Document';

  // 4. Structured Field & Table Extraction
  const UnifiedOcrService = require('./unifiedOcrService');
  let actionType = 'extract_fields';
  if (detectedDocType === 'Invoice') actionType = 'extract_invoice';
  else if (detectedDocType === 'Quotation') actionType = 'extract_quotation';
  else if (detectedDocType === 'Contract' || detectedDocType === 'Agreement' || detectedDocType === 'NDA') actionType = 'extract_contract';

  const extraction = await UnifiedOcrService.extractStructuredByAction({
    rawText,
    action: actionType,
    fileBuffer: file.buffer,
    mimeType,
    organisationId,
  });

  const extractedData = extraction.data || {};
  const fields = extraction.fields || [];
  const tables = extraction.tables || [];

  // 5. Document Validation
  const validation = DocumentValidationService.validate(detectedDocType, extractedData, fields);

  // 6. Overall Confidence Evaluation & Initial State
  const overallConfidence = Math.min(
    1.0,
    (classification.confidence * 0.4) + ((extraction.confidence || ocrConfidence) * 0.6)
  );
  const confidenceScore = Math.round(overallConfidence * 100);

  // Confidence & Validation Rules:
  // Low confidence (< 80%), or Validation Error/Warning -> REVIEW_REQUIRED
  // Otherwise -> DRAFT (or ready for workflow)
  let initialStatus = 'DRAFT';
  if (overallConfidence < 0.80 || classification.isUnknown || !validation.isValid || validation.requiresReview) {
    initialStatus = 'REVIEW_REQUIRED';
  }

  // Build Sections
  const sections = [];
  sections.push({
    id: 'sec_overview',
    type: 'header',
    title: 'Document Overview',
    body: `DOCUMENT: ${detectedDocType.toUpperCase()}\nCLASSIFICATION CONFIDENCE: ${confidenceScore}%\nSOURCE: Uploaded File (${originalName})\nVALIDATION: ${validation.status}`,
  });

  if (tables && tables.length > 0) {
    tables.forEach((t, i) => {
      sections.push({
        id: `sec_tbl_${i + 1}`,
        type: 'table',
        title: t.title || `Table #${i + 1}`,
        tableData: {
          headers: t.headers || ['Item', 'Description', 'Rate', 'Amount'],
          rows: t.rows || [],
        },
      });
    });
  }

  sections.push({
    id: 'sec_content',
    type: 'text',
    title: 'Extracted Content',
    body: rawText.slice(0, 4000) || 'Document content extracted and indexed.',
  });

  // Financial Data
  const financialData = {
    subtotal: extractedData.subtotal || 0,
    tax: extractedData.taxAmount || extractedData.tax || 0,
    discount: extractedData.discount || 0,
    total: extractedData.total || extractedData.grandTotal || 0,
    currency: extractedData.currency || 'INR',
  };

  const clientName = extractedData.clientName || extractedData.vendorName || extractedData.partyB || body.clientName || 'Counterparty';
  const clientEmail = extractedData.clientEmail || extractedData.email || body.clientEmail || null;

  const docNumber = await generateDocumentNumber(organisationId, detectedDocType);

  // 7. Persist UnifiedDocument
  const newDoc = await prisma.unifiedDocument.create({
    data: {
      organisationId,
      documentNumber: docNumber,
      title: body.title || `${detectedDocType}: ${originalName.replace(/\.[^/.]+$/, '')}`,
      documentType: detectedDocType,
      category: body.category || (detectedDocType === 'Invoice' || detectedDocType === 'Quotation' ? 'Sales' : 'General'),
      status: initialStatus,
      clientName,
      clientEmail,
      clientId: body.clientId || null,
      content: sections,
      financialData,
      variables: {
        document_number: docNumber,
        client_name: clientName,
        source_file: originalName,
      },
      currentVersion: 1,
      pdfUrl: fileUrl,
      createdByUserId: user.id ? parseInt(user.id, 10) : null,
      createdByName: user.name || user.full_name || 'System User',
      metadata: {
        originalFileName: originalName,
        fileSize,
        mimeType,
        fileUrl,
        rawText: rawText.slice(0, 20000),
        extractedData,
        fields,
        tables,
        validation,
        classification,
        confidenceScore,
        latencyMs: Date.now() - startTime,
        ingestedAt: new Date().toISOString(),
      },
    },
  });

  // Record Audit Log
  await prisma.unifiedDocumentAuditLog.create({
    data: {
      organisationId,
      documentId: newDoc.id,
      documentNumber: newDoc.documentNumber,
      documentTitle: newDoc.title,
      userId: user.id ? parseInt(user.id, 10) : null,
      userName: user.name || user.full_name || 'System User',
      userRole: user.role || 'STAFF',
      action: 'UPLOADED',
      details: `Document "${originalName}" uploaded and processed: classified as "${detectedDocType}" (${confidenceScore}% confidence, validation: ${validation.status}). Status: ${initialStatus}.`,
      metadata: {
        fileName: originalName,
        fileSize,
        detectedDocType,
        confidenceScore,
        validationStatus: validation.status,
      },
    },
  });

  return newDoc;
}

/**
 * Process Human Review Action
 */
async function processReviewAction(id, organisationId, user, payload, req = null) {
  const doc = await getDocumentById(id, organisationId);
  const { action, documentType, correctedFields = {}, comments = '' } = payload;

  const currentMeta = doc.metadata || {};
  const currentExtracted = currentMeta.extractedData || {};

  // Apply corrections
  const updatedExtracted = { ...currentExtracted, ...correctedFields };
  const updatedDocType = documentType || doc.documentType;

  // Re-run validation on updated fields
  const revalidation = DocumentValidationService.validate(updatedDocType, updatedExtracted, currentMeta.fields || []);

  let newStatus = doc.status;
  if (action === 'APPROVE_EXTRACTION') {
    newStatus = 'DRAFT';
  } else if (action === 'REJECT_EXTRACTION') {
    newStatus = 'REJECTED';
  }

  const updated = await prisma.unifiedDocument.update({
    where: { id },
    data: {
      documentType: updatedDocType,
      status: newStatus,
      financialData: {
        ...(doc.financialData || {}),
        total: updatedExtracted.total !== undefined ? Number(updatedExtracted.total) : (doc.financialData?.total || 0),
        subtotal: updatedExtracted.subtotal !== undefined ? Number(updatedExtracted.subtotal) : (doc.financialData?.subtotal || 0),
      },
      clientName: updatedExtracted.clientName || updatedExtracted.vendorName || doc.clientName,
      metadata: {
        ...currentMeta,
        extractedData: updatedExtracted,
        validation: revalidation,
        reviewHistory: [
          ...(currentMeta.reviewHistory || []),
          {
            action,
            reviewerId: user.id,
            reviewerName: user.name || user.full_name,
            timestamp: new Date().toISOString(),
            comments,
            correctedFields,
          },
        ],
      },
    },
  });

  // Audit log
  await prisma.unifiedDocumentAuditLog.create({
    data: {
      organisationId,
      documentId: id,
      documentNumber: doc.documentNumber,
      documentTitle: doc.title,
      userId: user.id ? parseInt(user.id, 10) : null,
      userName: user.name || user.full_name || 'System Reviewer',
      userRole: user.role || 'STAFF',
      action: 'REVIEWED',
      previousStatus: doc.status,
      newStatus,
      details: `Human review completed (${action}). Document type: ${updatedDocType}. Remarks: ${comments || 'Fields verified.'}`,
      metadata: { action, correctedFields, comments },
    },
  });

  return updated;
}

/**
 * Chat with a document
 */
async function chatWithDocument(id, organisationId, user, query) {
  const doc = await getDocumentById(id, organisationId);
  return DocumentChatService.chatWithDocument({ document: doc, query });
}

/**
 * Get all organisation audit logs
 */
async function getOrganisationAuditLogs(organisationId, query = {}) {
  const { search, action, userId, documentId, limit = 100, page = 1 } = query;
  const where = { organisationId };

  if (action && action !== 'ALL') {
    where.action = action.toUpperCase();
  }
  if (userId) {
    where.userId = parseInt(userId, 10);
  }
  if (documentId) {
    where.documentId = documentId;
  }
  if (search) {
    where.OR = [
      { documentTitle: { contains: search, mode: 'insensitive' } },
      { documentNumber: { contains: search, mode: 'insensitive' } },
      { userName: { contains: search, mode: 'insensitive' } },
      { details: { contains: search, mode: 'insensitive' } },
      { action: { contains: search, mode: 'insensitive' } },
    ];
  }

  const take = Math.min(200, Math.max(1, parseInt(limit, 10)));
  const skip = (Math.max(1, parseInt(page, 10)) - 1) * take;

  const [total, logs] = await Promise.all([
    prisma.unifiedDocumentAuditLog.count({ where }),
    prisma.unifiedDocumentAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return { total, page: parseInt(page, 10), limit: take, logs };
}

module.exports = {
  listDocuments,
  getDocumentMetrics,
  getDocumentById,
  createDocument,
  updateDocument,
  restoreDocumentVersion,
  deleteDocument,
  duplicateDocument,
  saveDocumentAsTemplate,
  sendDocumentEmail,
  getPublicDocument,
  respondToPublicDocument,
  generatePdfForDocument,
  generateDocxForDocument,
  generatePublicPdf,
  generatePublicDocx,
  assignDocument,
  shareDocument,
  submitForApproval,
  processApproval,
  sendForSignature,
  signDocument,
  archiveDocument,
  restoreDocument,
  addComment,
  getAuditLogs,
  uploadAndProcessDocument,
  processReviewAction,
  chatWithDocument,
  getOrganisationAuditLogs,
};

