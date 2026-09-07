const prisma = require('../config/prismaClient');

const STANDARD_TEMPLATES = [
  {
    name: 'Enterprise Web & Software Development',
    category: 'Software',
    description: 'Full-stack software engineering, architecture, QA, and cloud deployment quotation template.',
    currency: 'INR',
    defaultTaxRate: 18,
    defaultTerms: '1. Quotation valid for 30 calendar days from issue date.\n2. 50% advance invoice required prior to project kickoff.\n3. Scope changes outside agreed PRD will be estimated via separate change requests.\n4. Complete IP, repository ownership, and production keys transferred upon final invoice settlement.',
    defaultPaymentTerms: '50% advance on sign-off, 30% on staging delivery & UAT sign-off, 20% on production go-live.',
    defaultNotes: 'Thank you for choosing our engineering team. We are committed to building a scalable, high-performance product.',
    designTheme: { primaryColor: '#1e3a8a', accentColor: '#3b82f6', layout: 'modern' },
    items: [
      {
        title: 'Requirement Discovery, Wireframing & System Architecture',
        description: 'Comprehensive stakeholder interviews, technical specification document, database schema, and Figma design system.',
        quantity: 1,
        unit: 'milestone',
        unitPrice: 60000,
      },
      {
        title: 'Core Full-Stack Application Engineering',
        description: 'Frontend component implementation, backend microservices, authenticated REST APIs, and third-party integrations.',
        quantity: 1,
        unit: 'milestone',
        unitPrice: 150000,
      },
      {
        title: 'Security Hardening, Penetration Testing & QA',
        description: 'Automated test suite, load testing, OWASP security compliance audit, and responsive cross-browser testing.',
        quantity: 1,
        unit: 'milestone',
        unitPrice: 50000,
      },
      {
        title: 'Cloud DevOps, CI/CD Pipeline & 30-Day Launch Warranty',
        description: 'Infrastructure provisioning (AWS/GCP), containerized deployment, monitoring alerts, and 30-day post-launch hypercare.',
        quantity: 1,
        unit: 'milestone',
        unitPrice: 40000,
      },
    ],
  },
  {
    name: 'Strategic IT & Business Consulting',
    category: 'Consulting',
    description: 'Expert advisory, technical architecture audit, and digital transformation roadmap.',
    currency: 'INR',
    defaultTaxRate: 18,
    defaultTerms: '1. Retainer valid for 90 days from contract commencement.\n2. Work hours logged and shared weekly with executive sponsors.\n3. Non-disclosure agreement governs all deliverables and proprietary findings.',
    defaultPaymentTerms: 'Monthly advance billing on the 1st of each calendar month.',
    defaultNotes: 'We appreciate the opportunity to guide your digital transformation journey.',
    designTheme: { primaryColor: '#0f172a', accentColor: '#0ea5e9', layout: 'corporate' },
    items: [
      {
        title: 'Technology Stack & Architecture Audit',
        description: 'Deep audit of existing infrastructure, technical debt, database bottlenecks, and security posture.',
        quantity: 1,
        unit: 'audit',
        unitPrice: 75000,
      },
      {
        title: 'Executive Advisory & Digital Transformation Strategy',
        description: 'Bi-weekly advisory sessions with CTO/leadership, vendor evaluations, and 12-month engineering roadmap.',
        quantity: 2,
        unit: 'months',
        unitPrice: 50000,
      },
    ],
  },
  {
    name: 'Digital Marketing & Growth Retainer',
    category: 'Marketing',
    description: 'Full-funnel digital marketing, performance advertising, SEO optimization, and analytics.',
    currency: 'INR',
    defaultTaxRate: 18,
    defaultTerms: '1. Minimum commitment period of 3 months.\n2. Ad spend paid directly to ad platforms (Google/Meta); fees cover strategy and execution.\n3. Bi-weekly sprint reports and live dashboard access provided.',
    defaultPaymentTerms: '100% advance on monthly renewal.',
    defaultNotes: 'We look forward to driving high-ROI growth for your brand.',
    designTheme: { primaryColor: '#4f46e5', accentColor: '#8b5cf6', layout: 'modern' },
    items: [
      {
        title: 'Performance Marketing (Google Ads & Meta Ads Management)',
        description: 'Campaign setup, continuous A/B creative testing, budget optimization, conversion rate tracking, and remarketing.',
        quantity: 1,
        unit: 'month',
        unitPrice: 45000,
      },
      {
        title: 'Technical SEO & Content Strategy Optimization',
        description: 'Keyword research, on-page optimization, backlink acquisition strategy, and monthly technical audit.',
        quantity: 1,
        unit: 'month',
        unitPrice: 35000,
      },
    ],
  },
];

/**
 * Ensure standard templates exist for an organisation
 */
async function ensureStandardTemplates(organisationId) {
  const existingCount = await prisma.quotationTemplate.count({
    where: { organisationId },
  });

  if (existingCount === 0) {
    for (const tpl of STANDARD_TEMPLATES) {
      await prisma.quotationTemplate.create({
        data: {
          organisationId,
          name: tpl.name,
          category: tpl.category,
          description: tpl.description,
          currency: tpl.currency,
          defaultTaxRate: tpl.defaultTaxRate,
          defaultTerms: tpl.defaultTerms,
          defaultPaymentTerms: tpl.defaultPaymentTerms,
          defaultNotes: tpl.defaultNotes,
          designTheme: tpl.designTheme,
          items: tpl.items,
          isStandard: true,
        },
      });
    }
  }
}

/**
 * List all templates for an organisation
 */
async function listTemplates(organisationId, { category, search } = {}) {
  await ensureStandardTemplates(organisationId);

  const where = {
    organisationId,
    isArchived: false,
  };

  if (category && category !== 'All') {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.quotationTemplate.findMany({
    where,
    orderBy: [{ isStandard: 'desc' }, { updatedAt: 'desc' }],
    include: {
      _count: {
        select: { quotations: true },
      },
    },
  });
}

/**
 * Get template by ID
 */
async function getTemplateById(id, organisationId) {
  const template = await prisma.quotationTemplate.findFirst({
    where: {
      id,
      organisationId,
    },
    include: {
      _count: {
        select: { quotations: true },
      },
    },
  });

  if (!template) {
    throw new Error('Quotation template not found or unauthorized.');
  }

  return template;
}

/**
 * Create a new custom template
 */
async function createTemplate(organisationId, data) {
  const {
    name,
    description,
    category = 'General',
    currency = 'INR',
    defaultTaxRate = 18,
    defaultTerms,
    defaultPaymentTerms,
    defaultNotes,
    bankDetails,
    designTheme,
    items = [],
  } = data;

  if (!name || !name.trim()) {
    throw new Error('Template name is required.');
  }

  return prisma.quotationTemplate.create({
    data: {
      organisationId,
      name: name.trim(),
      description: description ? description.trim() : null,
      category: category.trim(),
      currency: currency.trim().toUpperCase(),
      defaultTaxRate: Number(defaultTaxRate || 18),
      defaultTerms: defaultTerms ? defaultTerms.trim() : null,
      defaultPaymentTerms: defaultPaymentTerms ? defaultPaymentTerms.trim() : null,
      defaultNotes: defaultNotes ? defaultNotes.trim() : null,
      bankDetails: bankDetails || null,
      designTheme: designTheme || null,
      items: Array.isArray(items) ? items : [],
      isStandard: false,
    },
  });
}

/**
 * Update an existing template
 */
async function updateTemplate(id, organisationId, data) {
  await getTemplateById(id, organisationId); // asserts existence & tenancy

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.category !== undefined) updateData.category = data.category.trim();
  if (data.currency !== undefined) updateData.currency = data.currency.trim().toUpperCase();
  if (data.defaultTaxRate !== undefined) updateData.defaultTaxRate = Number(data.defaultTaxRate);
  if (data.defaultTerms !== undefined) updateData.defaultTerms = data.defaultTerms?.trim() || null;
  if (data.defaultPaymentTerms !== undefined) updateData.defaultPaymentTerms = data.defaultPaymentTerms?.trim() || null;
  if (data.defaultNotes !== undefined) updateData.defaultNotes = data.defaultNotes?.trim() || null;
  if (data.bankDetails !== undefined) updateData.bankDetails = data.bankDetails;
  if (data.designTheme !== undefined) updateData.designTheme = data.designTheme;
  if (data.items !== undefined) updateData.items = Array.isArray(data.items) ? data.items : [];

  return prisma.quotationTemplate.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete / archive a template
 */
async function deleteTemplate(id, organisationId) {
  const existing = await getTemplateById(id, organisationId);

  // If standard, don't hard delete; soft archive
  if (existing.isStandard) {
    return prisma.quotationTemplate.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  // If quotation references exist, soft archive; otherwise hard delete
  const quoteCount = await prisma.quotation.count({ where: { templateId: id } });
  if (quoteCount > 0) {
    return prisma.quotationTemplate.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  return prisma.quotationTemplate.delete({
    where: { id },
  });
}

module.exports = {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  ensureStandardTemplates,
};
