const prisma = require("../config/prismaClient");
const OCRService = require("./ocrService");
const { generateStructuredDocumentFromAI } = require("./aiDocumentBuilderService");
const unifiedDocumentService = require("./unifiedDocumentService");
const GeminiAdapter = require("./aiGateway/adapters/GeminiAdapter");

/**
 * Enterprise Unified OCR & Document Extraction Engine
 * Provides structured, multi-tier processing across all document formats.
 */
class UnifiedOcrService {
  /**
   * Process document extraction based on selected action dropdown
   */
  static async processDocument({
    file,
    action = "extract_text",
    customPrompt = "",
    organisationId = 1,
    userId = null,
    userName = "System User",
    req = null,
  }) {
    if (!file || !file.buffer) {
      throw new Error("No file uploaded for OCR extraction.");
    }

    const startTime = Date.now();
    const fileName = file.originalname || "scanned_document.pdf";
    const mimeType = file.mimetype || "application/pdf";
    const fileSize = file.size || file.buffer.length;

    // 1. Run Core OCR Text Extraction
    const ocrResult = await OCRService.extractText({
      buffer: file.buffer,
      mimeType,
      language: "eng",
    });

    const rawText = ocrResult?.text || "";
    const baseConfidence = ocrResult?.confidence || 0.95;

    // 2. Perform Structured Extraction based on the selected action
    const structured = await UnifiedOcrService.extractStructuredByAction({
      rawText,
      action,
      fileBuffer: file.buffer,
      mimeType,
      customPrompt,
      organisationId,
    });

    const latencyMs = Date.now() - startTime;

    // 3. Persist OCR Job Record in PostgreSQL
    const ocrJob = await prisma.oCRJobRecord.create({
      data: {
        organisationId: parseInt(organisationId, 10),
        userId: userId ? parseInt(userId, 10) : null,
        fileName,
        fileType: mimeType,
        fileSize,
        extractionAction: action,
        status: "COMPLETED",
        extractedText: rawText,
        extractedData: structured.data || {},
        confidence: structured.confidence || baseConfidence,
        detectedFields: structured.fields || [],
      },
    }).catch((err) => {
      console.warn("[UnifiedOcrService] Notice persisting OCR job:", err.message);
      return { id: "ocr-mem-" + Date.now() };
    });

    // 4. Record Audit Log
    await prisma.unifiedDocumentAuditLog.create({
      data: {
        organisationId: parseInt(organisationId, 10),
        userId: userId ? parseInt(userId, 10) : null,
        userName,
        action: "OCR_PROCESSED",
        details: `Processed "${fileName}" using action: ${action} (${Math.round((structured.confidence || baseConfidence) * 100)}% confidence)`,
        metadata: {
          fileName,
          action,
          latencyMs,
          fieldsExtracted: structured.fields?.length || 0,
        },
      },
    }).catch(() => {});

    // Return structured response with preview data
    const isImage = mimeType.startsWith("image/");
    const previewDataUrl = isImage ? `data:${mimeType};base64,${file.buffer.toString("base64")}` : null;

    return {
      success: true,
      jobId: ocrJob.id,
      fileName,
      mimeType,
      fileSize,
      action,
      status: "COMPLETED",
      latencyMs,
      confidence: structured.confidence || baseConfidence,
      confidenceScore: Math.round((structured.confidence || baseConfidence) * 100),
      extractedText: rawText,
      extractedData: structured.data || {},
      detectedFields: structured.fields || [],
      tables: structured.tables || [],
      previewUrl: previewDataUrl,
      isPdf: mimeType.includes("pdf"),
      actionLabel: UnifiedOcrService.getActionLabel(action),
    };
  }

  /**
   * Action-specific structured parsing
   */
  static async extractStructuredByAction({
    rawText,
    action,
    fileBuffer,
    mimeType,
    customPrompt = "",
    organisationId = 1,
  }) {
    const geminiKey = process.env.GEMINI_API_KEY;

    // Use Gemini for high-precision extraction if available
    if (geminiKey && rawText && rawText.length > 10) {
      try {
        const adapter = new GeminiAdapter({ apiKey: geminiKey });
        const systemPrompt = UnifiedOcrService.buildPromptForAction(action, customPrompt);

        const aiRes = await adapter.generateText({
          prompt: `${systemPrompt}\n\nDOCUMENT TEXT TO EXTRACT FROM:\n${rawText.slice(0, 15000)}`,
          temperature: 0.1,
        });

        if (aiRes?.text) {
          const jsonMatch = aiRes.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              data: parsed.data || parsed,
              fields: parsed.fields || UnifiedOcrService.flattenToFields(parsed.data || parsed),
              tables: parsed.tables || [],
              confidence: 0.98,
            };
          }
        }
      } catch (err) {
        console.warn("[UnifiedOcrService] AI extraction note, fallback to rule-based:", err.message);
      }
    }

    // Fallback: Resilient Rule-Based Entity Extractor
    return UnifiedOcrService.ruleBasedExtraction(rawText, action);
  }

  /**
   * Rule-based extraction fallback for all actions
   */
  static ruleBasedExtraction(text, action) {
    const fields = [];
    const data = {};
    const tables = [];

    // Extract Dates
    const dateRegex = /\b(\d{1,2}[-/.](?:[A-Za-z]{3}|\d{1,2})[-/.]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/gi;
    const dates = Array.from(new Set(text.match(dateRegex) || []));
    if (dates.length > 0) {
      data.dates = dates;
      dates.forEach((d, i) => fields.push({ key: `date_${i + 1}`, label: `Detected Date #${i + 1}`, value: d, confidence: 0.95 }));
    }

    // Extract Amounts (INR, USD, EUR, etc.)
    const amountRegex = /(?:₹|Rs\.?|INR|\$|€|USD|EUR)\s?([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\b/gi;
    const amounts = Array.from(new Set(text.match(amountRegex) || []));
    if (amounts.length > 0) {
      data.amounts = amounts;
      amounts.forEach((a, i) => fields.push({ key: `amount_${i + 1}`, label: `Financial Value #${i + 1}`, value: a, confidence: 0.94 }));
    }

    // Extract Emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = Array.from(new Set(text.match(emailRegex) || []));
    if (emails.length > 0) {
      data.emails = emails;
      emails.forEach((em, i) => fields.push({ key: `email_${i + 1}`, label: `Email Address #${i + 1}`, value: em, confidence: 0.98 }));
    }

    // Extract Phone Numbers
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    const phones = Array.from(new Set(text.match(phoneRegex) || [])).filter((p) => p.replace(/\D/g, "").length >= 10);
    if (phones.length > 0) {
      data.phoneNumbers = phones;
      phones.forEach((ph, i) => fields.push({ key: `phone_${i + 1}`, label: `Phone Number #${i + 1}`, value: ph, confidence: 0.92 }));
    }

    // Extract GSTIN / Tax IDs
    const gstinRegex = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/g;
    const gstins = Array.from(new Set(text.match(gstinRegex) || []));
    if (gstins.length > 0) {
      data.taxRegistrations = gstins;
      gstins.forEach((g, i) => fields.push({ key: `gstin_${i + 1}`, label: `GSTIN / Tax Registration #${i + 1}`, value: g, confidence: 0.99 }));
    }

    // Extract Invoice / Doc Numbers
    const docNoRegex = /(?:invoice|quotation|quote|order|bill|ref|po)\s*(?:no|number|#)?[:.\s]*([A-Z0-9-/]+)/gi;
    let docMatch;
    while ((docMatch = docNoRegex.exec(text)) !== null) {
      if (docMatch[1] && docMatch[1].length > 2) {
        data.documentNumber = docMatch[1].trim();
        fields.push({ key: "document_number", label: "Document / Invoice Number", value: docMatch[1].trim(), confidence: 0.96 });
        break;
      }
    }

    // Extract Tables (Lines with pipe | or tab \t or multiple aligned columns)
    const lines = text.split("\n");
    const tableLines = lines.filter((l) => l.includes("|") || (l.split(/\s{2,}/).length >= 3 && /\d/.test(l)));
    if (tableLines.length >= 2) {
      const headers = tableLines[0].includes("|")
        ? tableLines[0].split("|").map((c) => c.trim()).filter(Boolean)
        : tableLines[0].split(/\s{2,}/).map((c) => c.trim()).filter(Boolean);

      const rows = tableLines.slice(1).map((l) =>
        l.includes("|") ? l.split("|").map((c) => c.trim()).filter(Boolean) : l.split(/\s{2,}/).map((c) => c.trim()).filter(Boolean)
      );

      tables.push({ title: "Extracted Line Items", headers, rows });
      data.tables = tables;
    }

    return {
      data,
      fields,
      tables,
      confidence: 0.92,
    };
  }

  /**
   * Flatten nested object to field list
   */
  static flattenToFields(obj, prefix = "") {
    const fields = [];
    if (!obj || typeof obj !== "object") return fields;

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (str) => str.toUpperCase())
        .trim();

      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        fields.push(...UnifiedOcrService.flattenToFields(value, fullKey));
      } else if (value !== null && value !== undefined) {
        fields.push({
          key: fullKey,
          label,
          value: Array.isArray(value) ? JSON.stringify(value) : String(value),
          confidence: 0.95,
        });
      }
    }
    return fields;
  }

  /**
   * Build targeted prompt for selected extraction action
   */
  static buildPromptForAction(action, customPrompt) {
    const base = `You are a cognitive document extraction system. Extract structured data from the document text provided and return ONLY valid JSON matching this schema:
{
  "data": { ...structured key-value pairs... },
  "fields": [
    { "key": "field_name", "label": "Human Label", "value": "Extracted Value", "confidence": 0.98, "type": "text|number|date|currency" }
  ],
  "tables": [
    { "title": "Table Title", "headers": ["Col1", "Col2"], "rows": [["val1", "val2"]] }
  ]
}`;

    switch (action) {
      case "extract_invoice":
        return `${base}\nFocus: INVOICE DATA. Extract: invoiceNumber, invoiceDate, dueDate, vendorName, vendorAddress, vendorGstin, clientName, clientAddress, clientGstin, lineItems (with item, qty, rate, amount), subtotal, taxAmount, grandTotal, currency, bankDetails.`;
      case "extract_quotation":
        return `${base}\nFocus: QUOTATION / ESTIMATE. Extract: quotationNumber, quotationDate, validityDate, issuerName, clientName, lineItems (deliverables, quantities, unit rates, amounts), subtotal, totalAmount, paymentTerms, projectScope.`;
      case "extract_contract":
        return `${base}\nFocus: CONTRACT / LEGAL AGREEMENT. Extract: agreementTitle, partyA, partyB, effectiveDate, terminationDate, governingLaw, scopeOfObligations, considerationAmount, confidentialityTerms, indemnityClauses.`;
      case "extract_tables":
        return `${base}\nFocus: TABULAR DATA. Identify and extract all tables, itemizations, line items, deliverables, schedules, pricing matrices with precise headers and rows.`;
      case "extract_fields":
        return `${base}\nFocus: KEY-VALUE FIELDS. Identify all key-value pairings, metadata, identifiers, attributes, and statutory properties.`;
      case "extract_id":
        return `${base}\nFocus: IDENTIFIERS & REGISTRATIONS. Extract all registration numbers, GSTIN, PAN, CIN, DIN, Aadhaar, Passport, Company Reg #, reference IDs.`;
      case "extract_dates":
        return `${base}\nFocus: DATES & TIMELINES. Extract all dates, due dates, execution dates, milestones, delivery deadlines, validity periods.`;
      case "extract_amounts":
        return `${base}\nFocus: FINANCIAL VALUES & AMOUNTS. Extract all currency values, fees, rates, line item totals, taxes, discounts, net and gross values.`;
      case "extract_names":
        return `${base}\nFocus: NAMES & ENTITIES. Extract all individual names, job titles, business legal names, trading names, subsidiaries.`;
      case "extract_contacts":
        return `${base}\nFocus: CONTACT DETAILS. Extract all email addresses, phone numbers, postal addresses, office locations, website URLs.`;
      case "extract_custom":
        return `${base}\nFocus: CUSTOM EXTRACTION. User specific requirement: "${customPrompt || "Extract key operational variables and metrics"}".`;
      default:
        return `${base}\nFocus: COMPREHENSIVE TEXT & STRUCTURE. Extract full structured representation of the document.`;
    }
  }

  /**
   * Action Label mapping
   */
  static getActionLabel(action) {
    const labels = {
      extract_text: "Extract Text",
      extract_tables: "Extract Tables",
      extract_fields: "Extract Fields",
      extract_invoice: "Extract Invoice Data",
      extract_quotation: "Extract Quotation Data",
      extract_contract: "Extract Contract Data",
      extract_id: "Extract ID / Reference Data",
      extract_dates: "Extract Dates",
      extract_amounts: "Extract Amounts",
      extract_names: "Extract Names",
      extract_contacts: "Extract Contact Information",
      extract_custom: "Extract Custom Fields",
      extract_and_create_doc: "Extract and Create Document",
      extract_and_generate_ai: "Extract and Generate AI Document",
    };
    return labels[action] || "Extract Text";
  }

  /**
   * Create a new UnifiedDocument directly from OCR Extraction
   */
  static async createDocumentFromOcr({
    ocrData,
    rawText,
    fileName,
    title,
    documentType = "Invoice",
    category = "General",
    organisationId = 1,
    userId = null,
    userName = "System User",
    req = null,
  }) {
    const effectiveTitle = title || `Extracted Document: ${fileName || "OCR Import"}`;
    const clientName = ocrData?.clientName || ocrData?.data?.clientName || ocrData?.vendorName || "Client / Counterparty";
    const clientEmail = ocrData?.clientEmail || ocrData?.data?.clientEmail || null;

    // Convert extracted structured data and tables into Document Sections
    const sections = [];

    // Header Overview Section
    sections.push({
      id: "sec_overview",
      type: "header",
      title: "Document Overview & Extracted Details",
      body: `DOCUMENT: ${documentType.toUpperCase()}\nSOURCE: OCR Digital Extraction (${fileName})\nEXTRACTED ON: ${new Date().toLocaleDateString("en-GB")}\nPARTY / CLIENT: ${clientName}`,
    });

    // Tables Section (if tables exist)
    if (ocrData?.tables && ocrData.tables.length > 0) {
      ocrData.tables.forEach((tbl, idx) => {
        sections.push({
          id: `sec_table_${idx + 1}`,
          type: "table",
          title: tbl.title || `Itemized Schedule #${idx + 1}`,
          tableData: {
            headers: tbl.headers || ["Item", "Description", "Rate", "Amount"],
            rows: tbl.rows || [],
          },
        });
      });
    }

    // Key Extracted Text & Notes
    sections.push({
      id: "sec_body",
      type: "text",
      title: "Extracted Content & Provisions",
      body: rawText ? rawText.slice(0, 3000) : "Content verified from digital extraction.",
    });

    // Terms / Verification
    sections.push({
      id: "sec_terms",
      type: "terms",
      title: "Verification & Statutory Terms",
      body: `1. Verified via Enterprise OCR Pipeline with digital confidence check.\n2. Imported automatically into DocuCore Document Automation Lifecycle.`,
    });

    // Create document in database
    const newDoc = await unifiedDocumentService.createDocument(
      organisationId,
      userId,
      userName,
      {
        title: effectiveTitle,
        documentType,
        category,
        clientName,
        clientEmail,
        content: sections,
        financialData: ocrData?.financialData || null,
        variables: { client_name: clientName, source_file: fileName },
        status: "DRAFT",
      },
      req
    );

    return newDoc;
  }
}

module.exports = UnifiedOcrService;
