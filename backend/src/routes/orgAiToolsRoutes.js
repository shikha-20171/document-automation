const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  handleAiChat,
  handleDocumentQA,
  handleSummarize,
  handleExtractFields,
  handleClassify,
  handleTranslate,
  handleRewrite,
  handleGenerateDraft,
  handleDataAnalysis,
  getPromptTemplates,
  getAiUsageStats,
  handleOCR,
  handleGrammarCheck,
  handleDocumentComparison,
  handleKeyInformation,
} = require("../controllers/orgAiToolsController");

// Dedicated Specific AI Tools Routes
router.post("/ocr", upload.single("file"), handleOCR);
router.post("/grammar", handleGrammarCheck);
router.post("/compare", handleDocumentComparison);
router.post("/key-info", handleKeyInformation);

/**
 * @swagger
 * /org-admin/ai-tools/chat:
 *   post:
 *     summary: AI Assistant Chat
 *     description: Conversational AI document assistant for summarization and Q&A.
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               documentContext:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat response returned.
 */
router.post("/chat", handleAiChat);

/**
 * @swagger
 * /org-admin/ai-tools/doc-qa:
 *   post:
 *     summary: Document Question & Answering (RAG)
 *     description: Query a document text layer using semantic retrieval and LLM synthesis.
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - documentText
 *             properties:
 *               question:
 *                 type: string
 *               documentText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer returned.
 */
router.post("/doc-qa", handleDocumentQA);

/**
 * @swagger
 * /org-admin/ai-tools/summarize:
 *   post:
 *     summary: AI Document Summarizer
 *     description: Generate concise executive summaries, bullet points, and key takeaways.
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [executive, bullets, detailed]
 *     responses:
 *       200:
 *         description: Summary generated.
 */
router.post("/summarize", handleSummarize);

/**
 * @swagger
 * /org-admin/ai-tools/extract:
 *   post:
 *     summary: AI Structured Field Extraction
 *     description: Extract key-value pairs (amounts, dates, invoice numbers, parties) into JSON format.
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               fields:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Extracted fields returned.
 */
router.post("/extract", handleExtractFields);

/**
 * @swagger
 * /org-admin/ai-tools/classify:
 *   post:
 *     summary: AI Document Classification
 *     description: Categorize document into predefined types (Invoice, Contract, NDA, SLA, HR Form).
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Classification result returned.
 */
router.post("/classify", handleClassify);

/**
 * @swagger
 * /org-admin/ai-tools/translate:
 *   post:
 *     summary: AI Document Translation
 *     description: Translate legal, financial, or operational document content into target language.
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - targetLanguage
 *             properties:
 *               text:
 *                 type: string
 *               targetLanguage:
 *                 type: string
 *                 example: Hindi
 *     responses:
 *       200:
 *         description: Translated text returned.
 */
router.post("/translate", handleTranslate);

/**
 * @swagger
 * /org-admin/ai-tools/rewrite:
 *   post:
 *     summary: AI Clause & Content Rewriter
 *     description: Rephrase clauses for professional tone, compliance, or conciseness.
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               tone:
 *                 type: string
 *                 enum: [formal, simplified, legal, professional]
 *     responses:
 *       200:
 *         description: Rewritten text returned.
 */
router.post("/rewrite", handleRewrite);

/**
 * @swagger
 * /org-admin/ai-tools/draft:
 *   post:
 *     summary: AI Document Generator Draft
 *     description: Generate custom legal contract or agreement draft from structured parameters.
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentType
 *             properties:
 *               documentType:
 *                 type: string
 *               parameters:
 *                 type: object
 *     responses:
 *       200:
 *         description: Generated draft document returned.
 */
router.post("/draft", handleGenerateDraft);
router.post("/generate", handleGenerateDraft);

/**
 * @swagger
 * /org-admin/ai-tools/analysis:
 *   post:
 *     summary: AI Data & Risk Analysis
 *     description: Perform anomaly detection, risk factor analysis, and compliance checks on document text.
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Analysis report returned.
 */
router.post("/analysis", handleDataAnalysis);

/**
 * @swagger
 * /org-admin/ai-tools/prompts:
 *   get:
 *     summary: List Custom Prompt Templates
 *     description: Retrieve organization-level saved prompt templates.
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prompts returned.
 */
router.get("/prompts", getPromptTemplates);

/**
 * @swagger
 * /org-admin/ai-tools/usage:
 *   get:
 *     summary: AI Usage & Quota Stats
 *     description: Retrieve current billing cycle token consumption and quota percentages.
 *     tags:
 *       - Org Admin - AI Tools
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage metrics returned.
 */
router.get("/usage", getAiUsageStats);

module.exports = router;
