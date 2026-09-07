const AIGateway = require('./aiGateway/AIGateway');
const { calculateQuotationFinancials, round2 } = require('../utils/pricingCalculator');

/**
 * AI Service to parse a natural language prompt into a structured, validated Quotation
 * @param {Object} params
 * @param {string} params.prompt User's natural language request (e.g. "Create a quote for ABC Tech for website dev worth ₹3,00,000")
 * @param {number} params.organisationId
 * @param {number} params.userId
 * @param {Object} [params.clientContext] Existing CRM client info if selected
 * @param {Object} [params.templateContext] Template data if selected
 * @returns {Promise<Object>} Structured Quotation data with recalculated financials
 */
async function generateQuotationFromAI({
  prompt,
  organisationId,
  userId,
  clientContext = null,
  templateContext = null,
}) {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) {
    throw new Error('Prompt is required to generate quotation.');
  }

  const systemPrompt = `
You are an expert Enterprise Billing, Estimating, and Quotation Generation AI.
Your task is to take a natural language request from a business professional and convert it into a complete, structured, professional quotation JSON object.

The output MUST be valid JSON adhering strictly to this schema:
{
  "title": "Short descriptive title of the quotation (e.g. 'Website Design & Full-Stack Development')",
  "clientName": "Client company name or person name extracted from prompt",
  "clientContactPerson": "Contact person name if mentioned, or null",
  "clientEmail": "Client email if mentioned, or null",
  "clientPhone": "Client phone if mentioned, or null",
  "clientAddress": "Client address/city if mentioned, or null",
  "currency": "INR or USD or EUR (default to INR if ₹ or Rs or Lakhs or Indian context, USD if $, otherwise INR)",
  "taxRate": 18,
  "discountType": "PERCENTAGE",
  "discountValue": 0,
  "expiryDays": 30,
  "items": [
    {
      "title": "Clear deliverable / milestone / service title",
      "description": "Detailed explanation of work, scope, deliverables or technical components",
      "quantity": 1,
      "unit": "unit", 
      "unitPrice": 50000,
      "discountPercent": 0,
      "taxPercent": 0
    }
  ],
  "paymentTerms": "Standard payment milestone terms (e.g., '50% advance on sign-off, 30% on beta milestone, 20% on final handover')",
  "termsAndConditions": "Standard professional delivery terms, SLA, revision limits, and intellectual property transfer terms",
  "notes": "Courteous closing note thanking the client for the opportunity"
}

RULES:
1. Extract or intelligently deduce realistic line items matching the total budget or implied value in the prompt.
2. If the user mentions an overall amount (e.g. ₹3,00,000 or $5,000), break it down logically into realistic deliverables (e.g. UI/UX Discovery 20%, Core Architecture & Development 50%, QA & Integration 20%, Deployment & Handover 10%) so the line items sum to the expected base amount.
3. If specific client details are supplied in clientContext, use them.
4. Output ONLY the raw JSON object, without conversational prelude or explanation.
`.trim();

  let contextDescription = '';
  if (clientContext) {
    contextDescription += `\nExisting Client Info: Name: "${clientContext.name}", Email: "${clientContext.email || ''}", Contact: "${clientContext.contactPerson || ''}", Address: "${clientContext.address || clientContext.city || ''}"`;
  }
  if (templateContext) {
    contextDescription += `\nApplied Template: Category: "${templateContext.category}", Default Terms: "${templateContext.defaultTerms || ''}", Default Payment Terms: "${templateContext.defaultPaymentTerms || ''}"`;
  }

  const userPrompt = `
Generate a quotation based on this user instruction:
"${cleanPrompt}"
${contextDescription}
`.trim();

  let parsed = null;

  try {
    const aiResult = await AIGateway.execute({
      organisationId,
      userId,
      operation: 'generateText',
      feature: 'quotation_builder',
      module: 'quotation',
      params: {
        prompt: userPrompt,
        systemPrompt,
        temperature: 0.2,
        maxTokens: 3000,
      },
    });

    if (aiResult && aiResult.text) {
      parsed = extractJsonFromAiResponse(aiResult.text);
    }
  } catch (err) {
    console.warn('[AIQuotationService] AI Gateway failed, falling back to resilient rule-based extractor:', err.message);
  }

  // If AI generation or JSON parsing failed, use smart heuristic fallback
  if (!parsed || !parsed.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    parsed = generateHeuristicQuotation(cleanPrompt, clientContext, templateContext);
  }

  // Ensure clientContext values take priority if explicitly selected
  if (clientContext) {
    if (clientContext.name) parsed.clientName = clientContext.name;
    if (clientContext.email) parsed.clientEmail = clientContext.email;
    if (clientContext.contactPerson) parsed.clientContactPerson = clientContext.contactPerson;
    if (clientContext.phone) parsed.clientPhone = clientContext.phone;
    if (clientContext.address || clientContext.city) {
      parsed.clientAddress = [clientContext.address, clientContext.city, clientContext.state, clientContext.country]
        .filter(Boolean)
        .join(', ');
    }
  }

  // Expiry date calculation
  const expiryDays = Math.max(1, Number(parsed.expiryDays || 30));
  const issueDate = new Date();
  const expiryDate = new Date(issueDate.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  // Recalculate all financials through the authoritative pricing engine
  const financials = calculateQuotationFinancials(parsed.items, {
    discountType: parsed.discountType || 'PERCENTAGE',
    discountValue: parsed.discountValue || 0,
    taxRate: parsed.taxRate !== undefined ? parsed.taxRate : 18,
  });

  return {
    title: parsed.title || 'Professional Services Quotation',
    clientName: parsed.clientName || 'Valued Client',
    clientContactPerson: parsed.clientContactPerson || null,
    clientEmail: parsed.clientEmail || null,
    clientPhone: parsed.clientPhone || null,
    clientAddress: parsed.clientAddress || null,
    currency: parsed.currency || 'INR',
    issueDate,
    expiryDate,
    items: financials.items,
    subtotal: financials.subtotal,
    discountType: financials.discountType,
    discountValue: financials.discountValue,
    discountAmount: financials.discountAmount,
    taxRate: financials.taxRate,
    taxAmount: financials.taxAmount,
    total: financials.total,
    paymentTerms: parsed.paymentTerms || '50% advance on sign-off, 50% upon milestone completion and deployment.',
    termsAndConditions: parsed.termsAndConditions || '1. Quotation valid for 30 days.\n2. Scope changes outside agreed specifications will be billed separately.\n3. Source code and IP transferred upon final invoice clearance.',
    notes: parsed.notes || 'Thank you for your business. We look forward to delivering exceptional results for your team.',
    aiPrompt: cleanPrompt,
  };
}

/**
 * Safely extract JSON from an LLM text response
 */
function extractJsonFromAiResponse(text) {
  if (!text) return null;
  let clean = text.trim();

  // Remove markdown code fence if present
  if (clean.includes('```')) {
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      clean = match[1].trim();
    }
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    // Attempt to locate first { and last }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
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
 * Heuristic fallback parser when LLM is unavailable or unparseable
 */
function generateHeuristicQuotation(prompt, clientContext, templateContext) {
  const text = prompt.toLowerCase();

  // Detect currency
  let currency = 'INR';
  if (text.includes('$') || text.includes('usd') || text.includes('dollar')) {
    currency = 'USD';
  } else if (text.includes('€') || text.includes('eur') || text.includes('euro')) {
    currency = 'EUR';
  } else if (text.includes('£') || text.includes('gbp')) {
    currency = 'GBP';
  }

  // Detect total amount
  let totalAmount = 100000; // default 1 Lakh INR
  const lakhMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i);
  const rawNumMatch = text.match(/(?:₹|rs\.?|\$|€|£)?\s*([\d,]+(?:\.\d+)?)/i);

  if (lakhMatch && lakhMatch[1]) {
    totalAmount = parseFloat(lakhMatch[1]) * 100000;
  } else if (rawNumMatch && rawNumMatch[1]) {
    const cleanedNum = parseFloat(rawNumMatch[1].replace(/,/g, ''));
    if (!isNaN(cleanedNum) && cleanedNum > 100) {
      totalAmount = cleanedNum;
    }
  }

  // Extract client name if "for <Client>"
  let clientName = clientContext?.name || 'Prospective Client';
  const clientMatch = prompt.match(/for\s+([A-Za-z0-9\s&]+?)(?:\s+(?:worth|for|regarding|with|at|amount|to|\.|$))/i);
  if (clientMatch && clientMatch[1] && clientMatch[1].trim().length > 2) {
    const extracted = clientMatch[1].trim();
    if (!['a', 'an', 'the', 'website', 'app', 'software', 'project'].includes(extracted.toLowerCase())) {
      clientName = extracted;
    }
  }

  // Detect project domain/scope
  let title = 'Professional Services Quotation';
  let items = [];

  if (text.includes('web') || text.includes('website') || text.includes('portal')) {
    title = `Website Development Quotation for ${clientName}`;
    const p1 = round2(totalAmount * 0.25);
    const p2 = round2(totalAmount * 0.45);
    const p3 = round2(totalAmount * 0.20);
    const p4 = round2(totalAmount - (p1 + p2 + p3));

    items = [
      {
        title: 'UI/UX Design & Architecture Specification',
        description: 'Wireframes, responsive design layouts, interactive prototypes, and UX user journeys.',
        quantity: 1,
        unit: 'service',
        unitPrice: p1,
      },
      {
        title: 'Frontend & Backend Application Development',
        description: 'Modern responsive web application development, RESTful API integration, and database schema setup.',
        quantity: 1,
        unit: 'service',
        unitPrice: p2,
      },
      {
        title: 'Quality Assurance, Cross-Device Testing & Security',
        description: 'Automated unit tests, responsive browser verification, and security vulnerability audits.',
        quantity: 1,
        unit: 'service',
        unitPrice: p3,
      },
      {
        title: 'Cloud Deployment, SSL Configuration & 30-Day Support',
        description: 'Production server deployment, domain DNS setup, SSL hardening, and post-launch maintenance.',
        quantity: 1,
        unit: 'service',
        unitPrice: p4,
      },
    ];
  } else if (text.includes('mobile') || text.includes('app') || text.includes('ios') || text.includes('android')) {
    title = `Mobile Application Development for ${clientName}`;
    const p1 = round2(totalAmount * 0.3);
    const p2 = round2(totalAmount * 0.5);
    const p3 = round2(totalAmount - (p1 + p2));
    items = [
      {
        title: 'Mobile UI/UX Design System',
        description: 'Native iOS & Android component design and design token architecture.',
        quantity: 1,
        unit: 'service',
        unitPrice: p1,
      },
      {
        title: 'Cross-Platform Core Application Development',
        description: 'State management, offline data sync, push notification integration, and API services.',
        quantity: 1,
        unit: 'service',
        unitPrice: p2,
      },
      {
        title: 'App Store & Google Play Publishing & QA',
        description: 'Compliance verification, store listing preparation, and staging environment verification.',
        quantity: 1,
        unit: 'service',
        unitPrice: p3,
      },
    ];
  } else {
    // General consulting / services breakdown
    title = `Professional Deliverables & Services for ${clientName}`;
    const p1 = round2(totalAmount * 0.4);
    const p2 = round2(totalAmount * 0.4);
    const p3 = round2(totalAmount - (p1 + p2));
    items = [
      {
        title: 'Phase 1: Discovery, Strategy & Initial Implementation',
        description: 'Requirement analysis, solution design, and kickoff deliverables.',
        quantity: 1,
        unit: 'phase',
        unitPrice: p1,
      },
      {
        title: 'Phase 2: Execution, Integration & Core Deliverables',
        description: 'Full delivery of project milestones and functional components.',
        quantity: 1,
        unit: 'phase',
        unitPrice: p2,
      },
      {
        title: 'Phase 3: Validation, Handover & Documentation',
        description: 'Final acceptance testing, operational handover, and knowledge transfer session.',
        quantity: 1,
        unit: 'phase',
        unitPrice: p3,
      },
    ];
  }

  return {
    title,
    clientName,
    clientContactPerson: clientContext?.contactPerson || null,
    clientEmail: clientContext?.email || null,
    clientPhone: clientContext?.phone || null,
    clientAddress: clientContext?.address || clientContext?.city || null,
    currency,
    taxRate: 18,
    discountType: 'PERCENTAGE',
    discountValue: 0,
    expiryDays: 30,
    items,
    paymentTerms: templateContext?.defaultPaymentTerms || '50% advance on sign-off, 30% upon beta milestone, 20% on final handover.',
    termsAndConditions: templateContext?.defaultTerms || '1. Valid for 30 calendar days.\n2. Work commences within 3 business days of advance payment clearance.\n3. All IP transferred upon settlement of final invoice.',
    notes: templateContext?.defaultNotes || 'Thank you for considering our proposal. Please review and confirm your acceptance.',
  };
}

module.exports = {
  generateQuotationFromAI,
};
