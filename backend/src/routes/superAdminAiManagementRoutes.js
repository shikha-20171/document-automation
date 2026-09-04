const express = require("express");
const router = express.Router();
const {
  getAiJobQueue,
  getAiLogs,
  getAiCostUsages,
  getAiServiceHealth,
  getOcrEngines,
  getOcrRequests,
} = require("../controllers/superAdminAiManagementController");

/**
 * @swagger
 * /super-admin/ai-management/queue:
 *   get:
 *     summary: AI Job Queue Telemetry
 *     description: Retrieve status of BullMQ async queues for OCR, classification, and embeddings.
 *     tags:
 *       - Super Admin - AI Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job queue metrics returned.
 */
router.get("/queue", getAiJobQueue);

/**
 * @swagger
 * /super-admin/ai-management/logs:
 *   get:
 *     summary: AI Execution Logs
 *     description: Retrieve recent inference execution logs, latency timings, and token metrics.
 *     tags:
 *       - Super Admin - AI Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI logs returned.
 */
router.get("/logs", getAiLogs);

/**
 * @swagger
 * /super-admin/ai-management/costs:
 *   get:
 *     summary: AI Cost & Token Usage
 *     description: Retrieve token consumption and API cost estimations grouped by provider and organisation.
 *     tags:
 *       - Super Admin - AI Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cost analytics returned.
 */
router.get("/costs", getAiCostUsages);

/**
 * @swagger
 * /super-admin/ai-management/health:
 *   get:
 *     summary: AI Service Health
 *     description: Check latency, error rate, and availability across connected LLM and OCR APIs.
 *     tags:
 *       - Super Admin - AI Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service health returned.
 */
router.get("/health", getAiServiceHealth);

/**
 * @swagger
 * /super-admin/ai-management/ocr-engines:
 *   get:
 *     summary: List Configured OCR Engines
 *     description: List local OCR (Tesseract.js) and cloud OCR engines with throughput ratings.
 *     tags:
 *       - Super Admin - AI Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OCR engines list returned.
 */
router.get("/ocr-engines", getOcrEngines);

/**
 * @swagger
 * /super-admin/ai-management/ocr-requests:
 *   get:
 *     summary: Recent OCR Processing Requests
 *     description: Retrieve real-time log of scanned document pages and extraction confidence scores.
 *     tags:
 *       - Super Admin - AI Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OCR requests returned.
 */
router.get("/ocr-requests", getOcrRequests);

// Subrouter aliases for providers, models, capabilities, jobs
const superAdminAiRoutes = require("./superAdminAiRoutes");
router.use("/", superAdminAiRoutes);

module.exports = router;
