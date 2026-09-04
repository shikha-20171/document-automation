const express = require("express");
const router = express.Router();

const {
  getBillingOverview,
  getOcrProcessingData,
  retryOcrJob,
  getPlatformDocuments,
  getWorkflowsAndTemplates,
  getUsersAndAccess,
  getNotificationsData,
  broadcastNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  getSystemMonitoring,
  getSecurityOverview,
  getReportsOverview,
} = require("../controllers/superAdminModulesController");

/**
 * @swagger
 * /super-admin/modules/billing:
 *   get:
 *     summary: Super Admin Billing Overview Module
 *     description: Retrieve platform-wide billing summary and invoices.
 *     tags:
 *       - Super Admin - Modules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing overview data returned.
 */
router.get("/billing", getBillingOverview);

/**
 * @swagger
 * /super-admin/modules/ocr-processing:
 *   get:
 *     summary: OCR Processing Module Telemetry
 *     description: Retrieve real-time OCR engine queues, success ratios, and failure states.
 *     tags:
 *       - Super Admin - Modules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OCR processing metrics returned.
 */
router.get("/ocr-processing", getOcrProcessingData);

/**
 * @swagger
 * /super-admin/modules/ocr-processing/retry:
 *   post:
 *     summary: Retry Failed OCR Job
 *     description: Re-queue a failed OCR document task for processing.
 *     tags:
 *       - Super Admin - Modules
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *             properties:
 *               jobId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Job re-queued.
 */
router.post("/ocr-processing/retry", retryOcrJob);

/**
 * @swagger
 * /super-admin/modules/documents:
 *   get:
 *     summary: Platform Documents Module
 *     description: List documents stored across all organisations with filter by size and type.
 *     tags:
 *       - Super Admin - Modules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents returned.
 */
router.get("/documents", getPlatformDocuments);

/**
 * @swagger
 * /super-admin/modules/workflows:
 *   get:
 *     summary: Workflows & Templates Module
 *     description: List standard document automation workflows and department templates.
 *     tags:
 *       - Super Admin - Modules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workflows returned.
 */
router.get("/workflows", getWorkflowsAndTemplates);

/**
 * @swagger
 * /super-admin/modules/users-access:
 *   get:
 *     summary: Platform Users & RBAC Matrix
 *     description: Retrieve all active platform users and role-based permissions.
 *     tags:
 *       - Super Admin - Modules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users and access list returned.
 */
router.get("/users-access", getUsersAndAccess);

/**
 * @swagger
 * /super-admin/modules/notifications:
 *   get:
 *     summary: Super Admin Notifications Feed
 *     description: Retrieve platform alert notifications and system warnings.
 *     tags:
 *       - Super Admin - Modules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications feed returned.
 */
router.get("/notifications", getNotificationsData);
router.post("/notifications/broadcast", broadcastNotification);
router.patch("/notifications/read-all", markAllNotificationsRead);
router.post("/notifications/read-all", markAllNotificationsRead);
router.patch("/notifications/:id/read", markNotificationRead);
router.post("/notifications/:id/read", markNotificationRead);
router.delete("/notifications/:id", deleteNotification);
router.get("/notifications/settings", getNotificationSettings);
router.put("/notifications/settings", updateNotificationSettings);
router.post("/notifications/settings", updateNotificationSettings);

/**
 * @swagger
 * /super-admin/modules/system-monitoring:
 *   get:
 *     summary: Server & Microservices Monitoring
 *     description: Retrieve CPU, Memory, Redis connection, and Database pool health metrics.
 *     tags:
 *       - Super Admin - Modules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System metrics returned.
 */
router.get("/system-monitoring", getSystemMonitoring);

/**
 * @swagger
 * /super-admin/modules/security:
 *   get:
 *     summary: Security & Threat Prevention Telemetry
 *     description: Retrieve rate-limiting triggers, failed login attempts, and blocked IP records.
 *     tags:
 *       - Super Admin - Modules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security summary returned.
 */
router.get("/security", getSecurityOverview);

/**
 * @swagger
 * /super-admin/modules/reports:
 *   get:
 *     summary: Platform Reports & Telemetry Summary
 *     description: Aggregate summary reports on platform adoption and document throughput.
 *     tags:
 *       - Super Admin - Modules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports returned.
 */
router.get("/reports", getReportsOverview);

module.exports = router;
