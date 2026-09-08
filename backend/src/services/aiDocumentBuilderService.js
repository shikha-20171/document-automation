const AIGateway = require('./aiGateway/AIGateway');
const prisma = require('../config/prismaClient');
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
 * Extract entities from raw text (Company, Client/Person names, Amounts, Dates, Roles)
 */
function extractCommonEntities(text) {
  const res = {
    companyName: null,
    clientName: null,
    amount: null,
    currency: 'INR',
    dates: null,
    role: null,
  };

  const clean = (text || '').trim();
  if (!clean) return res;

  // Currency
  if (/\$|usd|dollar/i.test(clean)) res.currency = 'USD';
  else if (/€|eur|euro/i.test(clean)) res.currency = 'EUR';
  else if (/£|gbp/i.test(clean)) res.currency = 'GBP';

  // Amount
  const lakhMatch = clean.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i);
  const rawNumMatch = clean.match(/(?:₹|rs\.?|\$|€|£)?\s*([\d,]+(?:\.\d+)?)/i);
  if (lakhMatch && lakhMatch[1]) {
    res.amount = parseFloat(lakhMatch[1]) * 100000;
  } else if (rawNumMatch && rawNumMatch[1]) {
    const num = parseFloat(rawNumMatch[1].replace(/,/g, ''));
    if (!isNaN(num) && num > 50) res.amount = num;
  }

  // 1. Hindi Pairwise: "X ki taraf se Y ke liye"
  const hindiTarafLiye = clean.match(/([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})\s+ki\s+taraf\s+se\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})\s+ke\s+liye/i);
  if (hindiTarafLiye) {
    res.companyName = hindiTarafLiye[1].trim();
    res.clientName = hindiTarafLiye[2].trim();
  }

  // 2. Hindi Pairwise: "Y ke liye X ki taraf se"
  if (!res.companyName || !res.clientName) {
    const hindiLiyeTaraf = clean.match(/([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})\s+ke\s+liye\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})\s+ki\s+taraf\s+se/i);
    if (hindiLiyeTaraf) {
      if (!res.clientName) res.clientName = hindiLiyeTaraf[1].trim();
      if (!res.companyName) res.companyName = hindiLiyeTaraf[2].trim();
    }
  }

  // 3. English Pairwise: "between X and Y"
  if (!res.companyName || !res.clientName) {
    const betweenMatch = clean.match(/between\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})\s+(?:and|&)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})/i);
    if (betweenMatch) {
      const c1 = betweenMatch[1].trim();
      const c2 = betweenMatch[2].trim();
      const blacklist = ['a', 'an', 'the', 'us', 'them', 'both'];
      if (!blacklist.includes(c1.toLowerCase()) && !res.companyName) res.companyName = c1;
      if (!blacklist.includes(c2.toLowerCase()) && !res.clientName) res.clientName = c2;
    }
  }

  // 4. English Pairwise: "from/by X for/to Y"
  if (!res.companyName || !res.clientName) {
    const mFromFor = clean.match(/(?:from|by)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})\s+(?:for|to)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})/i);
    if (mFromFor) {
      if (!res.companyName) res.companyName = mFromFor[1].trim();
      if (!res.clientName) res.clientName = mFromFor[2].trim();
    }
  }

  // 5. English Pairwise: "for/to Y from/by X"
  if (!res.companyName || !res.clientName) {
    const mForFrom = clean.match(/(?:for|to)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})\s+(?:from|by)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})/i);
    if (mForFrom) {
      if (!res.clientName) res.clientName = mForFrom[1].trim();
      if (!res.companyName) res.companyName = mForFrom[2].trim();
    }
  }

  // 6. Standalone Company patterns
  if (!res.companyName) {
    const standaloneFrom = clean.match(/(?:from|by|on\s+behalf\s+of|issued\s+by|company[:\s]+|disclosing\s+party[:\s]+)\s+([A-Za-z0-9\s&.,'-]+?)(?:\s+(?:for|to|ke\s+liye|regarding|worth|with|dated|\.|$))/i);
    if (standaloneFrom && standaloneFrom[1]) {
      const rawComp = standaloneFrom[1].trim();
      const blacklist = ['a', 'an', 'the', 'website', 'app', 'software', 'project', 'company', 'scratch', 'template', 'ai'];
      if (!blacklist.includes(rawComp.toLowerCase())) {
        res.companyName = rawComp;
      }
    }
  }

  if (!res.companyName) {
    const standaloneTaraf = clean.match(/([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})\s+ki\s+taraf\s+se/i);
    if (standaloneTaraf && standaloneTaraf[1]) {
      const rawComp = standaloneTaraf[1].trim();
      const blacklist = ['a', 'an', 'the', 'website', 'app', 'software', 'project', 'company'];
      if (!blacklist.includes(rawComp.toLowerCase())) {
        res.companyName = rawComp;
      }
    }
  }

  // 7. Standalone Client patterns
  if (!res.clientName) {
    const standaloneClient = clean.match(/(?:for|to|client[:\s]+|customer[:\s]+|recipient[:\s]+|candidate[:\s]+)\s+([A-Za-z0-9\s&.,'-]+?)(?:\s+(?:from|by|ki\s+taraf\s+se|worth|regarding|with|at|amount|dated|\.|$))/i);
    if (standaloneClient && standaloneClient[1]) {
      const raw = standaloneClient[1].trim();
      const blacklist = ['a', 'an', 'the', 'website', 'app', 'software', 'project', 'company', 'client', 'employee', 'candidate', 'developer'];
      if (!blacklist.includes(raw.toLowerCase())) {
        res.clientName = raw;
      }
    }
  }

  if (!res.clientName) {
    const standaloneLiye = clean.match(/([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4})\s+ke\s+liye/i);
    if (standaloneLiye && standaloneLiye[1]) {
      const raw = standaloneLiye[1].trim();
      const blacklist = ['a', 'an', 'the', 'website', 'app', 'software', 'project', 'company', 'document', 'quotation'];
      if (!blacklist.includes(raw.toLowerCase())) {
        res.clientName = raw;
      }
    }
  }

  // Role / Position (for HR)
  const roleMatch = clean.match(/(?:for\s+(?:a|an)?\s*)(frontend developer|backend developer|full stack developer|software engineer|product manager|ui\/ux designer|sales manager|marketing specialist|accountant|consultant)/i);
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
  companyName = null,
  templateContext = null,
  documentTypeOverride = null,
  categoryOverride = null,
}) {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) {
    throw new Error('Prompt is required to generate document.');
  }

  // 1. Fetch user's organisation name if available
  let defaultOrgName = 'Enterprise Solutions Tech Pvt Ltd';
  if (organisationId) {
    try {
      const org = await prisma.organisation.findUnique({
        where: { id: parseInt(organisationId, 10) },
        select: { name: true },
      });
      if (org && org.name) {
        defaultOrgName = org.name;
      }
    } catch (e) {
      // quiet fallback
    }
  }

  // 2. Detect Intent & Extract Entities
  const detected = detectDocumentIntent(cleanPrompt);
  const entities = extractCommonEntities(cleanPrompt);

  const effectiveCompanyName = (companyName || entities.companyName || defaultOrgName).trim();
  const effectiveClientName = (clientContext?.name || entities.clientName || 'Valued Client').trim();

  const documentType = documentTypeOverride || templateContext?.documentType || detected.documentType;
  const category = categoryOverride || templateContext?.category || detected.category;

  const systemPrompt = `
You are an Enterprise AI Document Architect.
Your task is to take a natural language instruction and generate a complete, professional, highly-structured business document.

The requested document type is: "${documentType}" (Category: "${category}").
Issuing Company (Party Creating Document): "${effectiveCompanyName}"
Client / Counterparty (Recipient Party): "${effectiveClientName}"

You MUST return ONLY valid JSON matching this schema:
{
  "title": "Clear, professional document title (e.g. 'Software Services Agreement', 'Employment Offer Letter')",
  "documentType": "${documentType}",
  "category": "${category}",
  "companyName": "${effectiveCompanyName}",
  "clientName": "${effectiveClientName}",
  "clientEmail": "Extracted email or null",
  "clientPhone": "Extracted phone or null",
  "clientAddress": "Extracted address or null",
  "clientContactPerson": "Contact person name or null",
  "variables": {
    "company_name": "${effectiveCompanyName}",
    "client_name": "${effectiveClientName}",
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
      "title": "Document Heading & Overview",
      "body": "Official document prepared by ${effectiveCompanyName} for ${effectiveClientName}..."
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
      "body": "Sign-off block between ${effectiveCompanyName} and ${effectiveClientName}."
    }
  ]
}

RULES:
1. Generate realistic, comprehensive, enterprise-grade business clauses and paragraphs, not placeholders.
2. If the document has a financial component (Quotation, Invoice, Purchase Order, Offer Letter salary), structure the tables and calculate numbers realistically.
3. CRITICAL: The document header section ("sec_1") MUST prominently display "${effectiveCompanyName}" as the issuing creator company and "${effectiveClientName}" as the client/recipient.
4. CRITICAL: The signature section ("sec_5") MUST explicitly state "For ${effectiveCompanyName} (Authorized Signatory)" and "Accepted by: ${effectiveClientName}".
5. Output ONLY the raw JSON object.
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
Issuing Company: "${effectiveCompanyName}"
Recipient/Client: "${effectiveClientName}"
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
    parsed = generateHeuristicDocument(cleanPrompt, documentType, category, clientContext, templateContext, effectiveCompanyName, effectiveClientName);
  }

  // Ensure top-level companyName and clientName are strictly assigned
  parsed.companyName = parsed.companyName || effectiveCompanyName;
  parsed.clientName = parsed.clientName || effectiveClientName;

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
    company_name: parsed.companyName || effectiveCompanyName,
    client_name: parsed.clientName || effectiveClientName,
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
    companyName: parsed.companyName || effectiveCompanyName,
    clientName: parsed.clientName || effectiveClientName,
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
function generateHeuristicDocument(prompt, documentType, category, clientContext, templateContext, companyName, clientName) {
  const entities = extractCommonEntities(prompt);
  const resolvedClientName = clientContext?.name || clientName || entities.clientName || 'Valued Partner';
  const resolvedCompanyName = companyName || entities.companyName || 'Enterprise Solutions Tech Pvt Ltd';
  const amount = entities.amount || 150000;
  const currency = entities.currency || 'INR';

  switch (category) {
    case 'HR':
      return generateHeuristicHrDocument(documentType, resolvedCompanyName, resolvedClientName, entities);
    case 'Legal':
      return generateHeuristicLegalDocument(documentType, resolvedCompanyName, resolvedClientName, entities);
    case 'Sales':
      return generateHeuristicSalesDocument(documentType, resolvedCompanyName, resolvedClientName, amount, currency);
    case 'Operational':
      return generateHeuristicOperationalDocument(documentType, resolvedCompanyName, resolvedClientName, entities);
    default:
      return generateHeuristicBusinessDocument(documentType, resolvedCompanyName, resolvedClientName, amount, currency);
  }
}

function generateHeuristicHrDocument(documentType, companyName, candidateName, entities) {
  const role = entities.role || 'Software Engineer';
  return {
    title: `${documentType} - ${candidateName}`,
    documentType,
    category: 'HR',
    companyName,
    clientName: candidateName,
    variables: {
      company_name: companyName,
      candidate_name: candidateName,
      client_name: candidateName,
      designation: role,
      joining_date: '1st of next month',
      salary: entities.amount ? `₹${entities.amount.toLocaleString('en-IN')} per annum` : '₹12,00,000 per annum (CTC)',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Employment Offer & Appointment Terms',
        body: `Dear ${candidateName},\n\nWe at ${companyName} are pleased to offer you the position of ${role} with our organization. Following your interviews, we were thoroughly impressed by your credentials and look forward to welcoming you to our team.`,
      },
      {
        id: 'sec_2',
        type: 'text',
        title: 'Role, Responsibilities & Reporting',
        body: `1. You will report directly to the Director of Engineering at ${companyName}.\n2. Your work location will be Hybrid / Head Office.\n3. Standard working hours are Monday through Friday, 9:30 AM to 6:30 PM.\n4. You will be responsible for system architecture, scalable software modules, and quality deliverables.`,
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
        body: `Signed by Authorized Signatory for ${companyName} and accepted by ${candidateName}.`,
      },
    ],
  };
}

function generateHeuristicLegalDocument(documentType, companyName, partnerName, entities) {
  return {
    title: `${documentType} between ${companyName} and ${partnerName}`,
    documentType,
    category: 'Legal',
    companyName,
    clientName: partnerName,
    variables: {
      company_name: companyName,
      disclosing_party: companyName,
      receiving_party: partnerName,
      client_name: partnerName,
      effective_date: new Date().toLocaleDateString('en-GB'),
      term_period: '3 (three) years',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Parties & Recitals',
        body: `This Non-Disclosure & Confidentiality Agreement is entered into as of ${new Date().toLocaleDateString('en-GB')} by and between:\n\n1. ${companyName} ("Disclosing Party"), and\n2. ${partnerName} ("Receiving Party").\n\nThe parties intend to discuss commercial collaboration and service provision requiring disclosure of proprietary information.`,
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
        body: `In witness whereof, ${companyName} and ${partnerName} have executed this Agreement by their authorized representatives.`,
      },
    ],
  };
}

function generateHeuristicSalesDocument(documentType, companyName, clientName, amount, currency) {
  const p1 = round2(amount * 0.3);
  const p2 = round2(amount * 0.5);
  const p3 = round2(amount - (p1 + p2));

  return {
    title: `${documentType} - ${clientName}`,
    documentType,
    category: 'Sales',
    companyName,
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
      company_name: companyName,
      client_name: clientName,
      amount: String(amount),
      payment_terms: '50% advance on sign-off, 50% upon milestone completion',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: `${documentType} Overview`,
        body: `Commercial deliverable schedule and investment proposal prepared by ${companyName} for ${clientName}.`,
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
        body: `Prepared by ${companyName}. Client sign-off confirms acceptance by ${clientName}.`,
      },
    ],
  };
}

function generateHeuristicOperationalDocument(documentType, companyName, clientName, entities) {
  return {
    title: `${documentType} - ${clientName}`,
    documentType,
    category: 'Operational',
    companyName,
    clientName,
    variables: {
      company_name: companyName,
      client_name: clientName,
      completion_date: new Date().toLocaleDateString('en-GB'),
      signoff_status: 'Completed & Accepted',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: `${documentType} Summary`,
        body: `Official operational record certifying the execution, verification, and handover of services by ${companyName} for ${clientName}.`,
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
        body: `Signed by Project Lead for ${companyName} and Client Operational Sponsor for ${clientName}.`,
      },
    ],
  };
}

function generateHeuristicBusinessDocument(documentType, companyName, clientName, amount, currency) {
  return {
    title: `${documentType} for ${clientName}`,
    documentType,
    category: 'Business',
    companyName,
    clientName,
    variables: {
      company_name: companyName,
      client_name: clientName,
      project_name: 'Strategic Implementation & Engineering',
      duration: '60 Calendar Days',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Executive Summary',
        body: `This proposal outlines the strategic approach of ${companyName} to delivering high-impact technological solutions for ${clientName}. Our engineering methodologies ensure rapid time-to-market and robust scalability.`,
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
        body: `Authorized by ${companyName} and Approved by ${clientName}.`,
      },
    ],
  };
}

module.exports = {
  detectDocumentIntent,
  generateStructuredDocumentFromAI,
  DOCUMENT_TYPE_REGISTRY,
};
