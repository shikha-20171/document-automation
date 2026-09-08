const prisma = require('../config/prismaClient');
const { calculateQuotationFinancials, round2, formatCurrency } = require('../utils/pricingCalculator');
const { generateQuotationNumber } = require('../utils/quotationNumberGenerator');
const { generateQuotationPdf } = require('./quotationPdfService');
const transporter = require('../config/mail');
const auditLogService = require('./auditLogService');

/**
 * List quotations for an organisation with search, status filters and pagination
 */
async function listQuotations(organisationId, query = {}) {
  const {
    status,
    search,
    clientId,
    page = 1,
    limit = 25,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * take;

  const where = {
    organisationId,
  };

  if (status && status !== 'ALL') {
    where.status = status.toUpperCase();
  }

  if (clientId) {
    where.clientId = clientId;
  }

  if (search) {
    where.OR = [
      { quotationNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { clientName: { contains: search, mode: 'insensitive' } },
      { clientEmail: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [totalCount, quotations] = await Promise.all([
    prisma.quotation.count({ where }),
    prisma.quotation.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc',
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        template: {
          select: { id: true, name: true, category: true },
        },
        acceptance: true,
        _count: {
          select: { recipients: true, views: true },
        },
      },
    }),
  ]);

  return {
    data: quotations,
    pagination: {
      total: totalCount,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(totalCount / take),
    },
  };
}

/**
 * Get aggregated metrics for the organisation dashboard
 */
async function getQuotationMetrics(organisationId) {
  const [
    totalCount,
    draftCount,
    sentCount,
    viewedCount,
    acceptedCount,
    rejectedCount,
    totalValueAgg,
    acceptedValueAgg,
  ] = await Promise.all([
    prisma.quotation.count({ where: { organisationId } }),
    prisma.quotation.count({ where: { organisationId, status: 'DRAFT' } }),
    prisma.quotation.count({ where: { organisationId, status: 'SENT' } }),
    prisma.quotation.count({ where: { organisationId, status: 'VIEWED' } }),
    prisma.quotation.count({ where: { organisationId, status: 'ACCEPTED' } }),
    prisma.quotation.count({ where: { organisationId, status: 'REJECTED' } }),
    prisma.quotation.aggregate({
      where: { organisationId },
      _sum: { total: true },
    }),
    prisma.quotation.aggregate({
      where: { organisationId, status: 'ACCEPTED' },
      _sum: { total: true },
    }),
  ]);

  const totalValue = totalValueAgg._sum.total || 0;
  const acceptedValue = acceptedValueAgg._sum.total || 0;
  const nonDraftQuotes = totalCount - draftCount;
  const conversionRate = nonDraftQuotes > 0 ? round2((acceptedCount / nonDraftQuotes) * 100) : 0;

  return {
    totalCount,
    draftCount,
    sentCount,
    viewedCount,
    acceptedCount,
    rejectedCount,
    totalPipelineValue: round2(totalValue),
    acceptedRevenue: round2(acceptedValue),
    conversionRate,
  };
}

/**
 * Get quotation by ID with tenant security
 */
async function getQuotationById(id, organisationId) {
  const quotation = await prisma.quotation.findFirst({
    where: {
      id,
      organisationId,
    },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      template: true,
      recipients: {
        orderBy: { sentAt: 'desc' },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
      acceptance: true,
      views: {
        orderBy: { viewedAt: 'desc' },
        take: 10,
      },
      organisation: {
        select: { id: true, name: true, branch: true, city: true },
      },
    },
  });

  if (!quotation) {
    throw new Error('Quotation not found or access denied.');
  }

  return quotation;
}

/**
 * Create a new quotation
 */
async function createQuotation(organisationId, userId, userName, payload, req = null) {
  const {
    title,
    clientId,
    clientName,
    clientEmail,
    clientPhone,
    clientAddress,
    clientContactPerson,
    currency = 'INR',
    taxRate = 18,
    discountType,
    discountValue,
    items = [],
    issueDate,
    expiryDate,
    notes,
    termsAndConditions,
    paymentTerms,
    bankDetails,
    senderDetails,
    templateId,
    aiPrompt,
    status = 'DRAFT',
  } = payload;

  if (!clientName || !clientName.trim()) {
    throw new Error('Client name is required.');
  }

  // Calculate financials strictly with support for both discountValue and discount
  const effectiveDiscountValue = discountValue !== undefined
    ? Number(discountValue)
    : (payload.discount !== undefined ? Number(payload.discount) : 0);

  const effectiveDiscountType = discountType || payload.discountType || (effectiveDiscountValue > 100 ? 'FIXED' : 'PERCENTAGE');

  const financials = calculateQuotationFinancials(items, {
    discountType: effectiveDiscountType,
    discountValue: effectiveDiscountValue,
    taxRate,
  });

  // Generate unique sequential quotation number
  const quotationNumber = await generateQuotationNumber(organisationId);

  // Default dates
  const parsedIssueDate = issueDate ? new Date(issueDate) : new Date();
  const parsedExpiryDate = expiryDate ? new Date(expiryDate) : new Date(parsedIssueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  // If senderDetails not supplied, populate from organisation defaults
  let finalSenderDetails = senderDetails;
  if (!finalSenderDetails || Object.keys(finalSenderDetails).length === 0) {
    const org = await prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { name: true, branch: true, city: true },
    });
    finalSenderDetails = {
      companyName: org?.name || 'Enterprise Solutions',
      address: [org?.branch, org?.city].filter(Boolean).join(', '),
      email: null,
      phone: null,
    };
  }

  const newQuotation = await prisma.quotation.create({
    data: {
      organisationId,
      quotationNumber,
      title: (title || `Quotation for ${clientName}`).trim(),
      status: status.toUpperCase(),
      clientId: clientId || null,
      clientName: clientName.trim(),
      clientEmail: clientEmail ? clientEmail.trim() : null,
      clientPhone: clientPhone ? clientPhone.trim() : null,
      clientAddress: clientAddress ? clientAddress.trim() : null,
      clientContactPerson: clientContactPerson ? clientContactPerson.trim() : null,
      currency: currency.trim().toUpperCase(),
      subtotal: financials.subtotal,
      discountType: financials.discountType,
      discountValue: financials.discountValue,
      discountAmount: financials.discountAmount,
      taxRate: financials.taxRate,
      taxAmount: financials.taxAmount,
      total: financials.total,
      issueDate: parsedIssueDate,
      expiryDate: parsedExpiryDate,
      notes: notes ? notes.trim() : null,
      termsAndConditions: termsAndConditions ? termsAndConditions.trim() : null,
      paymentTerms: paymentTerms ? paymentTerms.trim() : null,
      bankDetails: bankDetails || null,
      senderDetails: finalSenderDetails,
      templateId: templateId || null,
      createdByUserId: userId ? parseInt(userId, 10) : null,
      createdByName: userName || null,
      aiPrompt: aiPrompt ? aiPrompt.trim() : null,
      items: {
        create: financials.items.map((it) => ({
          title: it.title,
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          taxPercent: it.taxPercent,
          amount: it.amount,
          sortOrder: it.sortOrder,
        })),
      },
      statusHistory: {
        create: {
          previousStatus: null,
          newStatus: status.toUpperCase(),
          reason: aiPrompt ? 'Created via AI Natural-Language Prompt' : 'Initial quotation draft created',
          actorType: 'USER',
          actorId: String(userId || '0'),
          actorName: userName || 'System User',
        },
      },
    },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      template: true,
      statusHistory: true,
    },
  });

  // Audit logging
  try {
    await auditLogService.log({
      organisationId,
      actorId: userId ? String(userId) : null,
      actorName: userName || 'System User',
      module: 'QUOTATION',
      action: 'QUOTATION_CREATED',
      resourceType: 'QUOTATION',
      resourceId: newQuotation.id,
      resourceName: newQuotation.quotationNumber,
      afterData: {
        quotationNumber: newQuotation.quotationNumber,
        clientName: newQuotation.clientName,
        total: newQuotation.total,
      },
      req,
    });
  } catch (err) {
    console.warn('[QuotationService] Audit log skipped:', err.message);
  }

  return newQuotation;
}

/**
 * Update an existing quotation
 */
async function updateQuotation(id, organisationId, userId, userName, payload, req = null) {
  const existing = await getQuotationById(id, organisationId);

  // Recalculate financials if items or financial fields are updated
  const rawItems = payload.items !== undefined ? payload.items : existing.items;
  const effectiveDiscountVal = payload.discountValue !== undefined
    ? Number(payload.discountValue)
    : (payload.discount !== undefined ? Number(payload.discount) : existing.discountValue);
  const effectiveDiscountTyp = payload.discountType !== undefined
    ? payload.discountType
    : (payload.discount !== undefined ? (effectiveDiscountVal > 100 ? 'FIXED' : 'PERCENTAGE') : existing.discountType);
  const taxRate = payload.taxRate !== undefined ? payload.taxRate : existing.taxRate;

  const financials = calculateQuotationFinancials(rawItems, {
    discountType: effectiveDiscountTyp,
    discountValue: effectiveDiscountVal,
    taxRate,
  });

  const updateData = {
    subtotal: financials.subtotal,
    discountType: financials.discountType,
    discountValue: financials.discountValue,
    discountAmount: financials.discountAmount,
    taxRate: financials.taxRate,
    taxAmount: financials.taxAmount,
    total: financials.total,
  };

  if (payload.title !== undefined) updateData.title = payload.title.trim();
  if (payload.clientName !== undefined) updateData.clientName = payload.clientName.trim();
  if (payload.clientEmail !== undefined) updateData.clientEmail = payload.clientEmail?.trim() || null;
  if (payload.clientPhone !== undefined) updateData.clientPhone = payload.clientPhone?.trim() || null;
  if (payload.clientAddress !== undefined) updateData.clientAddress = payload.clientAddress?.trim() || null;
  if (payload.clientContactPerson !== undefined) updateData.clientContactPerson = payload.clientContactPerson?.trim() || null;
  if (payload.clientId !== undefined) updateData.clientId = payload.clientId || null;
  if (payload.currency !== undefined) updateData.currency = payload.currency.trim().toUpperCase();
  if (payload.issueDate !== undefined) updateData.issueDate = new Date(payload.issueDate);
  if (payload.expiryDate !== undefined) updateData.expiryDate = payload.expiryDate ? new Date(payload.expiryDate) : null;
  if (payload.notes !== undefined) updateData.notes = payload.notes?.trim() || null;
  if (payload.termsAndConditions !== undefined) updateData.termsAndConditions = payload.termsAndConditions?.trim() || null;
  if (payload.paymentTerms !== undefined) updateData.paymentTerms = payload.paymentTerms?.trim() || null;
  if (payload.bankDetails !== undefined) updateData.bankDetails = payload.bankDetails;
  if (payload.senderDetails !== undefined) updateData.senderDetails = payload.senderDetails;

  // Status transition handling
  let statusHistoryCreate = undefined;
  if (payload.status && payload.status.toUpperCase() !== existing.status) {
    const newStatus = payload.status.toUpperCase();
    updateData.status = newStatus;
    statusHistoryCreate = {
      previousStatus: existing.status,
      newStatus,
      reason: payload.statusReason || 'Status changed by user',
      actorType: 'USER',
      actorId: String(userId || '0'),
      actorName: userName || 'System User',
    };
  }

  // Update in a transaction: remove existing items, insert recalculated items, update quotation
  const updatedQuotation = await prisma.$transaction(async (tx) => {
    if (payload.items !== undefined) {
      await tx.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      await tx.quotationItem.createMany({
        data: financials.items.map((it) => ({
          quotationId: id,
          title: it.title,
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          discountPercent: it.discountPercent,
          taxPercent: it.taxPercent,
          amount: it.amount,
          sortOrder: it.sortOrder,
        })),
      });
    }

    if (statusHistoryCreate) {
      await tx.quotationStatusHistory.create({
        data: {
          quotationId: id,
          ...statusHistoryCreate,
        },
      });
    }

    return tx.quotation.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
        template: true,
        acceptance: true,
        recipients: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  });

  try {
    await auditLogService.log({
      organisationId,
      actorId: userId ? String(userId) : null,
      actorName: userName || 'System User',
      module: 'QUOTATION',
      action: 'QUOTATION_UPDATED',
      resourceType: 'QUOTATION',
      resourceId: id,
      resourceName: existing.quotationNumber,
      beforeData: { total: existing.total, status: existing.status },
      afterData: { total: updatedQuotation.total, status: updatedQuotation.status },
      req,
    });
  } catch (err) {
    console.warn('[QuotationService] Audit log skipped:', err.message);
  }

  return updatedQuotation;
}

/**
 * Delete a quotation
 */
async function deleteQuotation(id, organisationId, userId, userName, req = null) {
  const existing = await getQuotationById(id, organisationId);

  await prisma.quotation.delete({
    where: { id },
  });

  try {
    await auditLogService.log({
      organisationId,
      actorId: userId ? String(userId) : null,
      actorName: userName || 'System User',
      module: 'QUOTATION',
      action: 'QUOTATION_DELETED',
      resourceType: 'QUOTATION',
      resourceId: id,
      resourceName: existing.quotationNumber,
      beforeData: { quotationNumber: existing.quotationNumber, clientName: existing.clientName },
      req,
    });
  } catch (err) {
    console.warn('[QuotationService] Audit log skipped:', err.message);
  }

  return { success: true, message: `Quotation ${existing.quotationNumber} deleted successfully.` };
}

/**
 * Duplicate a quotation into a fresh draft
 */
async function duplicateQuotation(id, organisationId, userId, userName, req = null) {
  const original = await getQuotationById(id, organisationId);

  const duplicatePayload = {
    title: `${original.title} (Copy)`,
    clientId: original.clientId,
    clientName: original.clientName,
    clientEmail: original.clientEmail,
    clientPhone: original.clientPhone,
    clientAddress: original.clientAddress,
    clientContactPerson: original.clientContactPerson,
    currency: original.currency,
    taxRate: original.taxRate,
    discountType: original.discountType,
    discountValue: original.discountValue,
    items: original.items.map((it) => ({
      title: it.title,
      description: it.description,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice,
      discountPercent: it.discountPercent,
      taxPercent: it.taxPercent,
    })),
    notes: original.notes,
    termsAndConditions: original.termsAndConditions,
    paymentTerms: original.paymentTerms,
    bankDetails: original.bankDetails,
    senderDetails: original.senderDetails,
    templateId: original.templateId,
    status: 'DRAFT',
  };

  return createQuotation(organisationId, userId, userName, duplicatePayload, req);
}

/**
 * Save quotation design & items as a reusable template (stripping client data)
 */
async function saveQuotationAsTemplate(id, organisationId, { name, category, description }) {
  const quote = await getQuotationById(id, organisationId);

  const templateItems = quote.items.map((it) => ({
    title: it.title,
    description: it.description,
    quantity: it.quantity,
    unit: it.unit,
    unitPrice: it.unitPrice,
  }));

  const template = await prisma.quotationTemplate.create({
    data: {
      organisationId,
      name: (name || `${quote.title} Template`).trim(),
      description: description ? description.trim() : `Template generated from ${quote.quotationNumber}`,
      category: category ? category.trim() : 'General',
      currency: quote.currency,
      defaultTaxRate: quote.taxRate,
      defaultTerms: quote.termsAndConditions,
      defaultPaymentTerms: quote.paymentTerms,
      defaultNotes: quote.notes,
      bankDetails: quote.bankDetails,
      items: templateItems,
      isStandard: false,
    },
  });

  return template;
}

/**
 * Send quotation email to client with PDF attachment & portal view link
 */
async function sendQuotationEmail(id, organisationId, userId, userName, { recipientEmail, recipientName, customMessage, subject }, req = null) {
  const quotation = await getQuotationById(id, organisationId);
  const cleanEmail = (recipientEmail || quotation.clientEmail || '').trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error('Recipient email address is required.');
  }

  // 1. Generate real vector PDF
  const pdfBuffer = await generateQuotationPdf(quotation);

  // 2. Prepare View Link
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const viewLink = `${frontendUrl}/quotations/view/${quotation.publicShareToken}`;

  const senderEmail = transporter.getSenderEmail();
  const senderName = transporter.getSenderName();
  const companyName = quotation.senderDetails?.companyName || quotation.organisation?.name || senderName;

  const emailSubject = subject || `Quotation ${quotation.quotationNumber} from ${companyName}`;

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
        .quote-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 6px; margin-bottom: 16px; }
        .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #0f172a; border-top: 1px solid #cbd5e1; padding-top: 10px; margin-top: 10px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; font-weight: 600; font-size: 14px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .footer { padding: 20px 32px; background: #f1f5f9; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${companyName}</h1>
          <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">Commercial Quotation & Proposal</div>
        </div>
        <div class="content">
          <div class="quote-badge">QUOTATION ${quotation.quotationNumber}</div>
          <p style="font-size: 15px; line-height: 1.5;">
            Dear <strong>${recipientName || quotation.clientContactPerson || quotation.clientName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569;">
            ${customMessage || `Please find attached our official quotation for <strong>${quotation.title}</strong>. You can review the complete line items and accept or sign off directly through our secure client portal.`}
          </p>

          <div class="details-box">
            <div class="details-row"><span>Quotation Number:</span> <strong>${quotation.quotationNumber}</strong></div>
            <div class="details-row"><span>Date of Issue:</span> <span>${formatDate(quotation.issueDate)}</span></div>
            <div class="details-row"><span>Valid Until:</span> <span>${quotation.expiryDate ? formatDate(quotation.expiryDate) : '30 Days'}</span></div>
            <div class="total-row"><span>Total Amount:</span> <span>${formatCurrency(quotation.total, quotation.currency)}</span></div>
          </div>

          <div style="text-align: center;">
            <a href="${viewLink}" class="btn" target="_blank">View & Accept Quotation Online</a>
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 24px;">
            A print-ready copy of this quotation is also attached as a PDF for your internal bookkeeping.
          </p>
        </div>
        <div class="footer">
          Sent securely via DocuCore AI • Enterprise Quotation & Contract Automation
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
        filename: `${quotation.quotationNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  let deliveryStatus = 'SENT';
  let deliveryError = null;

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[QuotationService] Quotation ${quotation.quotationNumber} sent to ${cleanEmail}. Message ID:`, info.messageId);
  } catch (err) {
    console.error(`[QuotationService] Mail send failed for ${cleanEmail}:`, err.message);
    deliveryStatus = 'FAILED';
    deliveryError = err.message;
  }

  // Record recipient dispatch
  await prisma.quotationRecipient.create({
    data: {
      quotationId: id,
      recipientEmail: cleanEmail,
      recipientName: recipientName || quotation.clientContactPerson || quotation.clientName,
      sentByUserId: userId ? parseInt(userId, 10) : null,
      sentByName: userName || null,
      deliveryStatus,
      deliveryError,
    },
  });

  // If email was dispatched, advance quotation status to SENT (unless already ACCEPTED/REJECTED)
  if (deliveryStatus === 'SENT' && ['DRAFT', 'GENERATED'].includes(quotation.status)) {
    await prisma.quotation.update({
      where: { id },
      data: { status: 'SENT' },
    });

    await prisma.quotationStatusHistory.create({
      data: {
        quotationId: id,
        previousStatus: quotation.status,
        newStatus: 'SENT',
        reason: `Dispatched to ${cleanEmail}`,
        actorType: 'USER',
        actorId: String(userId || '0'),
        actorName: userName || 'System User',
      },
    });
  }

  if (deliveryStatus === 'FAILED') {
    throw new Error(`Email dispatch failed: ${deliveryError}`);
  }

  return {
    success: true,
    message: `Quotation dispatched successfully to ${cleanEmail}.`,
    viewLink,
  };
}

/**
 * Fetch quotation by public share token for client portal view
 */
async function getPublicQuotation(token, reqIp = null, userAgent = null) {
  const quotation = await prisma.quotation.findUnique({
    where: { publicShareToken: token },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      acceptance: true,
      organisation: {
        select: { name: true, branch: true, city: true },
      },
    },
  });

  if (!quotation) {
    throw new Error('Quotation not found or link has expired.');
  }

  // Record client view event
  await prisma.quotationView.create({
    data: {
      quotationId: quotation.id,
      viewerIp: reqIp || null,
      userAgent: userAgent ? userAgent.substring(0, 255) : null,
    },
  });

  // If currently in SENT status, transition to VIEWED
  if (quotation.status === 'SENT') {
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: { status: 'VIEWED' },
    });

    await prisma.quotationStatusHistory.create({
      data: {
        quotationId: quotation.id,
        previousStatus: 'SENT',
        newStatus: 'VIEWED',
        reason: `Client accessed online quotation portal (${reqIp || 'web'})`,
        actorType: 'CLIENT',
        actorId: null,
        actorName: quotation.clientName,
      },
    });
    quotation.status = 'VIEWED';
  }

  return quotation;
}

/**
 * Handle client decision (Accept / Reject) from public portal
 */
async function respondToPublicQuotation(token, payload, reqIp = null, userAgent = null) {
  const { decision, signerName, signerEmail, signerDesignation, clientComments, signatureData } = payload;

  const validDecision = (decision || '').toUpperCase();
  if (!['ACCEPTED', 'REJECTED'].includes(validDecision)) {
    throw new Error('Invalid decision. Must be ACCEPTED or REJECTED.');
  }

  if (!signerName || !signerName.trim()) {
    throw new Error('Signer name is required.');
  }
  if (!signerEmail || !signerEmail.trim()) {
    throw new Error('Signer email is required.');
  }

  const quotation = await prisma.quotation.findUnique({
    where: { publicShareToken: token },
    include: { acceptance: true },
  });

  if (!quotation) {
    throw new Error('Quotation not found or link has expired.');
  }

  if (quotation.acceptance) {
    throw new Error(`This quotation has already been ${quotation.acceptance.decision.toLowerCase()}.`);
  }

  // Record acceptance
  const acceptance = await prisma.quotationAcceptance.create({
    data: {
      quotationId: quotation.id,
      decision: validDecision,
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim().toLowerCase(),
      signerDesignation: signerDesignation ? signerDesignation.trim() : null,
      clientComments: clientComments ? clientComments.trim() : null,
      signatureData: signatureData || null,
      signerIp: reqIp || null,
      userAgent: userAgent ? userAgent.substring(0, 255) : null,
    },
  });

  // Update quotation status
  await prisma.quotation.update({
    where: { id: quotation.id },
    data: { status: validDecision },
  });

  // Record status history
  await prisma.quotationStatusHistory.create({
    data: {
      quotationId: quotation.id,
      previousStatus: quotation.status,
      newStatus: validDecision,
      reason: `Client responded: ${validDecision} by ${signerName.trim()} (${signerEmail.trim()})${clientComments ? ` - Note: "${clientComments}"` : ''}`,
      actorType: 'CLIENT',
      actorId: signerEmail.trim(),
      actorName: signerName.trim(),
      metadata: { signerDesignation, ip: reqIp },
    },
  });

  return {
    success: true,
    decision: validDecision,
    acceptance,
  };
}

/**
 * Generate PDF buffer for a quotation
 */
async function generatePdfForQuotation(id, organisationId) {
  const quotation = await getQuotationById(id, organisationId);
  return generateQuotationPdf(quotation);
}

/**
 * Generate PDF buffer by public token (for public download)
 */
async function generatePublicPdf(token) {
  const quotation = await prisma.quotation.findUnique({
    where: { publicShareToken: token },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
      organisation: true,
      acceptance: true,
    },
  });

  if (!quotation) {
    throw new Error('Quotation not found.');
  }

  return generateQuotationPdf(quotation);
}

function formatDate(d) {
  if (!d) return '';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return String(d);
  }
}

module.exports = {
  listQuotations,
  getQuotationMetrics,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  duplicateQuotation,
  saveQuotationAsTemplate,
  sendQuotationEmail,
  getPublicQuotation,
  respondToPublicQuotation,
  generatePdfForQuotation,
  generatePublicPdf,
};
