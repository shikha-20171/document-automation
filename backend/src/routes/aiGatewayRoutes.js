const express = require("express");
const router = express.Router();
const AIGateway = require("../services/aiGateway/AIGateway");
const aiChatService = require("../services/aiChatService");
const aiDocumentService = require("../services/aiDocumentService");
const PromptService = require("../services/aiGateway/PromptService");
const QuotaService = require("../services/quotaService");
const prisma = require("../config/prismaClient");

const getAuthContext = (req) => {
  const orgId = req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || 1;
  const userId = req.user?.id || req.user?.userId || null;
  return {
    organisationId: Number(orgId) || 1,
    userId: userId ? String(userId) : null,
    role: req.user?.role || "EMPLOYEE",
  };
};

/**
 * GET /api/ai/available-models
 */
router.get("/available-models", async (req, res, next) => {
  try {
    const data = await aiChatService.getAvailableModels(req);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/chat
 */
router.post("/chat", async (req, res, next) => {
  try {
    const data = await aiChatService.sendMessage(req);
    res.json(data);
  } catch (err) {
    if (err.code === "AI_QUOTA_EXCEEDED" || err.code === "PLAN_UPGRADE_REQUIRED" || err.code === "AI_PROVIDER_NOT_ALLOWED") {
      return res.status(403).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
});

/**
 * GET /api/ai/conversations
 */
router.get("/conversations", async (req, res, next) => {
  try {
    const data = await aiChatService.getConversations(req);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ai/conversations/:id
 */
router.get("/conversations/:id", async (req, res, next) => {
  try {
    const data = await aiChatService.getConversationById(req, req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/ai/conversations/:id
 */
router.delete("/conversations/:id", async (req, res, next) => {
  try {
    const data = await aiChatService.deleteConversation(req, req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ai/documents
 * List existing documents for AI processing in the active organisation
 */
router.get("/documents", async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const documents = await prisma.document.findMany({
      where: { organisation_id: organisationId },
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        uploaded_by: true,
        created_at: true,
        updated_at: true,
      },
    }).catch(() => []);

    res.json({
      success: true,
      data: documents,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ai/history
 * Fetch recent AI tool executions from AILog
 */
router.get("/history", async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const logs = await prisma.aILog.findMany({
      where: { organisationId: String(organisationId) },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        provider: { select: { providerName: true } },
        model: { select: { modelName: true } },
      },
    }).catch(() => []);

    const formatted = logs.map((l) => ({
      id: l.id,
      logCode: l.logCode,
      tool: l.promptType,
      status: l.requestStatus === "SUCCESS" ? "Completed" : "Failed",
      latencyMs: l.latencyMs,
      totalTokens: l.totalTokens,
      provider: l.provider?.providerName || "Google Gemini",
      model: l.model?.modelName || "Gemini 3.5 Flash",
      createdAt: l.createdAt,
      errorMessage: l.errorMessage,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/documents/save
 */
router.post("/documents/save", async (req, res, next) => {
  try {
    const data = await aiDocumentService.saveAiContentAsDocument(req);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/from-ai", async (req, res, next) => {
  try {
    const data = await aiDocumentService.saveAiContentAsDocument(req);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ai/entitlements
 */
router.get("/entitlements", async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const entitlements = await AIGateway.getOrganisationEntitlements(organisationId);
    res.json({ success: true, data: entitlements });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ai/usage
 */
router.get("/usage", async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const entitlements = await AIGateway.getOrganisationEntitlements(organisationId);
    res.json({
      success: true,
      data: {
        planName: entitlements.planName,
        monthlyQuota: entitlements.monthlyQuota,
        usedRequests: entitlements.usedRequests,
        remainingRequests: entitlements.remainingRequests,
        usagePercent: entitlements.usagePercent,
        estimatedCost: entitlements.estimatedCostMonth,
        allowedProviders: entitlements.allowedProviders,
        allProviders: entitlements.allProviders,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ai/providers
 */
router.get("/providers", async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const entitlements = await AIGateway.getOrganisationEntitlements(organisationId);
    res.json({ success: true, data: entitlements.allowedProviders });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/generate
 */
router.post("/generate", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { prompt, systemPrompt, provider, model, temperature, maxTokens, feature = "general_chat" } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required." });
    }

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateText",
      feature,
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt, temperature, maxTokens },
    });

    res.json({ success: true, data: result });
  } catch (err) {
    if (err.code === "AI_QUOTA_EXCEEDED" || err.code === "SUBSCRIPTION_INACTIVE" || err.code === "PLAN_UPGRADE_REQUIRED") {
      return res.status(403).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
});

/**
 * =========================================================================
 * MODULE 2: AI DOCUMENT BUILDER
 * POST /api/ai/document/generate
 * =========================================================================
 */
router.post("/document/generate", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const {
      title,
      type = "Employment Agreement",
      prompt = "",
      tone = "Professional",
      language = "English",
      length = "Standard",
      templateValues = {},
      employeeData = null,
      clientData = null,
      organisationData = null,
      provider,
      model,
    } = req.body;

    const { systemPrompt, userPrompt } = PromptService.buildDocumentGenerationPrompt({
      title: title || type,
      documentType: type,
      instructions: prompt,
      tone,
      language,
      organisationData: organisationData || {},
      recipientData: employeeData || clientData || {},
      variables: templateValues,
    });

    const fullPrompt = `${userPrompt}\nDesired Length: ${length}\nStructure clearly with appropriate headings, formal legal clauses, definitions, obligations, and signature placeholders.`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateText",
      feature: "document_generate",
      module: "ai_builder",
      provider,
      model,
      params: { prompt: fullPrompt, systemPrompt, temperature: 0.2 },
    });

    res.json({
      success: true,
      data: {
        documentTitle: title || type,
        content: result.text,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
      },
    });
  } catch (err) {
    if (err.code === "AI_QUOTA_EXCEEDED" || err.code === "SUBSCRIPTION_INACTIVE") {
      return res.status(403).json({ success: false, code: err.code, message: err.message });
    }
    next(err);
  }
});

/**
 * =========================================================================
 * MODULE 3: THE 10 AI TOOLS (CENTRALIZED PROCESSING ON EXISTING CONTENT)
 * =========================================================================
 */

/**
 * 1. OCR Tool: Extract text and key fields from image/PDF via Tesseract OCR Engine
 * POST /api/ai/ocr
 */
const { extractTextFromBuffer } = require("../services/ocrService");

router.post("/ocr", async (req, res, next) => {
  try {
    const { imageBase64, documentText, fileName = "Document", language = "English" } = req.body;

    if (!imageBase64 && !documentText) {
      return res.status(400).json({ success: false, message: "Please provide an image or document text to extract." });
    }

    let fileBuffer;
    let mimeType = "image/png";

    if (imageBase64) {
      const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        fileBuffer = Buffer.from(matches[2], "base64");
      } else {
        if (fileName && fileName.toLowerCase().endsWith(".pdf")) {
          mimeType = "application/pdf";
        }
        fileBuffer = Buffer.from(imageBase64, "base64");
      }
    } else {
      fileBuffer = Buffer.from(documentText, "utf8");
      mimeType = "text/plain";
    }

    const auth = getAuthContext(req);
    await QuotaService.checkAndIncrementOCR(auth.organisationId, auth.userId, 1);

    const ocrResult = await extractTextFromBuffer(
      {
        buffer: fileBuffer,
        mimetype: mimeType,
        originalname: fileName,
      },
      language
    );

    const extractedText = ocrResult.text || "";

    // Asynchronously log to OCRJob
    try {
      const p = await prisma.oCRProvider.findFirst({ where: { isDefault: true } }).catch(() => null);
      await prisma.oCRJob.create({
        data: {
          jobCode: `OCR-${Date.now()}`,
          organisationId: String(auth.organisationId),
          userId: auth.userId ? String(auth.userId) : null,
          providerId: p?.id || "tesseract-default",
          documentName: fileName,
          pages: ocrResult.pageCount || 1,
          status: "COMPLETED",
          confidenceScore: Number(((ocrResult.confidence || 0.96) * 100).toFixed(1)),
          executionTimeMs: 180,
          costEstimate: 0.0005,
        },
      }).catch(() => null);
    } catch (jobErr) {
      // ignore
    }

    // Extract quick structured metadata fields (heuristics)
    const keyFields = [];
    const invoiceMatch = extractedText.match(/(?:invoice|inv|bill)[\s#:]*([A-Za-z0-9-_]+)/i);
    if (invoiceMatch) keyFields.push({ field: "Invoice / Ref Number", value: invoiceMatch[1] });
    const dateMatch = extractedText.match(/(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|\w+\s+\d{1,2},\s+\d{4})/);
    if (dateMatch) keyFields.push({ field: "Document Date", value: dateMatch[0] });
    const totalMatch = extractedText.match(/(?:total|amount|grand total|balance due)[\s:$€₹£]*([\d,]+(?:\.\d{2})?)/i);
    if (totalMatch) keyFields.push({ field: "Total Amount", value: totalMatch[1] });

    res.json({
      success: true,
      data: {
        fileName,
        text: extractedText,
        extractedText,
        editableText: extractedText,
        characterCount: extractedText.length,
        confidence: ocrResult.confidence || 0.96,
        confidenceScore: ocrResult.confidence || 0.96,
        detectedLanguage: language,
        keyFields,
        pageCount: ocrResult.pageCount || 1,
        provider: "Tesseract OCR Engine (Local)",
        model: ocrResult.method || "TESSERACT_OCR",
      },
    });
  } catch (err) {
    next(err);
  }
});

const resolveContent = async (req) => {
  if (req.body?.text && typeof req.body.text === "string" && req.body.text.trim().length > 0) {
    return req.body.text.trim();
  }
  if (req.body?.documentText && typeof req.body.documentText === "string" && req.body.documentText.trim().length > 0) {
    return req.body.documentText.trim();
  }
  if (req.body?.imageBase64 || req.file || req.body?.file) {
    try {
      const ocrRes = await extractTextFromBuffer({
        buffer: req.file?.buffer,
        mimetype: req.file?.mimetype,
        imageBase64: req.body?.imageBase64,
        originalname: req.file?.originalname || req.body?.fileName,
      });
      if (ocrRes?.text && ocrRes.text.trim().length > 0) {
        return ocrRes.text.trim();
      }
    } catch (e) {
      console.warn("[AIGateway] Auto OCR parse notice:", e.message);
    }
  }
  return "";
};

/**
 * 2. Summarize Tool: Short / Standard / Detailed / Executive Summary
 * POST /api/ai/summarize
 */
router.post("/summarize", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const {
      length = "Standard",
      includeKeyPoints = true,
      includeActionItems = true,
      includeImportantDates = true,
      provider,
      model,
    } = req.body;

    const text = await resolveContent(req);
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Please upload a document/PDF or enter text content." });
    }

    const prompt = `Provide an executive summary of the following document.
Target Length: ${length} (Short = 2-3 concise sentences, Standard = 1-2 structured paragraphs, Detailed = comprehensive section-by-section breakdown, Executive Summary = high-level strategic overview).
Requirements:
- Key points requested: ${includeKeyPoints}
- Action items requested: ${includeActionItems}
- Important dates requested: ${includeImportantDates}

Only include sections when relevant information actually exists in the document.

Return a JSON object with schema:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "actionItems": ["...", "..."],
  "importantDates": ["...", "..."]
}

DOCUMENT CONTENT:
${text.slice(0, 25000)}`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateStructuredOutput",
      feature: "summarize",
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt: "You are an enterprise document intelligence analyst. Output JSON only." },
    });

    const parsed = result.data || {};
    res.json({
      success: true,
      data: {
        summary: parsed.summary || result.text,
        keyPoints: includeKeyPoints ? (parsed.keyPoints || []) : [],
        actionItems: includeActionItems ? (parsed.actionItems || []) : [],
        importantDates: includeImportantDates ? (parsed.importantDates || []) : [],
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 3. Extract Data Tool: Structured Table Extraction
 * POST /api/ai/extract
 */
router.post("/extract", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { documentType = "Auto Detect", fields = [], provider, model } = req.body;

    const text = await resolveContent(req);
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Please upload a document/PDF or enter text content." });
    }

    const prompt = `Extract all structured fields from this ${documentType} into key-value pairs with confidence scores.
${fields.length > 0 ? `Target fields to prioritize: ${JSON.stringify(fields)}` : "Extract standard entity attributes like Employee Name, ID, Designation, Department, Salary, Contract Number, Effective Date, Expiry Date, Total Amount, Tax/GSTIN, Parties."}

Return a JSON object:
{
  "documentType": "${documentType}",
  "fields": [
    { "field": "Employee / Party Name", "value": "...", "confidence": 0.99 },
    { "field": "Designation / Role", "value": "...", "confidence": 0.95 },
    { "field": "Total Compensation / Value", "value": "...", "confidence": 0.97 },
    { "field": "Effective Date", "value": "...", "confidence": 0.98 }
  ]
}

DOCUMENT TEXT:
${text.slice(0, 25000)}`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateStructuredOutput",
      feature: "data_extraction",
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt: "You are an automated document data extraction engine. Output JSON only." },
    });

    const parsed = result.data || {};
    res.json({
      success: true,
      data: {
        documentType: parsed.documentType || documentType,
        fields: parsed.fields || [],
        rawJson: parsed,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 4. Ask Document Tool: Grounded Q&A (Strictly on Document)
 * POST /api/ai/ask
 */
router.post("/ask", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { question, documentName = "Document", provider, model } = req.body;

    const text = await resolveContent(req);
    if (!question) {
      return res.status(400).json({ success: false, message: "A question is required." });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Please upload a document/PDF or provide document text to query." });
    }

    const prompt = `You are an intelligent enterprise document assistant.
CRITICAL ANTI-HALLUCINATION RULE: Answer questions strictly based on the provided document content.
If the information is not present or cannot be determined from the document, explicitly output: "The document does not contain this information." Do NOT make up or hallucinate details.

DOCUMENT TITLE: ${documentName}
DOCUMENT CONTENT:
${text.slice(0, 25000)}

USER QUESTION:
${question}

Return a JSON object:
{
  "answer": "...",
  "citation": "Section X.X or Paragraph / Page reference where found",
  "sourceSnippet": "Exact sentence or snippet from the document supporting this answer",
  "confidenceScore": 0.98,
  "isContained": true
} `;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateStructuredOutput",
      feature: "ask_document",
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt: "You are an enterprise document Q&A engine. Output JSON only." },
    });

    const parsed = result.data || {};
    res.json({
      success: true,
      data: {
        answer: parsed.answer || result.text,
        citation: parsed.citation || "Document Body",
        sourceSnippet: parsed.sourceSnippet || "",
        confidenceScore: parsed.confidenceScore || 0.95,
        isContained: parsed.isContained !== false,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 5. Rewrite Tool: Improve, Professional, Formal, Simple, Concise, Detailed, Friendly, Improve Clarity, Custom
 * POST /api/ai/rewrite
 */
router.post("/rewrite", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { option = "Professional", customInstruction = "", tone = "Professional", language = "English", provider, model } = req.body;

    const text = await resolveContent(req);
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Please upload a document/PDF or enter text to rewrite." });
    }

    const prompt = `Rewrite and transform the following text according to the requested style: "${option}".
${customInstruction ? `Additional Custom Instruction: ${customInstruction}` : ""}
Options guide:
- Professional: Adopt an enterprise standard business tone with corporate phraseology.
- Formal: Enhance legal/statutory precision and binding covenants.
- Simple: Simplify complex jargon for general audience readability.
- Concise: Make concise without losing core meaning or obligations.
- Detailed: Elaborate with clear operational detail and sub-points.
- Friendly: Warm, engaging, and collaborative tone.
- Improve Clarity: Enhance vocabulary, flow, readability, and sentence structure.

Return a JSON object:
{
  "original": "...",
  "suggested": "...",
  "changesSummary": "Brief explanation of improvements made"
}

ORIGINAL TEXT:
${text.slice(0, 15000)}`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateStructuredOutput",
      feature: "rewrite",
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt: "You are an expert editor and document stylist. Output JSON only." },
    });

    const parsed = result.data || {};
    res.json({
      success: true,
      data: {
        original: text,
        suggested: parsed.suggested || result.text,
        changesSummary: parsed.changesSummary || `Applied "${option}" transformation.`,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 6. Translate Tool: Preserve Structure into Target Language
 * POST /api/ai/translate
 */
router.post("/translate", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { targetLanguage = "Hindi", preserveFormatting = true, provider, model } = req.body;

    const text = await resolveContent(req);
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Please upload a document/PDF or enter text to translate." });
    }

    const prompt = `Translate the following document text accurately into ${targetLanguage}.
${preserveFormatting ? "Preserve all markdown structure, headings, bullet points, tables, and formal clause hierarchy." : ""}

Return a JSON object:
{
  "targetLanguage": "${targetLanguage}",
  "translatedText": "...",
  "detectedSourceLanguage": "English"
}

DOCUMENT TEXT:
${text.slice(0, 25000)}`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateStructuredOutput",
      feature: "translate",
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt: "You are a professional legal and document translator. Output JSON only." },
    });

    const parsed = result.data || {};
    res.json({
      success: true,
      data: {
        originalText: text,
        targetLanguage,
        translatedText: parsed.translatedText || result.text,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 7. Grammar Checker Tool: Grammar, Spelling, Punctuation, Clarity, Professional Wording
 * POST /api/ai/grammar
 */
router.post("/grammar", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { provider, model } = req.body;

    const text = await resolveContent(req);
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Please upload a document/PDF or enter text to check grammar." });
    }

    const prompt = `Inspect the following document text for grammar, spelling, punctuation, sentence clarity, and professional wording errors.
Return a JSON object:
{
  "correctedFullText": "...",
  "errorCount": 2,
  "suggestions": [
    {
      "id": 1,
      "original": "exact error phrase from original text",
      "suggestion": "corrected replacement phrase",
      "reason": "Clear explanation of grammar, spelling, punctuation, or clarity fix",
      "type": "grammar"
    }
  ]
}

DOCUMENT TEXT:
${text.slice(0, 20000)}`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateStructuredOutput",
      feature: "grammar",
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt: "You are an enterprise grammar and document proofreader. Output JSON only." },
    });

    const parsed = result.data || {};
    res.json({
      success: true,
      data: {
        originalText: text,
        correctedFullText: parsed.correctedFullText || text,
        suggestions: parsed.suggestions || [],
        errorCount: parsed.suggestions?.length || 0,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 8. Compare Documents Tool: Compare Doc A vs Doc B
 * POST /api/ai/compare
 */
router.post("/compare", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { docA, docB, docAName = "Document A", docBName = "Document B", provider, model } = req.body;

    if (!docA || !docB) {
      return res.status(400).json({ success: false, message: "Both Document A and Document B are required for comparison." });
    }

    const prompt = `Compare these two document versions and identify exact differences without modifying either document.

Return a JSON object:
{
  "summary": "High-level summary of revisions between ${docAName} and ${docBName}",
  "added": ["List of new clauses/paragraphs in Document B"],
  "removed": ["List of clauses present in Document A but deleted in Document B"],
  "modified": [
    { "section": "...", "original": "...", "revised": "...", "impact": "High / Medium / Low" }
  ],
  "unchanged": ["List of unchanged key sections"],
  "importantChanges": ["Key legal, financial, or operational shifts"]
}

DOCUMENT A (${docAName}):
${docA.slice(0, 15000)}

DOCUMENT B (${docBName}):
${docB.slice(0, 15000)}`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateStructuredOutput",
      feature: "compare",
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt: "You are a legal and contract redlining analyst. Output JSON only." },
    });

    const parsed = result.data || {};
    res.json({
      success: true,
      data: {
        docAName,
        docBName,
        summary: parsed.summary || "Comparison completed.",
        added: parsed.added || [],
        removed: parsed.removed || [],
        modified: parsed.modified || [],
        unchanged: parsed.unchanged || [],
        importantChanges: parsed.importantChanges || [],
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 9. Classify Document Tool: Identify Document Type & Security
 * POST /api/ai/classify
 */
router.post("/classify", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const {
      categories = [
        "Invoice",
        "Contract",
        "NDA",
        "Offer Letter",
        "Employment Agreement",
        "Leave Application",
        "Policy",
        "Purchase Order",
        "Receipt",
        "Certificate",
        "Report",
        "Resume",
        "Other",
      ],
      provider,
      model,
    } = req.body;

    const text = await resolveContent(req);
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Please upload a document/PDF or enter text to classify." });
    }

    const prompt = `Classify this document into one of the following categories: ${JSON.stringify(categories)}.
Return a JSON object:
{
  "documentType": "...",
  "category": "...",
  "subcategory": "...",
  "confidence": 0.98,
  "summary": "1-sentence description of the document",
  "suggestedWorkflow": "..."
}

DOCUMENT TEXT:
${text.slice(0, 15000)}`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateStructuredOutput",
      feature: "classification",
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt: "You are a document categorization engine. Output JSON only." },
    });

    const parsed = result.data || {};
    res.json({
      success: true,
      data: {
        documentType: parsed.documentType || "General Document",
        category: parsed.category || "Other",
        subcategory: parsed.subcategory || "",
        confidence: parsed.confidence || 0.95,
        summary: parsed.summary || "",
        suggestedWorkflow: parsed.suggestedWorkflow || "Standard Review",
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * 10. Extract Key Information Tool: People, Companies, Dates, Amounts, Deadlines, Clauses, Actions
 * POST /api/ai/key-info
 */
router.post("/key-info", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { provider, model } = req.body;

    const text = await resolveContent(req);
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Please upload a document/PDF or enter text to extract key information." });
    }

    const prompt = `Extract all critical key information categories from this document.
Return a structured JSON object with rows matching schema:
{
  "entities": [
    { "category": "People", "information": "Full Name / Signatory", "value": "..." },
    { "category": "Companies / Parties", "information": "Entity Name", "value": "..." },
    { "category": "Dates", "information": "Effective / Execution Date", "value": "..." },
    { "category": "Deadlines", "information": "Completion / Notice Period", "value": "..." },
    { "category": "Amounts", "information": "Financial Value / Salary", "value": "..." },
    { "category": "Locations", "information": "Registered Address / Jurisdiction", "value": "..." },
    { "category": "Contract Terms", "information": "Term / Duration", "value": "..." },
    { "category": "Important Clauses", "information": "Key Obligation / Covenant", "value": "..." },
    { "category": "Action Items", "information": "Next Step / Required Deliverable", "value": "..." },
    { "category": "Contact Information", "information": "Email / Phone / Address", "value": "..." }
  ]
}

DOCUMENT TEXT:
${text.slice(0, 25000)}`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateStructuredOutput",
      feature: "key_info",
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt: "You are an enterprise document entity parser. Output JSON only." },
    });

    const parsed = result.data || {};
    res.json({
      success: true,
      data: {
        entities: parsed.entities || [],
        rawJson: parsed,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Single AI Section Generator for Templates (e.g. {{AI_JOB_RESPONSIBILITIES}})
 * POST /api/ai/template-section
 */
router.post("/template-section", async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { sectionName, contextData = {}, provider, model } = req.body;

    const prompt = `Generate content ONLY for the specific template section: "${sectionName || "Job Responsibilities"}".
Context provided: ${JSON.stringify(contextData)}
Do NOT generate the entire document. Output ONLY the concise, bulleted section content.`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateText",
      feature: "template_section",
      module: "templates",
      provider,
      model,
      params: { prompt, systemPrompt: "You are an enterprise document section synthesizer. Output section content only.", temperature: 0.2 },
    });

    res.json({
      success: true,
      data: {
        sectionName,
        content: result.text,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

const verifyToken = require("../middleware/authMiddleware");

/**
 * 11. Document Q&A Tool: Answer questions over specific documents with strict tenant isolation
 * POST /api/ai/qa
 */
router.post("/qa", verifyToken, async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { documentId, text, question, provider, model } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: "Question is required." });
    }

    let documentContext = text || "";
    if (documentId) {
      const doc = await prisma.document.findFirst({
        where: { id: Number(documentId), organisation_id: organisationId },
      });
      if (!doc) {
        return res.status(404).json({ success: false, message: "Document not found or unauthorized." });
      }
      documentContext = documentContext || `Document: ${doc.name} (Type: ${doc.type})`;
    }

    if (!documentContext) {
      return res.status(400).json({ success: false, message: "Document text or valid documentId is required." });
    }

    const prompt = `DOCUMENT CONTEXT:
${documentContext.slice(0, 20000)}

USER QUESTION:
${question}

Provide an accurate, grounded answer based strictly on the document context above. If the document does not contain the answer, state that clearly.`;

    const result = await AIGateway.execute({
      organisationId,
      userId,
      operation: "generateText",
      feature: "document_qa",
      module: "ai_tools",
      provider,
      model,
      params: { prompt, systemPrompt: "You are an enterprise document intelligence assistant. Answer questions grounded strictly in the provided document.", temperature: 0.1 },
    });

    res.json({
      success: true,
      data: {
        question,
        answer: result.text,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

