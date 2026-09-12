const AIGateway = require('./aiGateway/AIGateway');
const prisma = require('../config/prismaClient');
const { calculateQuotationFinancials, round2, formatCurrencyINR, numberToIndianWords } = require('../utils/pricingCalculator');
const { getOrganisationCompanyProfile, DEZORYN_CORPORATE_PROFILE } = require('./organisationProfileService');

function withTimeout(promise, ms = 5000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`AI Gateway request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Universal Intent Classifier & Document Type Registry
 */
const DOCUMENT_TYPE_REGISTRY = [
  // Sales & Commercial
  {
    type: 'Quotation',
    category: 'Sales',
    keywords: [
      'quotation',
      'quote',
      'create a quotation',
      'pricing quotation',
      'commercial quotation',
      'cost quote',
      'rate quote',
      'price quote',
      'quotation for',
    ],
  },
  {
    type: 'Bid Document',
    category: 'Business',
    keywords: [
      'bid document',
      'bid for',
      'create a bid',
      'bidding document',
      'commercial bid',
      'technical bid',
      'tender bid',
      'rfp bid',
      'bid proposal',
      'submit a bid',
      'professional bid',
    ],
  },
  { type: 'Estimate', category: 'Sales', keywords: ['estimate', 'estimation', 'rough quote'] },
  { type: 'Invoice', category: 'Sales', keywords: ['invoice', 'bill', 'tax invoice', 'billing', 'payment due'] },
  { type: 'Proforma Invoice', category: 'Sales', keywords: ['proforma', 'pro-forma', 'advance bill'] },
  { type: 'Purchase Order', category: 'Sales', keywords: ['purchase order', 'po ', 'p.o.', 'order hardware', 'order laptops', 'procurement order'] },
  { type: 'Sales Order', category: 'Sales', keywords: ['sales order', 'client order'] },
  { type: 'Credit Note', category: 'Sales', keywords: ['credit note', 'refund note'] },
  { type: 'Receipt', category: 'Sales', keywords: ['receipt', 'payment receipt', 'acknowledgement of payment'] },

  // Business Documents & Proposals
  {
    type: 'Business Proposal',
    category: 'Business',
    keywords: ['business proposal', 'proposal', 'pitch', 'client pitch', 'project proposal', 'solution proposal', 'commercial proposal'],
  },
  { type: 'Statement of Work', category: 'Business', keywords: ['statement of work', 'sow', 'scope of work', 'project scope', 'deliverables agreement'] },
  { type: 'Business Letter', category: 'Business', keywords: ['business letter', 'formal letter', 'official letter', 'client letter'] },
  { type: 'Cover Letter', category: 'Business', keywords: ['cover letter', 'transmittal letter'] },
  { type: 'Project Brief', category: 'Business', keywords: ['project brief', 'creative brief', 'kickoff brief'] },
  { type: 'Project Report', category: 'Business', keywords: ['project report', 'status report', 'progress report', 'monthly report', 'quarterly report'] },
  { type: 'Meeting Minutes', category: 'Business', keywords: ['meeting minutes', 'mom', 'minutes of meeting', 'board minutes'] },
  { type: 'Business Plan', category: 'Business', keywords: ['business plan', 'executive summary', 'go to market'] },

  // Legal & Agreements
  { type: 'NDA', category: 'Legal', keywords: ['nda', 'non-disclosure', 'confidentiality agreement', 'secret agreement'] },
  { type: 'Service Agreement', category: 'Legal', keywords: ['service agreement', 'master service agreement', 'msa', 'services agreement'] },
  { type: 'Contract', category: 'Legal', keywords: ['contract', 'sales contract', 'legal contract', 'agreement between'] },
  { type: 'Consultancy Agreement', category: 'Legal', keywords: ['consultancy agreement', 'consulting contract', 'advisor agreement'] },
  { type: 'Vendor Agreement', category: 'Legal', keywords: ['vendor agreement', 'supplier agreement', 'procurement contract'] },
  { type: 'Partnership Agreement', category: 'Legal', keywords: ['partnership agreement', 'cooperation agreement', 'joint venture'] },
  { type: 'Terms & Conditions', category: 'Legal', keywords: ['terms and conditions', 'terms of service', 'tos', 'website terms'] },
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
 */
function detectDocumentIntent(prompt) {
  const text = (prompt || '').trim().toLowerCase();
  if (!text) {
    return {
      documentType: 'Quotation',
      category: 'Sales',
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

  // Default heuristic fallback
  if (text.includes('bid') || text.includes('tender')) {
    return { documentType: 'Bid Document', category: 'Business', confidence: 0.9, extractedEntities: extracted };
  }
  if (text.includes('quot') || text.includes('pricing') || text.includes('₹') || text.includes('rs')) {
    return { documentType: 'Quotation', category: 'Sales', confidence: 0.9, extractedEntities: extracted };
  }

  return {
    documentType: 'Custom Document',
    category: 'Custom',
    confidence: 0.6,
    extractedEntities: extracted,
  };
}

/**
 * Extract entities from raw text:
 * - Client Name
 * - Project / Solution Name
 * - Amount & Currency
 * - Dates & Roles
 */
function extractCommonEntities(text) {
  const res = {
    companyName: null,
    clientName: null,
    projectName: null,
    amount: null,
    currency: 'INR',
    dates: null,
    role: null,
  };

  const clean = (text || '').trim();
  if (!clean) return res;

  // 1. Currency
  if (/\$|usd|dollar/i.test(clean)) res.currency = 'USD';
  else if (/€|eur|euro/i.test(clean)) res.currency = 'EUR';
  else if (/£|gbp/i.test(clean)) res.currency = 'GBP';

  // 2. Amount Extraction (supports "5,00,000", "5 lakh", "₹5 lakh", "500000", "5 lacs", "2500000")
  const lakhMatch = clean.match(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|cr|crore|crores)/i);
  if (lakhMatch && lakhMatch[1]) {
    const num = parseFloat(lakhMatch[1].replace(/,/g, ''));
    if (!isNaN(num)) {
      if (/cr|crore/i.test(lakhMatch[0])) res.amount = Math.round(num * 10000000);
      else res.amount = Math.round(num * 100000);
    }
  } else {
    const rawNumMatch = clean.match(/(?:for|worth|costing|amount|value|sum|price|fee)\s+(?:of\s+)?(?:₹|rs\.?|\$|€|£)?\s*([0-9]{4,10}|[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]+)?)/i) ||
                        clean.match(/(?:₹|rs\.?|\$|€|£)\s*([0-9]{4,10}|[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]+)?)/i) ||
                        clean.match(/\b([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.[0-9]+)?)\b/) ||
                        clean.match(/\b([0-9]{4,10})\b/);
    if (rawNumMatch && rawNumMatch[1]) {
      const num = parseFloat(rawNumMatch[1].replace(/,/g, ''));
      if (!isNaN(num) && num >= 100) res.amount = Math.round(num);
    }
  }

  // 3. Pairwise Company Extraction:
  // Pairwise 1: "from/by X for/to Y"
  const fromToMatch = clean.match(/(?:from|by|on\s+behalf\s+of)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)\s+(?:for|to)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)(?:\s+(?:for|worth|costing|dated|\.)|\s*$)/i);
  if (fromToMatch) {
    const c1 = fromToMatch[1].trim();
    const c2 = fromToMatch[2].trim();
    const blacklist = ['a', 'an', 'the', 'our', 'my', 'us'];
    if (!blacklist.includes(c1.toLowerCase())) res.companyName = c1;
    if (!blacklist.includes(c2.toLowerCase())) res.clientName = c2;
  }

  // Pairwise 2: "between X and Y"
  if (!res.clientName) {
    const betweenMatch = clean.match(/between\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)\s+(?:and|&)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)(?:\s+(?:for|worth|dated|\.)|\s*$)/i);
    if (betweenMatch) {
      const c1 = betweenMatch[1].trim();
      const c2 = betweenMatch[2].trim();
      const blacklist = ['a', 'an', 'the', 'both'];
      if (!blacklist.includes(c1.toLowerCase())) res.companyName = c1;
      if (!blacklist.includes(c2.toLowerCase())) res.clientName = c2;
    }
  }

  // Pairwise 3: "for/to Y from/by X"
  if (!res.clientName) {
    const forByMatch = clean.match(/(?:for|to)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)\s+(?:from|by)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)(?:\s+(?:for|worth|dated|\.)|\s*$)/i);
    if (forByMatch) {
      const c1 = forByMatch[1].trim();
      const c2 = forByMatch[2].trim();
      const blacklist = ['a', 'an', 'the', 'our'];
      if (!blacklist.includes(c1.toLowerCase())) res.clientName = c1;
      if (!blacklist.includes(c2.toLowerCase())) res.companyName = c2;
    }
  }

  // Pairwise 4: Hindi "X ki taraf se Y ke liye" / "X se Y ke liye" / "X ka Y ke liye"
  if (!res.clientName) {
    const hindiMatch = clean.match(/([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)\s+(?:ki\s+taraf\s+se|se|ka)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)\s+ke\s+liye/i);
    if (hindiMatch) {
      const c1 = hindiMatch[1].trim();
      const c2 = hindiMatch[2].trim();
      const blacklist = ['hum', 'mai', 'aap', 'ek', 'mera', 'ye', 'woh', 'kisi'];
      if (!blacklist.includes(c1.toLowerCase())) res.companyName = c1;
      if (!blacklist.includes(c2.toLowerCase())) res.clientName = c2;
    }
  }

  // Pairwise 5: Hindi "Y ke liye X se / X ki taraf se"
  if (!res.clientName) {
    const revHindiMatch = clean.match(/([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)\s+ke\s+liye\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)\s+(?:se|ki\s+taraf\s+se)/i);
    if (revHindiMatch) {
      const c1 = revHindiMatch[1].trim();
      const c2 = revHindiMatch[2].trim();
      const blacklist = ['hum', 'mai', 'aap', 'ek', 'mera', 'ye', 'woh', 'kisi'];
      if (!blacklist.includes(c1.toLowerCase())) res.clientName = c1;
      if (!blacklist.includes(c2.toLowerCase())) res.companyName = c2;
    }
  }

  // Standalone Company / Issuer Name extraction
  if (!res.companyName) {
    const issuerMatch = clean.match(/(?:issuer|vendor|company|provider|from\s+company|by\s+company|seller)[:\s]+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)(?:\s+(?:for|to|worth|dated|\.)|\s*$)/i) ||
                        clean.match(/([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)\s+(?:ki\s+taraf\s+se|se\s+banao|se\s+bana)/i);
    if (issuerMatch && issuerMatch[1]) {
      const candidate = issuerMatch[1].trim();
      const blacklist = ['hum', 'mai', 'aap', 'ek', 'mera', 'ye', 'woh', 'kisi', 'scratch', 'ai'];
      if (!blacklist.includes(candidate.toLowerCase())) res.companyName = candidate;
    }
  }

  // Standalone Client Name Extraction (if not matched above)
  if (!res.clientName) {
    const quotationForPattern = clean.match(/(?:quotation|bid|proposal|estimate|invoice|document|agreement)\s+(?:for|to)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,4}?)(?:\s+(?:for\s+(?:₹|rs|[\d,]+|our)|worth|costing|with|dated|\.)|\s*$)/i);
    if (quotationForPattern && quotationForPattern[1]) {
      const candidate = quotationForPattern[1].trim();
      if (!['our', 'the', 'a', 'an', 'ai', 'software', 'project'].includes(candidate.toLowerCase())) {
        res.clientName = candidate;
      }
    }
  }

  // Pattern B: "for XYZ Ltd for our software development project"
  if (!res.clientName) {
    const clientForMatch = clean.match(/(?:for|to|client[:\s]+|customer[:\s]+)\s+([A-Za-z0-9&.,'-]+(?:\s+(?:Pvt|Private|Ltd|Limited|Inc|Corporation|Corp|LLC|LLP|Technologies|Services|Solutions|Enterprise)){1,2})/i);
    if (clientForMatch && clientForMatch[1]) {
      res.clientName = clientForMatch[1].trim();
    }
  }

  // Pattern C: General "for <Company Name>"
  if (!res.clientName) {
    const generalFor = clean.match(/(?:for|to|client[:\s]+|customer[:\s]+)\s+([A-Za-z0-9&.,'-]+(?:\s+[A-Za-z0-9&.,'-]+){0,3}?)(?:\s+(?:for|worth|costing|at|regarding|dated|\.|$))/i);
    if (generalFor && generalFor[1]) {
      const candidate = generalFor[1].trim();
      const blacklist = ['a', 'an', 'the', 'our', 'my', 'new', 'quotation', 'bid', 'proposal', 'project', 'solution', 'software', 'service'];
      if (!blacklist.includes(candidate.toLowerCase()) && candidate.length > 2) {
        res.clientName = candidate;
      }
    }
  }

  // 4. Project / Solution Name Extraction
  // Examples:
  // "...for ₹5,00,000 for AI Document Automation" -> "AI Document Automation"
  // "...for our software development project" -> "Software Development Project"
  // "...for our AI Document Automation solution worth ₹5 lakh" -> "AI Document Automation Solution"
  const projectPattern1 = clean.match(/(?:for\s+(?:our\s+)?|regarding\s+|project[:\s]+|solution[:\s]+)([A-Za-z0-9\s&.,'-]+?)(?:\s+(?:worth|costing|at\s+(?:₹|rs)|amount|\.|$))/i);
  const projectPattern2 = clean.match(/(?:₹|rs\.?|[\d,]+\s*(?:lakh|lac)?)\s+for\s+(?:our\s+)?([A-Za-z0-9\s&.,'-]+?)(?:\s+(?:project|solution|system|implementation|\.|$))/i);
  const projectPattern3 = clean.match(/(?:for\s+our\s+)([A-Za-z0-9\s&.,'-]+?)(?:\s+(?:project|solution|system|worth|\.|$))/i);

  if (projectPattern2 && projectPattern2[1]) {
    res.projectName = projectPattern2[1].trim();
  } else if (projectPattern3 && projectPattern3[1]) {
    res.projectName = projectPattern3[1].trim();
  } else if (projectPattern1 && projectPattern1[1]) {
    const candidate = projectPattern1[1].trim();
    if (candidate !== res.clientName && candidate.length > 3) {
      res.projectName = candidate;
    }
  }

  // Fallback project name formatting
  if (res.projectName) {
    // Capitalize cleanly
    res.projectName = res.projectName.replace(/^our\s+/i, '').trim();
    res.projectName = res.projectName.charAt(0).toUpperCase() + res.projectName.slice(1);
  } else if (clean.toLowerCase().includes('document automation')) {
    res.projectName = 'AI Document Automation Solution';
  } else if (clean.toLowerCase().includes('software development')) {
    res.projectName = 'Software Development Project';
  }

  function sanitizeEntityName(str) {
    if (!str) return null;
    let s = str.trim();
    s = s.replace(/^(?:ek|bna\s+do|bana\s+do|banado|banao|karo|create|make|generate|draft|send|quotation|proposal|document|invoice|contract|for|from|to|by|se)\s+/i, '');
    s = s.replace(/^(?:ek|bna\s+do|bana\s+do|banado|banao|karo|create|make|generate|draft|send|quotation|proposal|document|invoice|contract|for|from|to|by|se)\s+/i, '');
    s = s.replace(/[.,;:]+$/, '').trim();
    if (s.length < 2) return null;
    return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  if (res.companyName) {
    res.companyName = sanitizeEntityName(res.companyName);
  }
  if (res.clientName) {
    res.clientName = sanitizeEntityName(res.clientName);
  }

  return res;
}

/**
 * AI Service to generate a complete, structured document based on natural language prompt
 * Rules:
 * 1. Issuing company is ALWAYS Dezoryn Technology with corporate branding, tax registrations, and bank details.
 * 2. Counterparty is the client extracted from prompt or CRM.
 * 3. Base amount for Quotations must be exact base value before taxes.
 * 4. Bid documents include comprehensive 18-section architecture.
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

  // 1. Fetch Corporate Profile & Resolve Issuing Company
  const orgProfile = await getOrganisationCompanyProfile(organisationId);
  const detected = detectDocumentIntent(cleanPrompt);
  const entities = extractCommonEntities(cleanPrompt);

  const explicitCompany = (companyName || entities.companyName || '').trim();
  let issuingCompanyName = explicitCompany;
  if (!issuingCompanyName) {
    issuingCompanyName = orgProfile.companyName || 'Dezoryn Technology';
  }

  const issuingLegalName = issuingCompanyName.toLowerCase().includes('ltd') || issuingCompanyName.toLowerCase().includes('inc') || issuingCompanyName.toLowerCase().includes('corp')
    ? issuingCompanyName
    : `${issuingCompanyName} Pvt Ltd`;

  const documentType = documentTypeOverride || templateContext?.documentType || detected.documentType;
  const category = categoryOverride || templateContext?.category || detected.category;

  let effectiveClientName = (clientContext?.name || entities.clientName || 'Valued Client').trim();
  let clientEmail = clientContext?.email || null;
  let clientPhone = clientContext?.phone || null;
  let clientAddress = clientContext?.address || null;
  let clientContactPerson = clientContext?.contactPerson || null;
  let clientGstin = null;
  let clientPan = null;
  let crmClientId = clientContext?.id || null;

  // 3. CRM Automatic Lookup for Client
  if (organisationId && effectiveClientName && effectiveClientName !== 'Valued Client') {
    try {
      const searchTerms = effectiveClientName.split(' ')[0];
      const matchedClient = await prisma.crmClient.findFirst({
        where: {
          organisationId: parseInt(organisationId, 10),
          OR: [
            { name: { contains: effectiveClientName, mode: 'insensitive' } },
            { name: { contains: searchTerms, mode: 'insensitive' } },
          ],
        },
        include: {
          contacts: true,
        },
      });

      if (matchedClient) {
        crmClientId = matchedClient.id;
        effectiveClientName = matchedClient.name;
        if (!clientEmail) clientEmail = matchedClient.email || matchedClient.contacts?.[0]?.email || null;
        if (!clientPhone) clientPhone = matchedClient.phone || matchedClient.contacts?.[0]?.phone || null;
        if (!clientContactPerson) {
          clientContactPerson = matchedClient.contactPerson ||
            (matchedClient.contacts?.[0] ? `${matchedClient.contacts[0].firstName} ${matchedClient.contacts[0].lastName || ''}`.trim() : null);
        }
        if (!clientAddress) {
          const parts = [matchedClient.address, matchedClient.city, matchedClient.state, matchedClient.postalCode, matchedClient.country].filter(Boolean);
          if (parts.length > 0) clientAddress = parts.join(', ');
        }
      }
    } catch (crmErr) {
      console.warn('[AIDocumentBuilderService] CRM lookup note:', crmErr.message);
    }
  }

  // Determine Project Title
  const projectName = entities.projectName || (documentType === 'Quotation' ? 'Commercial Proposal & Deliverables' : 'Enterprise Professional Engagement');
  const baseAmount = entities.amount || (documentType === 'Quotation' ? 300000 : 300000);
  const currency = entities.currency || 'INR';

  // Format dates
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const validUntil = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // 4. Try AI Generation via AI Gateway
  let parsed = null;
  const isBid = documentType.toLowerCase().includes('bid');
  const isQuotation = documentType.toLowerCase().includes('quotation') || documentType.toLowerCase().includes('quote');

  const systemPrompt = `
You are an Enterprise AI Document Architect.
CRITICAL CORPORATE IDENTITY & ENTITY RULES:
1. Every document must be authentically and professionally generated FOR THE SPECIFIC COMPANIES requested in the user prompt or parameters.
2. The Issuing Entity (Creator / Seller / Service Provider / Consultant):
   - Issuer is "${issuingCompanyName}" (${issuingLegalName}).
   - If the user prompt specifically named a vendor/issuer company, ALWAYS use that exact company.
   - Under NO circumstances should you force or mention "TCS", "Tata Consultancy Services", or "Dezoryn" unless the user explicitly requested that specific brand in their prompt.
3. The Recipient Entity (Client / Buyer / Customer / Counterparty):
   - The recipient is "${effectiveClientName}".
   - Ensure the issuer and recipient roles are appropriately separated and accurate.

Document Type: "${documentType}"
Category: "${category}"
Issuer: "${issuingCompanyName}" (${issuingLegalName})
Recipient / Client: "${effectiveClientName}"
Project / Service: "${projectName}"
Base Amount: ${baseAmount ? formatCurrencyINR(baseAmount) : '₹3,00,000'}

Return ONLY a valid JSON object matching this schema:
{
  "title": "${documentType} for ${effectiveClientName} - ${projectName}",
  "documentType": "${documentType}",
  "category": "${category}",
  "companyName": "${issuingCompanyName}",
  "clientName": "${effectiveClientName}",
  "clientEmail": ${clientEmail ? `"${clientEmail}"` : 'null'},
  "clientPhone": ${clientPhone ? `"${clientPhone}"` : 'null'},
  "clientAddress": ${clientAddress ? `"${clientAddress}"` : 'null'},
  "clientContactPerson": ${clientContactPerson ? `"${clientContactPerson}"` : 'null'},
  "variables": {
    "company_name": "${issuingCompanyName}",
    "client_name": "${effectiveClientName}",
    "project_name": "${projectName}",
    "document_date": "${todayStr}",
    "valid_until": "${validUntil}",
    "base_amount": "${baseAmount}",
    "currency": "${currency}"
  },
  "financialData": {
    "currency": "${currency}",
    "subtotal": ${baseAmount},
    "taxRate": 18,
    "cgstRate": 9,
    "sgstRate": 9,
    "total": ${Math.round(baseAmount * 1.18)}
  },
  "content": [
    {
      "id": "sec_1",
      "type": "header",
      "title": "Document Overview",
      "body": "Official ${documentType} issued by ${issuingCompanyName} to ${effectiveClientName} regarding ${projectName}."
    }
  ]
}

RULES:
1. Provide rich, highly professional, client-ready business prose.
2. In every generated document, include a dedicated "Terms & Conditions" section with type "terms" and title "Terms & Conditions" containing the organisation's standard Terms & Conditions.
3. In the Header or Overview section, incorporate the Organisation Document Header ("${orgProfile.headerText || ''}") and Company Details ("${(orgProfile.companyInfo || '').replace(/\n/g, ' ')}").
4. For Bid Documents, provide complete comprehensive sections (Executive Summary, Issuer Corporate Profile, Client Requirements, Proposed Solution, Functional Capabilities, Scope of Work, Technical Approach, Implementation Timeline, Roles, Assumptions, Support & SLA, Security, Commercial Proposal, Payment Terms, Terms & Conditions, Acceptance Signatures).
5. For Quotations, itemize deliverables such that the base sum equals exactly ${baseAmount}, followed by 9% CGST and 9% SGST.
6. Output raw JSON only.
`.trim();

  const userPrompt = `
Instruction: "${cleanPrompt}"
Issuer: ${issuingCompanyName} (${issuingLegalName})
Client: ${effectiveClientName}
Project: ${projectName}
Base Amount: ${baseAmount}
`.trim();

  try {
    const aiResult = await withTimeout(
      AIGateway.execute({
        organisationId,
        userId,
        operation: 'generateText',
        feature: 'ai_document_builder',
        module: 'documents',
        params: {
          prompt: userPrompt,
          systemPrompt,
          temperature: 0.15,
          maxTokens: 4500,
        },
      }),
      35000
    );

    if (aiResult && aiResult.text) {
      parsed = extractJsonFromText(aiResult.text);
    }
  } catch (err) {
    console.warn('[AIDocumentBuilderService] AI Gateway execution note:', err.message);
  }

  // 5. Fallback to Dedicated Enterprise Heuristic Builders if AI is offline or incomplete
  if (!parsed || !parsed.content || !Array.isArray(parsed.content) || parsed.content.length < 3) {
    if (isBid) {
      parsed = generateHeuristicBidDocument(orgProfile, issuingCompanyName, issuingLegalName, effectiveClientName, projectName, baseAmount, currency, todayStr, validUntil, cleanPrompt);
    } else if (isQuotation) {
      parsed = generateHeuristicQuotationDocument(orgProfile, issuingCompanyName, issuingLegalName, effectiveClientName, projectName, baseAmount, currency, todayStr, validUntil, cleanPrompt);
    } else {
      parsed = generateHeuristicDocument(cleanPrompt, documentType, category, clientContext, templateContext, issuingCompanyName, effectiveClientName, baseAmount, projectName, orgProfile);
    }
  }

  // 5.1 Enforce standard Terms & Conditions from organisation document settings
  const termsText = orgProfile.termsAndConditions || (orgProfile.savedTermsAndConditions && orgProfile.savedTermsAndConditions.join('\n')) || '';
  if (Array.isArray(parsed.content)) {
    const existingTerms = parsed.content.find(
      (s) => s.type === 'terms' || (s.title && s.title.toLowerCase().includes('terms'))
    );
    if (!existingTerms && termsText) {
      parsed.content.push({
        id: 'sec_terms_org',
        type: 'terms',
        title: 'Terms & Conditions',
        body: termsText,
      });
    } else if (existingTerms && termsText && (!existingTerms.body || existingTerms.body.trim().length < 20)) {
      existingTerms.body = termsText;
    }
  }

  // 6. Guarantee Corporate Identity
  parsed.companyName = issuingCompanyName;
  parsed.clientName = effectiveClientName;
  if (!parsed.clientEmail && clientEmail) parsed.clientEmail = clientEmail;
  if (!parsed.clientPhone && clientPhone) parsed.clientPhone = clientPhone;
  if (!parsed.clientAddress && clientAddress) parsed.clientAddress = clientAddress;
  if (!parsed.clientContactPerson && clientContactPerson) parsed.clientContactPerson = clientContactPerson;

  // 7. Ensure Variables & Financial Data are Deterministically Calculated
  if (isQuotation || parsed.category === 'Sales' || parsed.financialData?.subtotal > 0) {
    const tableSec = parsed.content.find((s) => s.type === 'table');
    let lineItems = [];
    if (tableSec && tableSec.tableData && Array.isArray(tableSec.tableData.rows)) {
      lineItems = tableSec.tableData.rows.map((r, idx) => ({
        title: r[0] || `Deliverable ${idx + 1}`,
        description: r[1] || '',
        quantity: parseFloat(r[2]) || 1,
        unit: r[3] || 'module',
        unitPrice: parseFloat(String(r[4]).replace(/,/g, '')) || 0,
      }));
    }

    // If rows don't match the required base amount, recalibrate rows cleanly
    const currentSum = lineItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
    if (Math.abs(currentSum - baseAmount) > 100 && baseAmount > 0) {
      const p1 = Math.round(baseAmount * 0.5);
      const p2 = Math.round(baseAmount * 0.3);
      const p3 = baseAmount - (p1 + p2);

      lineItems = [
        { title: `${projectName} - Core Engine & Architecture`, description: 'Core solution design, API integrations, and backend pipeline', quantity: 1, unit: 'system', unitPrice: p1 },
        { title: `${projectName} - Workflows & User Interface`, description: 'Frontend portal, administrative console, and security governance', quantity: 1, unit: 'package', unitPrice: p2 },
        { title: 'Quality Assurance, Deployment & Hypercare Support', description: 'UAT sign-off, production deployment, and 30-day warranty', quantity: 1, unit: 'service', unitPrice: p3 },
      ];

      if (tableSec && tableSec.tableData) {
        tableSec.tableData.rows = lineItems.map((it) => [
          it.title,
          it.description,
          String(it.quantity),
          it.unit,
          formatCurrencyINR(it.unitPrice),
          formatCurrencyINR(it.quantity * it.unitPrice),
        ]);
      }
    }

    const financials = calculateQuotationFinancials(lineItems, {
      discountType: 'PERCENTAGE',
      discountValue: 0,
      taxRate: 18,
    });

    parsed.financialData = financials;
  }

  // Sender Metadata snapshot from corporate profile & saved Document Settings
  const senderData = {
    companyName: issuingCompanyName,
    legalName: issuingLegalName,
    headerText: orgProfile.headerText || 'Dezoryn Enterprise Automated Document Intelligence',
    footerText: orgProfile.footerText || 'Confidential • DocuCore Enterprise Platform • All Rights Reserved',
    companyInfo: orgProfile.companyInfo || orgProfile.registeredAddress,
    termsAndConditions: termsText,
    pageSize: orgProfile.pageSize || 'A4',
    orientation: orgProfile.orientation || 'Portrait',
    defaultCurrency: orgProfile.defaultCurrency || 'INR (₹)',
    dateFormat: orgProfile.dateFormat || 'DD/MM/YYYY',
    tagline: orgProfile.tagline,
    registeredAddress: orgProfile.registeredAddress,
    billingAddress: orgProfile.billingAddress,
    city: orgProfile.city,
    state: orgProfile.state,
    country: orgProfile.country,
    postalCode: orgProfile.postalCode,
    email: orgProfile.email,
    phone: orgProfile.phone,
    website: orgProfile.website,
    gstin: orgProfile.gstin,
    pan: orgProfile.pan,
    cin: orgProfile.cin,
    authorisedSignatory: orgProfile.authorisedSignatory,
    paymentDetails: orgProfile.paymentDetails,
    branding: orgProfile.branding,
  };

  const recipientData = {
    companyName: effectiveClientName,
    contactPerson: clientContactPerson || null,
    email: clientEmail || null,
    phone: clientPhone || null,
    address: clientAddress || null,
    gstin: clientGstin || null,
    crmClientId: crmClientId || null,
  };

  return {
    title: parsed.title || `${documentType} - ${effectiveClientName}`,
    documentType,
    category,
    companyName: issuingCompanyName,
    legalName: issuingLegalName,
    clientName: effectiveClientName,
    clientEmail,
    clientPhone,
    clientAddress,
    clientContactPerson,
    crmClientId,
    headerText: senderData.headerText,
    footerText: senderData.footerText,
    companyInfo: senderData.companyInfo,
    termsAndConditions: senderData.termsAndConditions,
    pageSize: senderData.pageSize,
    orientation: senderData.orientation,
    senderData,
    recipientData,
    variables: {
      company_name: issuingCompanyName,
      legal_name: issuingLegalName,
      client_name: effectiveClientName,
      project_name: projectName,
      document_date: todayStr,
      valid_until: validUntil,
      header_text: senderData.headerText,
      footer_text: senderData.footerText,
      company_info: senderData.companyInfo,
      terms_and_conditions: senderData.termsAndConditions,
      amount: parsed.financialData?.total ? formatCurrencyINR(parsed.financialData.total) : formatCurrencyINR(baseAmount),
      amount_in_words: parsed.financialData?.amountInWords || `${numberToIndianWords(baseAmount)}`,
      gstin: orgProfile.gstin,
      pan: orgProfile.pan,
      ...(parsed.variables || {}),
    },
    financialData: parsed.financialData || null,
    content: parsed.content,
    aiPrompt: cleanPrompt,
  };
}

/**
 * Generate Comprehensive 18-Section Bid Document
 * Submitted BY issuingCompanyName TO the Client
 */
function generateHeuristicBidDocument(orgProfile, issuingCompanyName, issuingLegalName, clientName, projectName, amount, currency, todayStr, validUntil, rawPrompt) {
  const formattedAmount = formatCurrencyINR(amount);
  const p1 = Math.round(amount * 0.4);
  const p2 = Math.round(amount * 0.35);
  const p3 = amount - (p1 + p2);

  const sections = [
    {
      id: 'sec_cover',
      type: 'header',
      title: 'Commercial & Technical Bid Submission',
      body: `DOCUMENT TYPE: FORMAL BID PROPOSAL\nBID REFERENCE: BID-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}\n\nSUBMITTED BY:\n${issuingCompanyName} (${issuingLegalName})\n${orgProfile.registeredAddress}\nGSTIN: ${orgProfile.gstin} | PAN: ${orgProfile.pan} | CIN: ${orgProfile.cin}\nEmail: ${orgProfile.email} | Web: ${orgProfile.website}\n\nSUBMITTED TO:\n${clientName}\nAttention: Tender Committee & Procurement Board\nSubmission Date: ${todayStr}\nProposal Validity: 60 Calendar Days (Valid Until: ${validUntil})`,
    },
    {
      id: 'sec_exec_summary',
      type: 'text',
      title: '1. Executive Summary',
      body: `${issuingCompanyName} is honored to submit this comprehensive bid proposal to ${clientName} for the design, development, and enterprise rollout of ${projectName}. In today's digital economy, organizations require dependable, secure, and future-ready automation platforms to streamline operations and eliminate manual friction.\n\nOur proposed solution combines state-of-the-art intelligent processing with resilient microservices architecture, tailored precisely to meet ${clientName}'s strategic objectives. By partnering with ${issuingCompanyName}, ${clientName} secures a dedicated team of elite technologists, enterprise-grade SLA commitments, and a transparent delivery roadmap designed for maximum return on investment.`,
    },
    {
      id: 'sec_company_profile',
      type: 'text',
      title: `2. ${issuingCompanyName} Corporate Profile & Credentials`,
      body: `${issuingCompanyName} is a premier enterprise software and technology solutions engineering firm. We specialize in automated document intelligence, cognitive workflows, high-throughput backend systems, and mission-critical cloud deployments.\n\nKey Organizational Highlights:\n• Registered Legal Entity: ${issuingLegalName} (CIN: ${orgProfile.cin})\n• Tax Compliance: Fully GST-registered (GSTIN: ${orgProfile.gstin}) and ISO/IEC 27001 compliant security protocols.\n• Proven Delivery Record: Successfully delivered over 150+ bespoke enterprise implementations across BFSI, Logistics, Manufacturing, and Healthcare.\n• Dedicated Engineering Team: Specialized solution architects, full-stack engineers, and cloud reliability specialists providing round-the-clock operational capability.`,
    },
    {
      id: 'sec_client_requirements',
      type: 'text',
      title: '3. Understanding of Client Requirements & Business Objectives',
      body: `Based on our in-depth evaluation of ${clientName}'s operational ecosystem, we understand that the primary objectives for ${projectName} include:\n1. Operational Velocity: Accelerating end-to-end processing times and eliminating manual data entry bottlenecks.\n2. Accuracy & Reliability: Enforcing strict business validation rules, deterministic calculations, and zero-error audit trails.\n3. Enterprise Scalability: Accommodating high transaction concurrency with sub-second API latency.\n4. Multi-Tenant Security: Ensuring role-based access control (RBAC), tenant data isolation, and end-to-end encryption at rest and in transit.`,
    },
    {
      id: 'sec_proposed_solution',
      type: 'text',
      title: '4. Proposed Solution Architecture',
      body: `${issuingCompanyName} proposes a modular, microservices-driven platform designed specifically for ${projectName}.\n\nArchitectural Tiers:\n• Client Experience Layer: High-performance, responsive web application built with Next.js, React, and Tailwind/Vanilla CSS tokens.\n• Application & Business Logic Tier: Robust Node.js / Express engine with strict input validation, domain-driven services, and role middleware.\n• Data Persistence Layer: Enterprise PostgreSQL database with Prisma ORM, multi-tenant indexing, and encrypted storage.\n• AI & Processing Gateway: Unified orchestration layer supporting OCR extraction, dynamic document rendering, and real-time validation.`,
    },
    {
      id: 'sec_functional_capabilities',
      type: 'text',
      title: '5. Core Functional Capabilities',
      body: `• Natural Language Workflow Engine: Enables users to trigger automated creation and pipeline processing using simple instructions.\n• Intelligent Entity Extraction: Automatically parses client metadata, financials, dates, and terms from unstructured context.\n• High-Fidelity Vector PDF Generation: Generates branded, pixel-perfect PDFs with embedded watermarks, dynamic tables, and signature blocks.\n• Live Approval & Workflow Management: Multi-tier approval hierarchies (Draft &rarr; Pending Review &rarr; Approved &rarr; Sent &rarr; Accepted).\n• Comprehensive Audit Trails: Captures IP addresses, timestamps, and user actions for full regulatory compliance.`,
    },
    {
      id: 'sec_scope_of_work',
      type: 'text',
      title: '6. Scope of Work & Deliverables',
      body: `The complete scope of work executed by ${issuingCompanyName} encompasses:\n• Work Package 1: Architectural Blueprinting, Technical Specifications, and Database Schema Design.\n• Work Package 2: Backend API Development, Multi-Tenant Authentication, and RBAC Permission Matrix.\n• Work Package 3: Frontend Portal Engineering, Responsive Dashboards, and Live Document Previews.\n• Work Package 4: Third-Party Integrations (Email SMTP, Cloud Storage, and OCR Engines).\n• Work Package 5: Quality Assurance, Security Penetration Testing, and User Acceptance Testing (UAT).\n• Work Package 6: Production Cloud Deployment, Performance Tuning, and Admin Knowledge Transfer.`,
    },
    {
      id: 'sec_timeline',
      type: 'table',
      title: '7. Implementation Timeline & Milestone Deliverables',
      tableData: {
        headers: ['Phase / Milestone', 'Estimated Timeline', 'Deliverables', 'Sign-Off Criteria'],
        rows: [
          ['Phase 1: Discovery & Architecture', 'Weeks 1 - 2', 'SRS, Technical Architecture & Wireframes', 'Client Approval of SRS'],
          ['Phase 2: Core Engineering', 'Weeks 3 - 6', 'Backend APIs, DB Schema, Security Layer', 'API Test Suite Completion'],
          ['Phase 3: UI & Workflow Integration', 'Weeks 7 - 9', 'Web Interface, Live Preview & Generation', 'End-to-End Workflow Demo'],
          ['Phase 4: Testing & UAT Sign-Off', 'Weeks 10 - 11', 'Penetration Testing, Bug Fixes & UAT', 'Formal Client UAT Sign-Off'],
          ['Phase 5: Production Go-Live', 'Week 12', 'Cloud Deployment, SSL, Admin Handover', 'Production Acceptance Certificate'],
        ],
      },
    },
    {
      id: 'sec_roles',
      type: 'text',
      title: '8. Roles, Responsibilities & Governance Matrix',
      body: `A collaborative governance framework guarantees on-time delivery:\n• ${issuingCompanyName} Project Manager: Single point of contact for sprint planning, status reports, and escalation management.\n• ${issuingCompanyName} Lead Architect: Oversees system integrity, security audits, and cloud reliability.\n• ${clientName} Project Sponsor: Provides strategic direction, review milestone sign-offs, and final acceptance.\n• Weekly Status Reviews: Formal virtual sprint reviews conducted every Friday with recorded action items.`,
    },
    {
      id: 'sec_assumptions_exclusions',
      type: 'text',
      title: '9. Assumptions, Dependencies & Exclusions',
      body: `Assumptions & Dependencies:\n1. ${clientName} will designate a technical coordinator to provide required brand assets and access keys within 5 business days of kickoff.\n2. Cloud hosting infrastructure costs (e.g., AWS / GCP) will be provisioned under ${clientName}'s enterprise cloud account.\n\nExclusions:\n• Any modifications to third-party legacy databases not explicitly documented in the SRS.\n• Hardware procurement or physical on-premise server maintenance.`,
    },
    {
      id: 'sec_support_sla',
      type: 'text',
      title: '10. Support, SLA & Maintenance Framework',
      body: `${issuingCompanyName} provides comprehensive post-implementation support:\n• Complimentary Warranty: 60 calendar days of warranty support post-production launch.\n• SLA Response Times: Critical Severity 1 incidents responded to within 1 hour; Severity 2 within 4 hours; General queries within 1 business day.\n• Support Channels: Dedicated ticketing portal, enterprise email (${orgProfile.email}), and direct hotline (+91 98765 43210).`,
    },
    {
      id: 'sec_security',
      type: 'text',
      title: '11. Security, Compliance & Data Privacy',
      body: `• Data Isolation: Strict multi-tenant row-level database isolation ensuring complete confidentiality between customer partitions.\n• Cryptographic Standards: TLS 1.3 encryption in transit and AES-256 encryption for data at rest.\n• Session Security: JWT authentication with rotating refresh tokens, rate limiting, and CSRF protection.\n• Vulnerability Management: Regular OWASP top-10 scans and dependency vulnerability patches applied continuously.`,
    },
    {
      id: 'sec_commercial_table',
      type: 'table',
      title: '12. Commercial Proposal & Financial Investment',
      tableData: {
        headers: ['Item / Milestone', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        rows: [
          [`Phase 1 & 2: Architecture & Core Platform`, `Design, backend engine, and database schema for ${projectName}`, '1', 'milestone', formatCurrencyINR(p1), formatCurrencyINR(p1)],
          [`Phase 3: UI Portal & Workflow Modules`, `Interactive dashboards, live preview, and pipeline automation`, '1', 'milestone', formatCurrencyINR(p2), formatCurrencyINR(p2)],
          [`Phase 4 & 5: QA Hardening & Go-Live`, `UAT sign-off, security audit, deployment, and 60-day warranty`, '1', 'milestone', formatCurrencyINR(p3), formatCurrencyINR(p3)],
        ],
      },
    },
    {
      id: 'sec_commercial_summary',
      type: 'terms',
      title: '13. Commercial Summary & Statutory Taxes',
      body: `• Total Base Value: ${formattedAmount} (${numberToIndianWords(amount)})\n• Applicable Taxes: GST @ 18% (CGST 9% + SGST 9%) amounting to ${formatCurrencyINR(Math.round(amount * 0.18))}\n• Total Commercial Bid Value: ${formatCurrencyINR(Math.round(amount * 1.18))} (${numberToIndianWords(Math.round(amount * 1.18))})\n• Currency: Indian National Rupees (INR)\n• Commercial Validity: Firm and binding for 60 calendar days from submission.`,
    },
    {
      id: 'sec_payment_terms',
      type: 'terms',
      title: '14. Payment Schedule & Bank Information',
      body: `Payment Milestones:\n1. 30% Advance upon Contract Execution & Kickoff.\n2. 40% upon successful completion of Core Modules & Mid-Project Demonstration.\n3. 30% upon Final UAT Sign-Off and Production Handover.\n\nBank Account Details for Remittance:\nAccount Name: ${issuingLegalName}\nBank Name: ${orgProfile.paymentDetails.bankName}\nAccount Number: ${orgProfile.paymentDetails.accountNumber}\nIFSC Code: ${orgProfile.paymentDetails.ifscCode}\nBranch: ${orgProfile.paymentDetails.branch}`,
    },
    {
      id: 'sec_legal_terms',
      type: 'terms',
      title: '15. Legal Terms, Governing Law & Acceptance',
      body: orgProfile.termsAndConditions || `1. Intellectual Property: Upon receipt of full and final payment, complete customized source code, schemas, and IP rights transfer exclusively to ${clientName}.\n2. Confidentiality: Both parties shall treat all technical specifications and commercial terms as strictly confidential.\n3. Governing Law: This bid and any resultant contract shall be governed by the laws of India under the exclusive jurisdiction of the courts in Pune, Maharashtra.`,
    },
    {
      id: 'sec_signatures',
      type: 'signature',
      title: '16. Bid Submission & Acceptance Sign-Off',
      body: `Submitted on behalf of ${issuingCompanyName} by Authorized Signatory:\n${orgProfile.authorisedSignatory?.name || 'Authorised Signatory'}, ${orgProfile.authorisedSignatory?.designation || 'Director'}\n${issuingLegalName}\n\nAccepted & Acknowledged by:\nAuthorized Representative for ${clientName}`,
    },
  ];

  const financials = {
    currency,
    subtotal: amount,
    discountType: 'PERCENTAGE',
    discountValue: 0,
    discountAmount: 0,
    taxableAmount: amount,
    taxRate: 18,
    taxAmount: Math.round(amount * 0.18),
    cgstRate: 9,
    cgstAmount: Math.round(amount * 0.09),
    sgstRate: 9,
    sgstAmount: Math.round(amount * 0.09),
    total: Math.round(amount * 1.18),
    amountInWords: numberToIndianWords(Math.round(amount * 1.18)),
    subtotalInWords: numberToIndianWords(amount),
  };

  return {
    title: `Bid Document for ${clientName} - ${projectName}`,
    documentType: 'Bid Document',
    category: 'Business',
    companyName: issuingCompanyName,
    legalName: issuingLegalName,
    clientName,
    financialData: financials,
    variables: {
      company_name: issuingCompanyName,
      legal_name: issuingLegalName,
      client_name: clientName,
      project_name: projectName,
      document_date: todayStr,
      valid_until: validUntil,
      amount: formattedAmount,
      total_with_tax: formatCurrencyINR(financials.total),
    },
    content: sections,
  };
}

/**
 * Generate Comprehensive Quotation Document
 * FROM issuingCompanyName TO Client with exact base amount & tax calculation
 */
function generateHeuristicQuotationDocument(orgProfile, issuingCompanyName, issuingLegalName, clientName, projectName, amount, currency, todayStr, validUntil, rawPrompt) {
  const p1 = Math.round(amount * 0.5);
  const p2 = Math.round(amount * 0.3);
  const p3 = amount - (p1 + p2);

  const lineItems = [
    {
      title: `${projectName} - Core Engine & Processing Pipeline`,
      description: 'System setup, intelligent workflow execution, and secure API endpoints',
      quantity: 1,
      unit: 'system',
      unitPrice: p1,
    },
    {
      title: `${projectName} - Enterprise Management Console`,
      description: 'Web portal, responsive live editor, template configurations, and RBAC governance',
      quantity: 1,
      unit: 'package',
      unitPrice: p2,
    },
    {
      title: 'Quality Assurance, Production Deployment & 30-Day Hypercare',
      description: 'End-to-end integration testing, cloud server launch, and hypercare engineering support',
      quantity: 1,
      unit: 'service',
      unitPrice: p3,
    },
  ];

  const financials = calculateQuotationFinancials(lineItems, {
    discountType: 'PERCENTAGE',
    discountValue: 0,
    taxRate: 18,
  });

  const sections = [
    {
      id: 'sec_overview',
      type: 'header',
      title: 'Official Quotation & Commercial Estimate',
      body: `QUOTATION NUMBER: QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}\nDATE OF ISSUE: ${todayStr}\nVALIDITY: 30 Calendar Days (Valid until: ${validUntil})\n\nISSUED BY (SELLER / SERVICE PROVIDER):\n${issuingCompanyName} (${issuingLegalName})\n${orgProfile.registeredAddress}\nGSTIN: ${orgProfile.gstin} | PAN: ${orgProfile.pan} | CIN: ${orgProfile.cin}\nEmail: ${orgProfile.email} | Phone: ${orgProfile.phone} | Website: ${orgProfile.website}\n\nISSUED TO (CLIENT / RECIPIENT):\n${clientName}\nAttention: Project / Procurement Team\nSubject: Commercial Quotation for ${projectName}`,
    },
    {
      id: 'sec_scope',
      type: 'text',
      title: '1. Project Scope & Solution Description',
      body: `${issuingCompanyName} is pleased to present this formal quotation to ${clientName} for the implementation of ${projectName}.\n\nOur engagement includes full lifecycle delivery:\n• Solution architecture, system setup, and responsive UI components.\n• Robust backend API layer integrated with PostgreSQL and secure authentication.\n• High-fidelity vector PDF generation, dynamic live preview, and automated email transmission.\n• Strict multi-tenant isolation, data encryption at rest and in transit, and role-based access control.`,
    },
    {
      id: 'sec_table',
      type: 'table',
      title: '2. Itemized Deliverables & Pricing Schedule',
      tableData: {
        headers: ['Item / Deliverable', 'Description', 'Qty', 'Unit', 'Unit Price (INR)', 'Total Amount (INR)'],
        rows: lineItems.map((item) => [
          item.title,
          item.description,
          String(item.quantity),
          item.unit,
          formatCurrencyINR(item.unitPrice),
          formatCurrencyINR(item.quantity * item.unitPrice),
        ]),
      },
    },
    {
      id: 'sec_financial_summary',
      type: 'terms',
      title: '3. Financial Summary & Statutory Tax Breakdown',
      body: `• Base Project Value (Taxable Amount): ${formatCurrencyINR(financials.subtotal)} (${financials.subtotalInWords})\n• Central GST (CGST @ 9%): ${formatCurrencyINR(financials.cgstAmount)}\n• State GST (SGST @ 9%): ${formatCurrencyINR(financials.sgstAmount)}\n• Total Applicable Tax (GST 18%): ${formatCurrencyINR(financials.taxAmount)}\n• Grand Total (Tax Inclusive): ${formatCurrencyINR(financials.total)}\n• Amount in Words: ${financials.amountInWords}\n\nNote: All rates are quoted in Indian Rupees (INR). GST has been calculated accurately as per statutory Indian tax regulations.`,
    },
    {
      id: 'sec_timeline',
      type: 'text',
      title: '4. Delivery Timeline & Milestones',
      body: `• Sprint 1 (Days 1–14): Architecture finalization, database setup, and UI mockups.\n• Sprint 2 (Days 15–30): Core engine development, backend services, and workflow automation.\n• Sprint 3 (Days 31–45): System integration, end-to-end testing, client UAT, and production handover.`,
    },
    {
      id: 'sec_payment_terms',
      type: 'terms',
      title: '5. Payment Terms & Bank Remittance Information',
      body: `Payment Schedule:\n• 50% Advance upon quotation acceptance and project sign-off.\n• 50% upon milestone completion, UAT approval, and delivery.\n\nBank Account Details for NEFT / RTGS Remittance:\nBeneficiary Name: ${issuingLegalName}\nBank Name: ${orgProfile.paymentDetails.bankName}\nAccount Number: ${orgProfile.paymentDetails.accountNumber}\nIFSC Code: ${orgProfile.paymentDetails.ifscCode}\nBranch: ${orgProfile.paymentDetails.branch}\nAccount Type: Current Account`,
    },
    {
      id: 'sec_support_terms',
      type: 'text',
      title: '6. Support, Warranty & Maintenance Terms',
      body: `• Warranty Support: Includes 30 calendar days of comprehensive hypercare warranty support post-production go-live for bug fixes and operational stabilization.\n• Extended Maintenance: Optional Annual Maintenance Contract (AMC) available upon completion of warranty.\n• Helpdesk: Standard support available Monday to Friday, 9:30 AM to 6:30 PM IST via email and ticketing portal.`,
    },
    {
      id: 'sec_terms',
      type: 'terms',
      title: '7. Standard Terms & Conditions',
      body: orgProfile.termsAndConditions || orgProfile.savedTermsAndConditions.join('\n'),
    },
    {
      id: 'sec_signature',
      type: 'signature',
      title: '8. Authorization & Client Acceptance',
      body: `ISSUED BY:\nFor ${issuingLegalName}\n${orgProfile.authorisedSignatory?.name || 'Authorised Signatory'}, ${orgProfile.authorisedSignatory?.designation || 'Director'}\n\nACCEPTED & CONFIRMED BY:\nClient: ${clientName}\nAuthorized Signature: _______________________\nName & Designation: _______________________\nDate: _______________________`,
    },
  ];

  return {
    title: `Quotation for ${clientName} - ${projectName}`,
    documentType: 'Quotation',
    category: 'Sales',
    companyName: issuingCompanyName,
    legalName: issuingLegalName,
    clientName,
    financialData: financials,
    variables: {
      company_name: issuingCompanyName,
      legal_name: issuingLegalName,
      client_name: clientName,
      project_name: projectName,
      document_date: todayStr,
      valid_until: validUntil,
      amount: formatCurrencyINR(financials.total),
      subtotal: formatCurrencyINR(financials.subtotal),
      amount_in_words: financials.amountInWords,
    },
    content: sections,
  };
}

/**
 * Resilient Heuristic Generator covering Legal, HR, Operational & General
 */
function generateHeuristicDocument(prompt, documentType, category, clientContext, templateContext, companyName, clientName, amount, projectName, orgProfile) {
  const entities = extractCommonEntities(prompt);
  const resolvedClientName = clientContext?.name || clientName || entities.clientName || 'Valued Partner';
  const resolvedCompanyName = companyName || entities.companyName || (orgProfile.companyName ? orgProfile.companyName : 'Enterprise Solutions');

  switch (category) {
    case 'HR':
      return generateHeuristicHrDocument(documentType, resolvedCompanyName, resolvedClientName, entities, orgProfile);
    case 'Legal':
      return generateHeuristicLegalDocument(documentType, resolvedCompanyName, resolvedClientName, entities, orgProfile);
    case 'Operational':
      return generateHeuristicOperationalDocument(documentType, resolvedCompanyName, resolvedClientName, entities, orgProfile);
    default:
      return generateHeuristicBusinessDocument(documentType, resolvedCompanyName, resolvedClientName, amount, 'INR', projectName, orgProfile);
  }
}

function generateHeuristicHrDocument(documentType, companyName, candidateName, entities, orgProfile) {
  const role = entities.role || 'Senior Software Engineer';
  const salaryStr = entities.amount ? formatCurrencyINR(entities.amount) : '₹12,00,000';
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
      salary: `${salaryStr} per annum (Cost to Company)`,
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Employment Offer & Appointment Terms',
        body: `Dear ${candidateName},\n\nWe at ${companyName} are pleased to extend this formal offer for the position of ${role} with our organization. Following our discussions, we were thoroughly impressed by your technical background, problem-solving skills, and passion for engineering excellence.\n\nWe are confident that you will play a vital role in building state-of-the-art enterprise document intelligence systems with us.`,
      },
      {
        id: 'sec_2',
        type: 'text',
        title: 'Role, Responsibilities & Reporting',
        body: `1. Reporting Structure: You will report directly to the Director of Engineering at ${companyName}.\n2. Location & Model: Hybrid work model operating out of our Pune Development Center.\n3. Responsibilities: System architecture, scalable microservices, automated testing, and technical mentoring.`,
      },
      {
        id: 'sec_3',
        type: 'table',
        title: 'Compensation Package Breakdown (Annualized)',
        tableData: {
          headers: ['Compensation Component', 'Monthly (INR)', 'Annualized (INR)'],
          rows: [
            ['Basic Salary', '50,000', '6,00,000'],
            ['House Rent Allowance (HRA)', '25,000', '3,00,000'],
            ['Special & Performance Allowance', '20,000', '2,40,000'],
            ['Provident Fund (Employer Share)', '5,000', '60,000'],
            ['Total Cost to Company (CTC)', '1,00,000', salaryStr],
          ],
        },
      },
      {
        id: 'sec_4',
        type: 'terms',
        title: 'Probation, Notice Period & Policies',
        body: '• Probation Period: 90 calendar days from the date of commencement.\n• Notice Period: 30 days during probation, and 60 days following confirmation.\n• Background Checks: This offer is contingent upon satisfactory completion of professional references and credentials verification.',
      },
      {
        id: 'sec_5',
        type: 'signature',
        title: 'Acceptance & Sign-Off',
        body: `For ${companyName}\n${orgProfile.authorisedSignatory?.name || 'Authorised Signatory'}\n\nAccepted & Confirmed:\n${candidateName}\nSignature: _______________________ Date: _______________________`,
      },
    ],
  };
}

function generateHeuristicLegalDocument(documentType, companyName, partnerName, entities, orgProfile) {
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
      effective_date: todayStr,
      term_period: '3 (three) years',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: 'Parties & Recitals',
        body: `This Non-Disclosure & Confidentiality Agreement is entered into as of ${todayStr} by and between:\n\n1. ${companyName}, having its office at ${orgProfile.registeredAddress} ("Disclosing Party"), and\n2. ${partnerName} ("Receiving Party").\n\nThe parties intend to explore strategic technical collaboration and commercial engagements requiring the mutual disclosure of proprietary and confidential information.`,
      },
      {
        id: 'sec_2',
        type: 'text',
        title: '1. Definition of Confidential Information',
        body: '"Confidential Information" encompasses all technical architectures, source code, client records, algorithmic models, business methodologies, pricing structures, financial data, and intellectual property disclosed in written, oral, visual, or electronic form.',
      },
      {
        id: 'sec_3',
        type: 'text',
        title: '2. Obligations of Non-Disclosure',
        body: 'The Receiving Party shall:\n(a) Maintain all Confidential Information with the highest standard of professional care.\n(b) Disclose confidential material solely to employees who have an absolute need-to-know and are bound by equivalent confidentiality obligations.\n(c) Not copy, reverse-engineer, exploit, or distribute any proprietary material without prior written authorization.',
      },
      {
        id: 'sec_4',
        type: 'terms',
        title: '3. Governing Law & Dispute Resolution',
        body: 'This Agreement shall be governed by and construed under the laws of India. Any disputes arising hereunder shall be subject to binding arbitration in Pune, Maharashtra under the Arbitration and Conciliation Act.',
      },
      {
        id: 'sec_5',
        type: 'signature',
        title: 'Authorized Execution',
        body: `Executed on behalf of ${companyName}:\n${orgProfile.authorisedSignatory?.name || 'Authorised Signatory'}\n\nExecuted on behalf of ${partnerName}:\nAuthorized Representative`,
      },
    ],
  };
}

function generateHeuristicOperationalDocument(documentType, companyName, clientName, entities, orgProfile) {
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return {
    title: `${documentType} - ${clientName}`,
    documentType,
    category: 'Operational',
    companyName,
    clientName,
    variables: {
      company_name: companyName,
      client_name: clientName,
      completion_date: todayStr,
      signoff_status: 'Verified & Accepted',
    },
    content: [
      {
        id: 'sec_1',
        type: 'header',
        title: `${documentType} Summary`,
        body: `Official operational record certifying the execution, verification, and handover of technological services by ${companyName} for ${clientName}.`,
      },
      {
        id: 'sec_2',
        type: 'table',
        title: 'Milestone Verification Checklist',
        tableData: {
          headers: ['Deliverable / Item', 'Technical Specification', 'Test Result', 'Verification Status'],
          rows: [
            ['Core Module Deployment', 'Containerized cloud deployment on production VPC', 'PASSED', 'Verified'],
            ['Security & Vulnerability Audit', 'Penetration testing & OWASP compliance audit', 'PASSED', 'Verified'],
            ['User Acceptance Testing (UAT)', 'End-to-end multi-tenant user workflows', 'PASSED', 'Accepted by Client'],
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
        body: `Signed by Project Lead for ${companyName} and Operational Sponsor for ${clientName}.`,
      },
    ],
  };
}

function generateHeuristicBusinessDocument(documentType, companyName, clientName, amount, currency, projectName, orgProfile) {
  return {
    title: `${documentType} for ${clientName}`,
    documentType,
    category: 'Business',
    companyName,
    clientName,
    variables: {
      company_name: companyName,
      client_name: clientName,
      project_name: projectName || 'Enterprise Engineering Solution',
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
            ['Sprint 1', 'Architecture & Wireframes', '2 Weeks', 'Prototypes, PRD, and schema specification'],
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

/**
 * AI Post-Generation Editing Engine
 * Enables user to refine, rewrite, shorten, expand, add sections, and modify pricing
 */
async function editDocumentWithAI({
  document,
  instruction,
  sectionId = null,
  action = 'general',
  organisationId = null,
  userId = null,
}) {
  if (!document) throw new Error('Document data is required for AI editing.');
  const cleanInst = (instruction || '').trim();

  const cloned = JSON.parse(JSON.stringify(document));
  const sections = Array.isArray(cloned.content) ? cloned.content : [];

  // 1. If action is pricing modification
  if (action === 'update_pricing' || cleanInst.toLowerCase().includes('price') || cleanInst.toLowerCase().includes('discount')) {
    const extracted = extractCommonEntities(cleanInst);
    if (extracted.amount && cloned.financialData) {
      const newAmount = extracted.amount;
      const tableSec = sections.find((s) => s.type === 'table');
      if (tableSec && tableSec.tableData && Array.isArray(tableSec.tableData.rows)) {
        const p1 = Math.round(newAmount * 0.5);
        const p2 = Math.round(newAmount * 0.3);
        const p3 = newAmount - (p1 + p2);

        tableSec.tableData.rows = [
          [`Phase 1: Core Engine Architecture`, 'Backend pipeline, database schema, and microservices setup', '1', 'milestone', formatCurrencyINR(p1), formatCurrencyINR(p1)],
          [`Phase 2: Management Portal & UI Modules`, 'Frontend dashboards, responsive interfaces, and validation', '1', 'package', formatCurrencyINR(p2), formatCurrencyINR(p2)],
          [`Phase 3: QA Hardening & Production Launch`, 'UAT sign-off, cloud server deployment, and 30-day warranty', '1', 'service', formatCurrencyINR(p3), formatCurrencyINR(p3)],
        ];

        const lineItems = [
          { title: 'Phase 1: Core Engine Architecture', quantity: 1, unitPrice: p1 },
          { title: 'Phase 2: Management Portal & UI Modules', quantity: 1, unitPrice: p2 },
          { title: 'Phase 3: QA Hardening & Production Launch', quantity: 1, unitPrice: p3 },
        ];

        cloned.financialData = calculateQuotationFinancials(lineItems, { discountType: 'PERCENTAGE', discountValue: 0, taxRate: 18 });
        cloned.variables = {
          ...(cloned.variables || {}),
          amount: formatCurrencyINR(cloned.financialData.total),
          subtotal: formatCurrencyINR(cloned.financialData.subtotal),
          amount_in_words: cloned.financialData.amountInWords,
        };

        const termsSec = sections.find((s) => s.type === 'terms' && s.title.toLowerCase().includes('financial'));
        if (termsSec) {
          termsSec.body = `• Base Project Value: ${formatCurrencyINR(cloned.financialData.subtotal)} (${cloned.financialData.subtotalInWords})\n• Applicable GST @ 18%: ${formatCurrencyINR(cloned.financialData.taxAmount)}\n• Grand Total: ${formatCurrencyINR(cloned.financialData.total)}\n• Amount in Words: ${cloned.financialData.amountInWords}`;
        }
      }
    }
    return cloned;
  }

  // 2. Section-specific editing
  if (sectionId) {
    const secIndex = sections.findIndex((s) => s.id === sectionId);
    if (secIndex !== -1) {
      const targetSec = sections[secIndex];

      // Try AI refinement
      try {
        const sys = `You are an expert enterprise business editor for Dezoryn Technology.
Refine this specific section according to the user instruction: "${cleanInst || action}".
Retain professional tone, high accuracy, and strict corporate formatting.
Output ONLY the refined replacement text for the section body (do not include json or markdown fences).`;

        const res = await AIGateway.execute({
          organisationId,
          userId,
          operation: 'generateText',
          feature: 'ai_document_editor',
          module: 'documents',
          params: {
            prompt: `Current Section Title: ${targetSec.title}\nCurrent Content:\n${targetSec.body || ''}`,
            systemPrompt: sys,
            temperature: 0.2,
            maxTokens: 1000,
          },
        });

        if (res && res.text && res.text.trim()) {
          targetSec.body = res.text.trim();
          cloned.content = sections;
          return cloned;
        }
      } catch (e) {
        console.warn('[AIDocumentBuilderService] AI Edit fallback note:', e.message);
      }

      // Rule-based heuristic edits
      if (action === 'make_professional' || cleanInst.toLowerCase().includes('professional')) {
        targetSec.body = `[Formally Ratified Clause]\n${targetSec.body}\n\nDezoryn Technology warrants that all deliverables outlined herein adhere to enterprise-grade software standards, comprehensive data isolation protocols, and robust security benchmarks.`;
      } else if (action === 'shorten' || cleanInst.toLowerCase().includes('shorten') || cleanInst.toLowerCase().includes('concise')) {
        targetSec.body = targetSec.body.split('\n').filter(Boolean).slice(0, 3).join('\n');
      } else if (action === 'expand' || cleanInst.toLowerCase().includes('expand') || cleanInst.toLowerCase().includes('detail')) {
        targetSec.body = `${targetSec.body}\n\nDetailed Implementation Standards:\n• 100% adherence to agreed technical acceptance criteria.\n• Comprehensive automated test coverage prior to milestone delivery.\n• Continuous stakeholder reporting through structured sprint retrospectives.`;
      }
      cloned.content = sections;
      return cloned;
    }
  }

  // 3. Add new section
  if (action === 'add_section' || cleanInst.toLowerCase().includes('add section')) {
    const newTitle = cleanInst.replace(/add section\s*/i, '').trim() || 'Additional Operational Provisions';
    sections.push({
      id: `sec_custom_${Date.now()}`,
      type: 'text',
      title: newTitle,
      body: `This supplementary section formalizes additional requirements agreed between Dezoryn Technology and ${cloned.clientName}.\n\nAll provisions herein are binding and incorporated into the primary document terms.`,
    });
    cloned.content = sections;
    return cloned;
  }

  // 4. Whole Document AI Refinement
  try {
    const sysPrompt = `You are the Enterprise AI Document Architect for Dezoryn Technology.
The user wants to update the document according to this instruction: "${cleanInst}".
CRITICAL: The issuing party MUST remain Dezoryn Technology. The recipient is ${cloned.clientName}.
Return the updated document in valid JSON with updated "content" array matching the existing structure.
Output raw JSON only.`;

    const aiRes = await AIGateway.execute({
      organisationId,
      userId,
      operation: 'generateText',
      feature: 'ai_document_editor',
      module: 'documents',
      params: {
        prompt: JSON.stringify({ title: cloned.title, content: cloned.content }),
        systemPrompt: sysPrompt,
        temperature: 0.2,
        maxTokens: 3500,
      },
    });

    if (aiRes && aiRes.text) {
      const parsedAi = extractJsonFromText(aiRes.text);
      if (parsedAi && Array.isArray(parsedAi.content)) {
        cloned.content = parsedAi.content;
        if (parsedAi.title) cloned.title = parsedAi.title;
        return cloned;
      }
    }
  } catch (e) {
    console.warn('[AIDocumentBuilderService] Whole document AI edit note:', e.message);
  }

  return cloned;
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

module.exports = {
  detectDocumentIntent,
  extractCommonEntities,
  generateStructuredDocumentFromAI,
  editDocumentWithAI,
  DOCUMENT_TYPE_REGISTRY,
};
