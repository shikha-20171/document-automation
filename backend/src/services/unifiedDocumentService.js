const prisma = require('../config/prismaClient');
const { generateDocumentNumber } = require('../utils/documentNumberGenerator');
const { generateUnifiedDocumentPdf } = require('./documentPdfService');
const { generateUnifiedDocumentDocx } = require('./documentDocxService');
const transporter = require('../config/mail');
const AuditLogService = require('./auditLogService');

/**
 * List documents for an organisation with search and filters
 */
async function listDocuments(organisationId, query = {}) {
  const {
    documentType,
    category,
    status,
    clientId,
    search,
    page = 1,
    limit = 25,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * take;

  const where = { organisationId };

  if (documentType && documentType !== 'All') where.documentType = documentType;
  if (category && category !== 'All') where.category = category;
  if (status && status !== 'ALL') where.status = status.toUpperCase();
  if (clientId) where.clientId = clientId;

  if (search) {
    where.OR = [
      { documentNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { clientName: { contains: search, mode: 'insensitive' } },
      { documentType: { contains: search, mode: 'insensitive' } },
    ];
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
        _count: { select: { versions: true, recipients: true } },
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
      prisma.unifiedDocument.count({ where: { organisationId } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'DRAFT' } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'GENERATED' } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'SENT' } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'VIEWED' } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'ACCEPTED' } }),
      prisma.unifiedDocument.count({ where: { organisationId, status: 'REJECTED' } }),
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
      organisation: { select: { id: true, name: true, branch: true, city: true } },
    },
  });

  if (!document) {
    throw new Error('Document not found or access denied.');
  }

  return document;
}

/**
 * Create a new document (Version 1)
 */
async function createDocument(organisationId, userId, userName, payload, req = null) {
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

  // If senderData not provided, default to organisation info
  let finalSenderData = senderData;
  if (!finalSenderData || Object.keys(finalSenderData).length === 0) {
    const org = await prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { name: true, branch: true, city: true },
    });
    finalSenderData = {
      companyName: org?.name || 'Enterprise Solutions',
      address: [org?.branch, org?.city].filter(Boolean).join(', '),
      email: null,
      phone: null,
    };
  }

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

  const newDoc = await prisma.unifiedDocument.create({
    data: {
      organisationId,
      documentNumber,
      title: title.trim(),
      documentType: documentType.trim(),
      category: category.trim(),
      status: status.toUpperCase(),
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
          newStatus: status.toUpperCase(),
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
};
