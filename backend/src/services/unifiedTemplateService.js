const prisma = require('../config/prismaClient');

const STANDARD_SYSTEM_TEMPLATES = [
  {
    name: 'Standard Commercial Invoice & Tax Bill',
    category: 'Sales',
    documentType: 'Invoice',
    description: 'Enterprise billing invoice with itemized line items, GST breakdown, payment instructions, and bank remittance info.',
    layoutConfig: { primaryColor: '#1e3a8a', theme: 'modern' },
    defaultVariables: {
      company_name: 'Enterprise Solutions Tech Pvt Ltd',
      client_name: '{{client_name}}',
      amount: '{{amount}}',
      payment_terms: 'Due within 15 days of invoice date',
    },
    sections: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Tax Invoice & Billing Particulars',
        body: 'Official tax invoice issued for professional engineering and technology services rendered.',
      },
      {
        id: 'sec_2',
        type: 'table',
        title: 'Billed Line Items',
        tableData: {
          headers: ['Item / Service', 'Description', 'Qty', 'Unit', 'Rate (INR)', 'Amount (INR)'],
          rows: [
            ['Cloud Architecture & Backend Engineering', 'REST API microservices & database schemas', '1', 'month', '150000', '150000'],
            ['Frontend Dashboard Implementation', 'Responsive Next.js enterprise UI components', '1', 'month', '100000', '100000'],
          ],
        },
      },
      {
        id: 'sec_3',
        type: 'terms',
        title: 'Payment Terms & Remittance Notice',
        body: '• Payment is due strictly within 15 calendar days.\n• Bank transfer details: HDFC Bank, Account No: 50200012345678, IFSC: HDFC0001234.\n• Late payments incur 1.5% statutory monthly interest.',
      },
      {
        id: 'sec_4',
        type: 'signature',
        title: 'Authorized Seal & Signatory',
        body: 'Generated and signed by Enterprise Solutions Accounts Department.',
      },
    ],
  },
  {
    name: 'Mutual Non-Disclosure Agreement (NDA)',
    category: 'Legal',
    documentType: 'NDA',
    description: 'Bilateral confidentiality agreement safeguarding proprietary technical architectures, source code, and commercial data.',
    layoutConfig: { primaryColor: '#0f172a', theme: 'corporate' },
    defaultVariables: {
      term_years: '3 years',
      governing_law: 'Laws of India',
    },
    sections: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Parties & Commercial Recital',
        body: 'This Mutual Non-Disclosure Agreement is executed to govern discussions regarding commercial technology collaboration.',
      },
      {
        id: 'sec_2',
        type: 'text',
        title: '1. Proprietary Information Definition',
        body: '"Confidential Information" encompasses all software algorithms, designs, customer data, trade secrets, and financials disclosed between the parties.',
      },
      {
        id: 'sec_3',
        type: 'text',
        title: '2. Non-Disclosure & Duty of Care',
        body: 'The Receiving Party covenants to protect Confidential Information with the same degree of care as its own confidential assets, restricting access strictly to authorized representatives.',
      },
      {
        id: 'sec_4',
        type: 'terms',
        title: '3. Term & Arbitration',
        body: 'This Agreement remains in effect for 3 years from execution. Any controversy shall be resolved through binding arbitration.',
      },
      {
        id: 'sec_5',
        type: 'signature',
        title: 'Execution by Authorized Signatories',
        body: 'Both parties confirm agreement by executing below.',
      },
    ],
  },
  {
    name: 'Strategic Technology Project Proposal',
    category: 'Business',
    documentType: 'Business Proposal',
    description: 'Comprehensive project pitch proposal covering executive summary, technical architecture, deliverable phases, and SLA.',
    layoutConfig: { primaryColor: '#2563eb', theme: 'modern' },
    defaultVariables: {
      project_name: 'Digital Transformation Platform',
      timeline: '12 Weeks',
    },
    sections: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Executive Summary',
        body: 'We are thrilled to present our strategic technical proposal designed to accelerate your core digital workflows and platform capabilities.',
      },
      {
        id: 'sec_2',
        type: 'text',
        title: 'Problem Statement & Proposed Solution',
        body: 'To address modern operational throughput, we propose deploying an enterprise-grade, cloud-native document automation architecture.',
      },
      {
        id: 'sec_3',
        type: 'table',
        title: 'Milestone Execution Roadmap',
        tableData: {
          headers: ['Sprint', 'Core Milestone', 'Duration', 'Deliverables'],
          rows: [
            ['Sprint 1-2', 'Discovery & Architecture', '2 Weeks', 'Design tokens, Figma prototype, DB schemas'],
            ['Sprint 3-5', 'Full-Stack Development', '6 Weeks', 'Backend microservices, authenticated frontend'],
            ['Sprint 6', 'Security Hardening & Launch', '2 Weeks', 'Penetration testing, CI/CD, production launch'],
          ],
        },
      },
      {
        id: 'sec_4',
        type: 'terms',
        title: 'Governance & Service Level Agreement',
        body: 'Includes bi-weekly sprint demos, 99.9% uptime deployment target, and 30-day post-launch warranty.',
      },
      {
        id: 'sec_5',
        type: 'signature',
        title: 'Approval & Sponsorship Sign-off',
        body: 'Sign-off initiates the project kickoff sequence.',
      },
    ],
  },
  {
    name: 'Full-Stack Engineer Employment Offer Letter',
    category: 'HR',
    documentType: 'Offer Letter',
    description: 'Standard HR employment offer letter outlining designation, compensation package, reporting structure, and joining terms.',
    layoutConfig: { primaryColor: '#059669', theme: 'clean' },
    defaultVariables: {
      candidate_name: '{{candidate_name}}',
      designation: 'Senior Full-Stack Engineer',
      salary: '₹15,00,000 per annum (CTC)',
    },
    sections: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Formal Offer of Employment',
        body: 'We are delighted to extend this formal offer of employment. We believe your engineering expertise will be an invaluable asset to our product team.',
      },
      {
        id: 'sec_2',
        type: 'text',
        title: 'Position & Responsibilities',
        body: '1. Designation: Senior Full-Stack Engineer.\n2. Work Location: Hybrid / Headquarters.\n3. Responsibilities include system architecture, scalable API microservices, and code reviews.',
      },
      {
        id: 'sec_3',
        type: 'table',
        title: 'Annual Compensation Breakdown (CTC)',
        tableData: {
          headers: ['Component', 'Monthly (INR)', 'Annual (INR)'],
          rows: [
            ['Basic Salary', '60,000', '7,20,000'],
            ['House Rent Allowance (HRA)', '30,000', '3,60,000'],
            ['Special & Performance Allowance', '25,000', '3,00,000'],
            ['Provident Fund Contribution', '10,000', '1,20,000'],
            ['Total Cost to Company (CTC)', '1,25,000', '15,00,000'],
          ],
        },
      },
      {
        id: 'sec_4',
        type: 'terms',
        title: 'Probation & Confidentiality Covenants',
        body: '• Initial 90-day probation period.\n• 30-day notice period during probation, 60-day notice post confirmation.\n• Contingent upon standard background checks and NDA execution.',
      },
      {
        id: 'sec_5',
        type: 'signature',
        title: 'Candidate Acceptance & Acknowledgment',
        body: 'I accept the terms and conditions stated in this offer letter.',
      },
    ],
  },
  {
    name: 'Project Completion & Handover Certificate',
    category: 'Operational',
    documentType: 'Completion Certificate',
    description: 'Official sign-off certifying complete verification, user acceptance testing (UAT), and operational handover of deliverables.',
    layoutConfig: { primaryColor: '#4f46e5', theme: 'corporate' },
    defaultVariables: {
      project_name: 'Enterprise System Handover',
      handover_status: 'Complete & Accepted',
    },
    sections: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Certificate of Operational Completion & Handover',
        body: 'This document formally certifies that all contracted deliverables have been thoroughly tested, validated, and transferred to the client.',
      },
      {
        id: 'sec_2',
        type: 'table',
        title: 'Deliverable Verification Checklist',
        tableData: {
          headers: ['Deliverable / Component', 'Specification Target', 'Result', 'Handover Status'],
          rows: [
            ['Cloud Application Core', 'Production deployment with SSL', 'PASSED', 'Verified & Deployed'],
            ['Automated Test Coverage', '90%+ unit & integration tests', 'PASSED', 'Verified'],
            ['User Acceptance Testing (UAT)', 'Sign-off on all user stories', 'PASSED', 'Client Approved'],
          ],
        },
      },
      {
        id: 'sec_3',
        type: 'terms',
        title: 'Warranty & Support Period',
        body: 'A 30-calendar-day warranty begins from the date of this certificate. Operational defects reported within this window will be addressed under priority SLA.',
      },
      {
        id: 'sec_4',
        type: 'signature',
        title: 'Handover & Final Acceptance Signatures',
        body: 'Signed by Project Manager and Client Executive Sponsor.',
      },
    ],
  },
];

/**
 * Ensure standard system templates are seeded for an organisation
 */
async function ensureStandardTemplates(organisationId) {
  const existingCount = await prisma.unifiedDocumentTemplate.count({
    where: { organisationId },
  });

  if (existingCount === 0) {
    for (const tpl of STANDARD_SYSTEM_TEMPLATES) {
      await prisma.unifiedDocumentTemplate.create({
        data: {
          organisationId,
          name: tpl.name,
          category: tpl.category,
          documentType: tpl.documentType,
          description: tpl.description,
          layoutConfig: tpl.layoutConfig,
          sections: tpl.sections,
          defaultVariables: tpl.defaultVariables,
          isStandard: true,
        },
      });
    }
  }

  return prisma.unifiedDocumentTemplate.findMany({
    where: { organisationId, isArchived: false },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * List templates for an organisation
 */
async function listTemplates(organisationId, query = {}) {
  await ensureStandardTemplates(organisationId);

  const { category, documentType, search } = query;
  const where = { organisationId, isArchived: false };

  if (category && category !== 'All') where.category = category;
  if (documentType && documentType !== 'All') where.documentType = documentType;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { documentType: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.unifiedDocumentTemplate.findMany({
    where,
    orderBy: [{ isStandard: 'desc' }, { updatedAt: 'desc' }],
    include: {
      _count: { select: { documents: true } },
    },
  });
}

/**
 * Get template by ID
 */
async function getTemplateById(id, organisationId) {
  const template = await prisma.unifiedDocumentTemplate.findFirst({
    where: { id, organisationId },
    include: {
      _count: { select: { documents: true } },
    },
  });

  if (!template) {
    throw new Error('Template not found or unauthorized.');
  }

  return template;
}

/**
 * Create a new custom template
 */
async function createTemplate(organisationId, data) {
  const { name, category = 'General', documentType = 'Custom Document', description, layoutConfig, sections, defaultVariables } = data;

  if (!name || !name.trim()) throw new Error('Template name is required.');

  return prisma.unifiedDocumentTemplate.create({
    data: {
      organisationId,
      name: name.trim(),
      category: category.trim(),
      documentType: documentType.trim(),
      description: description ? description.trim() : null,
      layoutConfig: layoutConfig || { primaryColor: '#1e3a8a', theme: 'modern' },
      sections: Array.isArray(sections) ? sections : [],
      defaultVariables: defaultVariables || {},
      isStandard: false,
    },
  });
}

/**
 * Update template
 */
async function updateTemplate(id, organisationId, data) {
  await getTemplateById(id, organisationId);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.category !== undefined) updateData.category = data.category.trim();
  if (data.documentType !== undefined) updateData.documentType = data.documentType.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.layoutConfig !== undefined) updateData.layoutConfig = data.layoutConfig;
  if (data.sections !== undefined) updateData.sections = Array.isArray(data.sections) ? data.sections : [];
  if (data.defaultVariables !== undefined) updateData.defaultVariables = data.defaultVariables;

  return prisma.unifiedDocumentTemplate.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete / archive template
 */
async function deleteTemplate(id, organisationId) {
  const existing = await getTemplateById(id, organisationId);

  if (existing.isStandard) {
    return prisma.unifiedDocumentTemplate.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  const docCount = await prisma.unifiedDocument.count({ where: { templateId: id } });
  if (docCount > 0) {
    return prisma.unifiedDocumentTemplate.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  return prisma.unifiedDocumentTemplate.delete({ where: { id } });
}

module.exports = {
  ensureStandardTemplates,
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
