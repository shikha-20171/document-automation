const AIGateway = require('./aiGateway/AIGateway');
const { calculateQuotationFinancials, round2 } = require('../utils/pricingCalculator');

/**
 * Universal Intent Classifier & Document Type Registry
 */
const DOCUMENT_TYPE_REGISTRY = [
  // Sales & Commercial
  { type: 'Quotation', category: 'Sales', keywords: ['quotation', 'quote', 'pricing', 'commercial estimate', 'cost estimate'] },
  { type: 'Estimate', category: 'Sales', keywords: ['estimate', 'estimation', 'rough quote'] },
  { type: 'Invoice', category: 'Sales', keywords: ['invoice', 'bill', 'tax invoice', 'billing', 'payment due'] },
  { type: 'Proforma Invoice', category: 'Sales', keywords: ['proforma', 'pro-forma', 'advance bill'] },
  { type: 'Purchase Order', category: 'Sales', keywords: ['purchase order', 'po ', 'p.o.', 'order hardware', 'order laptops', 'procurement order'] },
  { type: 'Sales Order', category: 'Sales', keywords: ['sales order', 'client order'] },
  { type: 'Credit Note', category: 'Sales', keywords: ['credit note', 'refund note'] },
  { type: 'Receipt', category: 'Sales', keywords: ['receipt', 'payment receipt', 'acknowledgement of payment'] },

  // Business Documents
  { type: 'Business Proposal', category: 'Business', keywords: ['business proposal', 'proposal', 'pitch', 'client pitch', 'bidding'] },
  { type: 'Project Proposal', category: 'Business', keywords: ['project proposal', 'technical proposal', 'solution proposal'] },
  { type: 'Business Letter', category: 'Business', keywords: ['business letter', 'formal letter', 'official letter'] },
  { type: 'Cover Letter', category: 'Business', keywords: ['cover letter', 'transmittal letter'] },
  { type: 'Statement of Work', category: 'Business', keywords: ['statement of work', 'sow', 'scope of work', 'project scope'] },
  { type: 'Project Brief', category: 'Business', keywords: ['project brief', 'creative brief', 'kickoff brief'] },
  { type: 'Project Report', category: 'Business', keywords: ['project report', 'status report', 'progress report', 'monthly report'] },
  { type: 'Meeting Minutes', category: 'Business', keywords: ['meeting minutes', 'mom', 'minutes of meeting', 'board minutes'] },
  { type: 'Business Plan', category: 'Business', keywords: ['business plan', 'executive summary', 'go to market'] },

  // Legal & Agreements
  { type: 'NDA', category: 'Legal', keywords: ['nda', 'non-disclosure', 'confidentiality agreement', 'secret agreement'] },
  { type: 'Service Agreement', category: 'Legal', keywords: ['service agreement', 'master service agreement', 'msa', 'services agreement'] },
  { type: 'Consultancy Agreement', category: 'Legal', keywords: ['consultancy agreement', 'consulting contract', 'advisor agreement'] },
  { type: 'Vendor Agreement', category: 'Legal', keywords: ['vendor agreement', 'supplier agreement', 'procurement contract'] },
  { type: 'Partnership Agreement', category: 'Legal', keywords: ['partnership agreement', 'cooperation agreement', 'joint venture'] },
  { type: 'Contract', category: 'Legal', keywords: ['contract', 'sales contract', 'legal contract', 'agreement between'] },
  { type: 'Terms & Conditions', category: 'Legal', keywords: ['terms and conditions', 'terms of service', 'tos', 'website terms'] },
  { type: 'Privacy Policy', category: 'Legal', keywords: ['privacy policy', 'gdpr policy', 'data protection'] },
  { type: 'Memorandum of Understanding', category: 'Legal', keywords: ['mou', 'memorandum of understanding'] },

  // HR Documents
  { type: 'Offer Letter', category: 'HR', keywords: ['offer letter', 'employment offer', 'job offer', 'hire', 'candidate offer', 'joining'] },
  { type: 'Appointment Letter', category: 'HR', keywords: ['appointment letter', 'letter of appointment'] },
  { type: 'Employment Agreement', category: 'HR', keywords: ['employment agreement', 'employment contract', 'employee bond'] },
  { type: 'Experience Letter', category: 'HR', keywords: ['experience letter', 'work experience', 'service certificate'] },
  { type: 'Relieving Letter', category: 'HR', keywords: ['relieving letter', 'release letter', 'resignation acceptance'] },
  { type: 'Salary Certificate', category: 'HR', keywords: ['salary certificate', 'income certificate', 'pay slip letter'] },
  { type: 'Internship Certificate', category: 'HR', keywords: ['internship certificate', 'intern letter', 'internship completion'] },
  { type: 'Warning Letter', category: 'HR', keywords: ['warning letter', 'disciplinary notice', 'show cause'] },

  // Operational Documents
  { type: 'Work Order', category: 'Operational', keywords: ['work order', 'job order', 'maintenance order'] },
  { type: 'Delivery Note', category: 'Operational', keywords: ['delivery note', 'dispatch note', 'packing slip'] },
  { type: 'Completion Certificate', category: 'Operational', keywords: ['completion certificate', 'handover certificate', 'signoff certificate', 'project completion'] },
  { type: 'Service Report', category: 'Operational', keywords: ['service report', 'field report', 'site inspection'] },
  { type: 'Incident Report', category: 'Operational', keywords: ['incident report', 'security incident', 'post-mortem', 'bug report'] },
  { type: 'Expense Report', category: 'Operational', keywords: ['expense report', 'reimbursement claim', 'travel claim'] },
];

/**
 * Detect Document Intent & Classify from user's natural language input
 * @param {string} prompt User's natural language instruction
 * @returns {Object} { documentType, category, confidence, extractedEntities }
 */
function detectDocumentIntent(prompt) {
  const text = (prompt || '').trim().toLowerCase();
  if (!text) {
    return {
      documentType: 'Custom Document',
      category: 'Custom',
      confidence: 0.5,
      extractedEntities: {},
    };
  }

  // 1. Check keyword registry matching
  let bestMatch = null;
  let maxScore = 0;

  for (const item of DOCUMENT_TYPE_REGISTRY) {
    for (const kw of item.keywords) {
      if (text.includes(kw)) {
        const score = kw.length; // Longer matches carry higher confidence
        if (score > maxScore) {
          maxScore = score;
          bestMatch = item;
        }
      }
    }
  }

  // 2. Extract entities
  const extracted = extractCommonEntities(prompt);

  if (bestMatch) {
    return {
      documentType: bestMatch.type,
      category: bestMatch.category,
      confidence: 0.95,
      extractedEntities: extracted,
    };
  }

  // Fallback to custom
  return {
    documentType: 'Custom Document',
    category: 'Custom',
    confidence: 0.6,
    extractedEntities: extracted,
  };
}

/**
 * Extract entities from raw text (Amounts, Client/Person names, Dates)
 */
function extractCommonEntities(text) {
  const res = {
    clientName: null,
    amount: null,
    currency: 'INR',
    dates: null,
    role: null,
  };

  // Currency
  if (/\$|usd|dollar/i.test(text)) res.currency = 'USD';
  else if (/€|eur|euro/i.test(text)) res.currency = 'EUR';
  else if (/£|gbp/i.test(text)) res.currency = 'GBP';

  // Amount
  const lakhMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i);
  const rawNumMatch = text.match(/(?:₹|rs\.?|\$|€|£)?\s*([\d,]+(?:\.\d+)?)/i);
  if (lakhMatch && lakhMatch[1]) {
    res.amount = parseFloat(lakhMatch[1]) * 100000;
  } else if (rawNumMatch && rawNumMatch[1]) {
    const num = parseFloat(rawNumMatch[1].replace(/,/g, ''));
    if (!isNaN(num) && num > 50) res.amount = num;
  }

  // Client / Partner Name
  const clientMatch = text.match(/(?:for|between|with|to)\s+([A-Za-z0-9\s&]+?)(?:\s+(?:worth|for|regarding|with|at|amount|to|dated|\.|$))/i);
  if (clientMatch && clientMatch[1]) {
    const raw = clientMatch[1].trim();
    if (!['a', 'an', 'the', 'website', 'app', 'software', 'project', 'company'].includes(raw.toLowerCase())) {
      res.clientName = raw;
    }
  }

  // Role / Position (for HR)
  const roleMatch = text.match(/(?:for\s+(?:a|an)?\s*)(frontend developer|backend developer|full stack developer|software engineer|product manager|ui\/ux designer|sales manager|marketing specialist|accountant|consultant)/i);
  if (roleMatch && roleMatch[1]) {
    res.role = roleMatch[1].trim();
  }

  return res;
}

/**
 * AI Service to generate a complete, structured document based on natural language prompt
 */
async function generateStructuredDocumentFromAI({
  prompt,
  organisationId,
  userId,
  clientContext = null,
  templateContext = null,
  documentTypeOverride = null,
  categoryOverride = null,
}) {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) {
    throw new Error('Prompt is required to generate document.');
  }

  // 1. Detect Intent
  const detected = detectDocumentIntent(cleanPrompt);
  const documentType = documentTypeOverride || templateContext?.documentType || detected.documentType;
  const category = categoryOverride || templateContext?.category || detected.category;

  const systemPrompt = `
You are an Enterprise AI Document Architect.
Your task is to take a natural language instruction and generate a complete, professional, highly-structured business document.

The requested document type is: "${documentType}" (Category: "${category}").

You MUST return ONLY valid JSON matching this schema:
{
  "title": "Clear, professional document title (e.g. 'Software Services Agreement', 'Employment Offer Letter')",
  "documentType": "${documentType}",
  "category": "${category}",
  "clientName": "Extracted or inferred client/company/candidate name",
  "clientEmail": "Extracted email or null",
  "clientPhone": "Extracted phone or null",
  "clientAddress": "Extracted address or null",
  "clientContactPerson": "Contact person name or null",
  "variables": {
    "company_name": "Company Name",
    "client_name": "Client or Candidate Name",
    "document_date": "Today's Date",
    "valid_until": "Expiry Date (if applicable)",
    "amount": "Total Amount or Salary (if applicable)",
    "payment_terms": "Payment schedule (if applicable)"
  },
  "financialData": {
    "currency": "INR or USD",
    "subtotal": 0,
    "discountValue": 0,
    "taxRate": 18,
    "total": 0
  },
  "content": [
    {
      "id": "sec_1",
      "type": "header",
      "title": "Document Heading / Metadata",
      "body": "Opening statement or recital..."
    },
    {
      "id": "sec_2",
      "type": "text",
      "title": "Scope of Work / Responsibilities / Terms",
      "body": "Detailed professional clauses, numbered paragraphs, and obligations..."
    },
    {
      "id": "sec_3",
      "type": "table",
      "title": "Deliverables / Fees / Items (if applicable)",
      "tableData": {
        "headers": ["Item / Milestone", "Description", "Qty", "Unit", "Rate", "Amount"],
        "rows": [
          ["Deliverable 1", "Scope detail", "1", "unit", "50000", "50000"]
        ]
      }
    },
    {
      "id": "sec_4",
      "type": "terms",
      "title": "Terms, Conditions & Payment Milestones",
      "body": "Governing laws, delivery SLA, termination clauses, and dispute resolution..."
    },
    {
      "id": "sec_5",
      "type": "signature",
      "title": "Authorized Signatures",
      "body": "Sign-off agreement block for both parties."
    }
  ]
}

RULES:
1. Generate realistic, comprehensive, enterprise-grade business clauses and paragraphs, not placeholders.
2. If the document has a financial component (Quotation, Invoice, Purchase Order, Offer Letter salary), structure the tables and calculate numbers realistically.
3. If clientContext or templateContext are provided, weave them seamlessly into the content.
4. Output ONLY the raw JSON object.
`.trim();

  let contextDescription = '';
  if (clientContext) {
    contextDescription += `\nClient Context: Name: "${clientContext.name}", Email: "${clientContext.email || ''}", Contact: "${clientContext.contactPerson || ''}", Address: "${clientContext.address || ''}"`;
  }
  if (templateContext) {
    contextDescription += `\nTemplate Structure: Name: "${templateContext.name}", Category: "${templateContext.category}", Type: "${templateContext.documentType}"`;
  }

  const userPrompt = `
User Instruction:
"${cleanPrompt}"
${contextDescription}
`.trim();

  let parsed = null;

  try {
    const aiResult = await AIGateway.execute({
      organisationId,
      userId,
      operation: 'generateText',
      feature: 'ai_document_builder',
      module: 'documents',
      params: {
        prompt: userPrompt,
        systemPrompt,
        temperature: 0.15,
        maxTokens: 4000,
      },
    });

    if (aiResult && aiResult.text) {
      parsed = extractJsonFromText(aiResult.text);
    }
  } catch (err) {
    console.warn('[AIDocumentBuilderService] AI Gateway execution notice:', err.message);
  }

  // Fallback to rich heuristic generator if AI output is empty or malformed
  if (!parsed || !parsed.content || !Array.isArray(parsed.content) || parsed.content.length === 0) {
    parsed = generateHeuristicDocument(cleanPrompt, documentType, category, clientContext, templateContext);
  }

  // Apply Client Context overrides if specified
  if (clientContext) {
    if (clientContext.name) parsed.clientName = clientContext.name;
    if (clientContext.email) parsed.clientEmail = clientContext.email;
    if (clientContext.contactPerson) parsed.clientContactPerson = clientContext.contactPerson;
    if (clientContext.phone) parsed.clientPhone = clientContext.phone;
    if (clientContext.address || clientContext.city) {
      parsed.clientAddress = [clientContext.address, clientContext.city, clientContext.state, clientContext.country].filter(Boolean).join(', ');
    }
  }

  // Ensure variables object is populated
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  parsed.variables = {
    company_name: parsed.variables?.company_name || 'Enterprise Solutions',
    client_name: parsed.clientName || 'Valued Client',
    client_address: parsed.clientAddress || '',
    document_date: todayStr,
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    ...(parsed.variables || {}),
  };

  // If financial data exists with table rows, recalculate deterministically
  if (parsed.financialData && (category === 'Sales' || parsed.financialData.total > 0)) {
    const tableSec = parsed.content.find((s) => s.type === 'table');
    if (tableSec && tableSec.tableData && Array.isArray(tableSec.tableData.rows)) {
      const lineItems = tableSec.tableData.rows.map((r) => {
        const qty = parseFloat(r[2]) || 1;
        const rate = parseFloat(r[4]) || 0;
        return {
          title: r[0] || 'Item',
          description: r[1] || '',
          quantity: qty,
          unit: r[3] || 'unit',
          unitPrice: rate,
        };
      });

      const financials = calculateQuotationFinancials(lineItems, {
        discountType: 'PERCENTAGE',
        discountValue: parsed.financialData.discountValue || 0,
        taxRate: parsed.financialData.taxRate !== undefined ? parsed.financialData.taxRate : 18,
      });

      parsed.financialData = {
        currency: parsed.financialData.currency || 'INR',
        subtotal: financials.subtotal,
        discountType: financials.discountType,
        discountValue: financials.discountValue,
        discountAmount: financials.discountAmount,
        taxRate: financials.taxRate,
        taxAmount: financials.taxAmount,
        total: financials.total,
      };
      parsed.variables.amount = String(financials.total);
    }
  }

  return {
    title: parsed.title || `${documentType} - ${parsed.clientName || 'General'}`,
    documentType,
    category,
    clientName: parsed.clientName || null,
    clientEmail: parsed.clientEmail || null,
    clientPhone: parsed.clientPhone || null,
    clientAddress: parsed.clientAddress || null,
    clientContactPerson: parsed.clientContactPerson || null,
    variables: parsed.variables,
    financialData: parsed.financialData || null,
    content: parsed.content,
    aiPrompt: cleanPrompt,
  };
}

/**
 * Extract JSON safely from raw LLM text
 */
function extractJsonFromText(text) {
  if (!text) return null;
  let clean = text.trim();
  if (clean.includes('```')) {
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) clean = match[1].trim();
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      } catch (err2) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Resilient Heuristic Generator covering all 5 core domains & custom types
 */
function generateHeuristicDocument(prompt, documentType, category, clientContext, templateContext) {
  const entities = extractCommonEntities(prompt);
  const clientName = clientContext?.name || entities.clientName || 'Valued Partner';
  const amount = entities.amount || 150000;
  const currency = entities.currency || 'INR';

  switch (category) {
    case 'HR':
      return generateHeuristicHrDocument(documentType, clientName, entities);
    case 'Legal':
      return generateHeuristicLegalDocument(documentType, clientName, entities);
    case 'Sales':
      return generateHeuristicSalesDocument(documentType, clientName, amount, currency);
    case 'Operational':
      return generateHeuristicOperationalDocument(documentType, clientName, entities);
    default:
      return generateHeuristicBusinessDocument(documentType, clientName, amount, currency);
  }
}

function generateHeuristicHrDocument(documentType, candidateName, entities) {
  const role = entities.role || 'Software Engineer';
  return {
    title: `${documentType} - ${candidateName}`,
    documentType,
    category: 'HR',
    clientName: candidateName,
    variables: {
      candidate_name: candidateName,
      designation: role,
      joining_date: '1st of next month',
      salary: entities.amount ? `₹${entities.amount.toLocaleString('en-IN')} per annum` : '₹12,00,000 per annum (CTC)',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Employment Offer & Appointment Terms',
        body: `Dear ${candidateName},\n\nWe are pleased to offer you the position of ${role} with our organization. Following your interviews, we were thoroughly impressed by your credentials and look forward to welcoming you to our engineering division.`,
      },
      {
        id: 'sec_2',
        type: 'text',
        title: 'Role, Responsibilities & Reporting',
        body: `1. You will report directly to the Director of Engineering.\n2. Your work location will be Hybrid / Head Office.\n3. Standard working hours are Monday through Friday, 9:30 AM to 6:30 PM.\n4. You will be responsible for system architecture, scalable software modules, and pair code reviews.`,
      },
      {
        id: 'sec_3',
        type: 'table',
        title: 'Annual Compensation Package (CTC Breakdown)',
        tableData: {
          headers: ['Salary Component', 'Monthly (INR)', 'Annualized (INR)'],
          rows: [
            ['Basic Salary', '50,000', '6,00,000'],
            ['House Rent Allowance (HRA)', '25,000', '3,00,000'],
            ['Special & Performance Allowance', '20,000', '2,40,000'],
            ['Provident Fund (Employer Share)', '5,000', '60,000'],
            ['Total Cost to Company (CTC)', '1,00,000', '12,00,000'],
          ],
        },
      },
      {
        id: 'sec_4',
        type: 'terms',
        title: 'Probation & Notice Period',
        body: '• Initial probation period of 90 calendar days from commencement.\n• Notice period of 30 days during probation, and 60 days upon confirmation.\n• Offer is contingent upon standard background verification and reference checks.',
      },
      {
        id: 'sec_5',
        type: 'signature',
        title: 'Acceptance & Sign-Off',
        body: `I, ${candidateName}, accept the offer on the terms and conditions outlined above and confirm my joining date.`,
      },
    ],
  };
}

function generateHeuristicLegalDocument(documentType, partnerName, entities) {
  return {
    title: `${documentType} between Enterprise Solutions and ${partnerName}`,
    documentType,
    category: 'Legal',
    clientName: partnerName,
    variables: {
      disclosing_party: 'Enterprise Solutions Tech Pvt Ltd',
      receiving_party: partnerName,
      effective_date: new Date().toLocaleDateString('en-GB'),
      term_period: '3 (three) years',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Parties & Recitals',
        body: `This Non-Disclosure & Confidentiality Agreement is entered into as of ${new Date().toLocaleDateString('en-GB')} by and between:\n\n1. Enterprise Solutions Tech Pvt Ltd ("Disclosing Party"), and\n2. ${partnerName} ("Receiving Party").\n\nThe parties intend to discuss commercial collaboration and service provision requiring disclosure of proprietary information.`,
      },
      {
        id: 'sec_2',
        type: 'text',
        title: '1. Definition of Confidential Information',
        body: '"Confidential Information" includes all technical architectures, source code, client records, pricing algorithms, trade secrets, business roadmaps, and intellectual property disclosed in written, oral, or electronic form.',
      },
      {
        id: 'sec_3',
        type: 'text',
        title: '2. Obligations of Non-Disclosure',
        body: 'The Receiving Party shall:\n(a) Hold all Confidential Information in strict confidence with highest duty of care.\n(b) Restrict access solely to employees with a direct need-to-know.\n(c) Not copy, reverse-engineer, or distribute any proprietary material without prior written consent.',
      },
      {
        id: 'sec_4',
        type: 'terms',
        title: '3. Governing Law & Jurisdiction',
        body: 'This Agreement shall be construed and enforced under the laws of the jurisdiction. Any disputes shall be resolved through binding arbitration under the Arbitration and Conciliation Act.',
      },
      {
        id: 'sec_5',
        type: 'signature',
        title: 'Authorized Execution',
        body: 'In witness whereof, the parties have executed this Agreement by their authorized representatives.',
      },
    ],
  };
}

function generateHeuristicSalesDocument(documentType, clientName, amount, currency) {
  const p1 = round2(amount * 0.3);
  const p2 = round2(amount * 0.5);
  const p3 = round2(amount - (p1 + p2));

  return {
    title: `${documentType} for ${clientName}`,
    documentType,
    category: 'Sales',
    clientName,
    financialData: {
      currency,
      subtotal: amount,
      discountValue: 0,
      discountAmount: 0,
      taxRate: 18,
      taxAmount: round2(amount * 0.18),
      total: round2(amount * 1.18),
    },
    variables: {
      client_name: clientName,
      amount: String(amount),
      payment_terms: '50% advance on sign-off, 50% upon milestone completion',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: `${documentType} Specification`,
        body: `Commercial deliverable schedule and investment proposal prepared for ${clientName}.`,
      },
      {
        id: 'sec_2',
        type: 'table',
        title: 'Deliverables & Line Items',
        tableData: {
          headers: ['Item / Milestone', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
          rows: [
            ['Phase 1: Solution Architecture & Wireframes', 'Design systems & technical specifications', '1', 'milestone', String(p1), String(p1)],
            ['Phase 2: Core Engineering & Integrations', 'Frontend & backend development with API services', '1', 'milestone', String(p2), String(p2)],
            ['Phase 3: QA Hardening & Deployment', 'Cross-browser testing, cloud setup & warranty', '1', 'milestone', String(p3), String(p3)],
          ],
        },
      },
      {
        id: 'sec_3',
        type: 'terms',
        title: 'Payment Terms & Schedule',
        body: '1. Quotation/Invoice valid for 30 calendar days.\n2. Work initiates within 3 business days of payment clearance.\n3. IP and production credentials transferred upon final settlement.',
      },
      {
        id: 'sec_4',
        type: 'signature',
        title: 'Authorized Signatures',
        body: 'Client sign-off confirms acceptance of the scope and payment schedule outlined.',
      },
    ],
  };
}

function generateHeuristicOperationalDocument(documentType, clientName, entities) {
  return {
    title: `${documentType} - ${clientName}`,
    documentType,
    category: 'Operational',
    clientName,
    variables: {
      client_name: clientName,
      completion_date: new Date().toLocaleDateString('en-GB'),
      signoff_status: 'Completed & Accepted',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: `${documentType} Summary`,
        body: `Official operational record certifying the execution, verification, and handover of services for ${clientName}.`,
      },
      {
        id: 'sec_2',
        type: 'table',
        title: 'Inspection & Milestone Checklist',
        tableData: {
          headers: ['Deliverable / Item', 'Specification', 'Result', 'Verification Status'],
          rows: [
            ['Core Module Deployment', 'Containerized cloud deployment', 'PASSED', 'Verified'],
            ['Security Audit', 'Penetration testing & OWASP compliance', 'PASSED', 'Verified'],
            ['User Acceptance Testing (UAT)', 'End-to-end user workflows', 'PASSED', 'Accepted by Client'],
          ],
        },
      },
      {
        id: 'sec_3',
        type: 'terms',
        title: 'Operational Warranty & Hypercare',
        body: 'The deliverables covered under this certificate are warranted for 30 business days against operational defects. Ongoing maintenance is governed under the master agreement.',
      },
      {
        id: 'sec_4',
        type: 'signature',
        title: 'Handover & Acceptance Signatures',
        body: 'Signed by Project Lead and Client Operational Sponsor.',
      },
    ],
  };
}

function generateHeuristicBusinessDocument(documentType, clientName, amount, currency) {
  return {
    title: `${documentType} for ${clientName}`,
    documentType,
    category: 'Business',
    clientName,
    variables: {
      client_name: clientName,
      project_name: 'Strategic Implementation & Engineering',
      duration: '60 Calendar Days',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Executive Summary',
        body: `This proposal outlines our strategic approach to delivering high-impact technological solutions for ${clientName}. Our engineering methodologies ensure rapid time-to-market and robust scalability.`,
      },
      {
        id: 'sec_2',
        type: 'text',
        title: 'Project Objectives & Scope',
        body: '• Build scalable, modern responsive digital interfaces.\n• Establish microservices architecture with enterprise security.\n• Implement automated CI/CD deployment pipelines.\n• Ensure full technical documentation and operational handover.',
      },
      {
        id: 'sec_3',
        type: 'table',
        title: 'Implementation Timeline & Milestones',
        tableData: {
          headers: ['Sprint', 'Key Milestone', 'Estimated Timeline', 'Deliverables'],
          rows: [
            ['Sprint 1', 'Architecture & Wireframes', '2 Weeks', 'Figma prototypes, PRD, and schema'],
            ['Sprint 2', 'Core Module Engineering', '4 Weeks', 'Full-stack application and authenticated APIs'],
            ['Sprint 3', 'Testing, UAT & Deployment', '2 Weeks', 'End-to-end test suite and production launch'],
          ],
        },
      },
      {
        id: 'sec_4',
        type: 'terms',
        title: 'Governance & Escalation',
        body: 'Weekly sprint reviews with executive sponsors. Change requests outside agreed scope will be evaluated via standard amendment protocols.',
      },
      {
        id: 'sec_5',
        type: 'signature',
        title: 'Authorization & Sign-Off',
        body: 'Signatures indicate mutual approval of the project objectives and timeline.',
      },
    ],
  };
}

module.exports = {
  detectDocumentIntent,
  generateStructuredDocumentFromAI,
  DOCUMENT_TYPE_REGISTRY,
};
