const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  getRuns,
  createTemplate,
  listTemplates,
  listDepartmentDocuments,
  generateDocument,
  summarizeDocument,
  extractData,
  saveExtractedData,
  classifyDocument,
  runOcr,
  saveGeneratedDocument,
  askAssistant,
  compareDocuments,
  rewriteDocument,
  translateDocument,
  fillTemplate,
  grammarCheck,
  generateContract,
  analyzeCompliance,
} = require("../controllers/departmentManagerAiToolsController");

/**
 * @swagger
 * /department-manager/ai-tools/runs:
 *   get:
 *     summary: List AI Tool Execution History
 *     description: Retrieve all previous OCR, classification, and summarization tool runs with input/output payloads.
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI tool execution history returned.
 */
router.get("/runs", getRuns);

/**
 * @swagger
 * /department-manager/ai-tools/templates:
 *   get:
 *     summary: List Department AI Generation Templates
 *     description: Retrieve templates available for automated document generation.
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Templates returned.
 *   post:
 *     summary: Create Generation Template
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Template created.
 */
router.get("/templates", listTemplates);
router.post("/templates", createTemplate);

/**
 * @swagger
 * /department-manager/ai-tools/documents:
 *   get:
 *     summary: List Documents for AI Tool Input
 *     description: Retrieve available department documents ready for AI analysis or OCR.
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document list returned.
 */
router.get("/documents", listDepartmentDocuments);

/**
 * @swagger
 * /department-manager/ai-tools/generate:
 *   post:
 *     summary: AI Document Generator
 *     description: Generate complete business documents, contracts, or letters using AI prompts or uploaded reference files.
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *               prompt:
 *                 type: string
 *               tone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated document content.
 */
router.post("/generate", upload.single("file"), generateDocument);
router.post("/document-generator", upload.single("file"), generateDocument);

/**
 * @swagger
 * /department-manager/ai-tools/summarize:
 *   post:
 *     summary: AI Document Summarizer
 *     description: Extract key findings, summaries, and action items from document text or uploaded PDF/Image files.
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               text:
 *                 type: string
 *               summaryType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document summary generated.
 */
router.post("/summarize", upload.single("file"), summarizeDocument);

/**
 * @swagger
 * /department-manager/ai-tools/extract:
 *   post:
 *     summary: AI Data & Field Extraction
 *     description: Extract structured key-value entities from invoices, purchase orders, and forms via local OCR or text layer.
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Structured extracted JSON returned.
 */
router.post("/extract", upload.single("file"), extractData);

/**
 * @swagger
 * /department-manager/ai-tools/extract/save:
 *   post:
 *     summary: Save Extracted Data to Record
 *     description: Save verified extracted fields into the document database record.
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Extracted data saved.
 */
router.post("/extract/save", saveExtractedData);

/**
 * @swagger
 * /department-manager/ai-tools/classify:
 *   post:
 *     summary: AI Document Classification
 *     description: Classify uploaded files into category types (Invoice, Contract, Memo, SLA, Legal) with confidence score.
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Classification result and confidence score.
 */
router.post("/classify", upload.single("file"), classifyDocument);

/**
 * @swagger
 * /department-manager/ai-tools/ocr:
 *   post:
 *     summary: Local Optical Character Recognition (OCR)
 *     description: Extract visual real text from uploaded image (PNG, JPG, WEBP) or scanned PDF using local Tesseract.js / pdf-parse engine.
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: OCR extracted text and confidence metrics returned.
 */
router.post("/ocr", upload.single("file"), runOcr);

/**
 * @swagger
 * /department-manager/ai-tools/save-document:
 *   post:
 *     summary: Save Generated Document to Repository
 *     description: Save an AI generated draft as an official department document and optionally submit for approval.
 *     tags:
 *       - Department Manager - AI Tools & OCR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Document saved and submitted.
 */
router.post("/save-document", saveGeneratedDocument);

// Legacy & utility routes for backwards compatibility
router.post("/assistant", askAssistant);
router.post("/compare", compareDocuments);
router.post("/rewrite", rewriteDocument);
router.post("/translate", translateDocument);
router.post("/template-fill", fillTemplate);
router.post("/grammar", grammarCheck);
router.post("/grammar-check", grammarCheck);
router.post("/generate-contract", generateContract);
router.post("/analyze-compliance", analyzeCompliance);

module.exports = router;
