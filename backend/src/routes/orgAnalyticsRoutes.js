const express = require("express");
const router = express.Router();
const {
  getAnalyticsOverview,
  getDocumentAnalytics,
  getAiAnalytics,
  getUserTeamAnalytics,
  getStorageAnalytics,
} = require("../controllers/orgAnalyticsController");

/**
 * @swagger
 * /org-admin/analytics/overview:
 *   get:
 *     summary: Organisation Analytics Overview
 *     description: High-level KPI metrics on total documents, automation rates, turnaround times, and team throughput.
 *     tags:
 *       - Org Admin - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview analytics data.
 */
router.get("/", getAnalyticsOverview);
router.get("/overview", getAnalyticsOverview);
router.get("/data", getAnalyticsOverview);

/**
 * @swagger
 * /org-admin/analytics/documents:
 *   get:
 *     summary: Document Volume Analytics
 *     description: Time-series document volume by category, department, and processing status.
 *     tags:
 *       - Org Admin - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document analytics data.
 */
router.get("/documents", getDocumentAnalytics);

/**
 * @swagger
 * /org-admin/analytics/ai:
 *   get:
 *     summary: AI Processing & Latency Analytics
 *     description: OCR success ratios, average LLM latency, and field extraction accuracy metrics.
 *     tags:
 *       - Org Admin - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI analytics data.
 */
router.get("/ai", getAiAnalytics);

/**
 * @swagger
 * /org-admin/analytics/team:
 *   get:
 *     summary: Team Productivity & Performance
 *     description: Document completion rates, approval bottlenecks, and turnaround time per team.
 *     tags:
 *       - Org Admin - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Team performance analytics.
 */
router.get("/team", getUserTeamAnalytics);

/**
 * @swagger
 * /org-admin/analytics/storage:
 *   get:
 *     summary: Storage Consumption Analytics
 *     description: Document storage breakdown by file type and department allocation.
 *     tags:
 *       - Org Admin - Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Storage analytics data.
 */
router.get("/storage", getStorageAnalytics);

module.exports = router;
