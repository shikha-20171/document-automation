const express = require("express");
const router = express.Router();
const {
  getSupportDashboardMetrics,
  getTickets,
  createTicket,
  getTicketDetails,
  addTicketReply,
  getHelpCenterGuides,
} = require("../controllers/orgSupportController");

/**
 * @swagger
 * /org-admin/support/dashboard:
 *   get:
 *     summary: Organisation Support KPI Metrics
 *     description: Retrieve open ticket counts, average response time, and SLA resolution stats.
 *     tags:
 *       - Org Admin - Support
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support KPI metrics returned.
 */
router.get("/", getSupportDashboardMetrics);
router.get("/dashboard", getSupportDashboardMetrics);

/**
 * @swagger
 * /org-admin/support/tickets:
 *   get:
 *     summary: List Organisation Support Tickets
 *     description: Retrieve all support requests submitted by organisation users.
 *     tags:
 *       - Org Admin - Support
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tickets list returned.
 *   post:
 *     summary: Submit Support Ticket
 *     description: Create a new support inquiry or report an issue.
 *     tags:
 *       - Org Admin - Support
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket submitted.
 */
router.get("/tickets", getTickets);
router.post("/tickets", createTicket);

/**
 * @swagger
 * /org-admin/support/tickets/{id}:
 *   get:
 *     summary: Get Support Ticket Details
 *     description: Retrieve ticket message conversation history and attachment files.
 *     tags:
 *       - Org Admin - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket conversation returned.
 */
router.get("/tickets/:id", getTicketDetails);

/**
 * @swagger
 * /org-admin/support/tickets/{id}/replies:
 *   post:
 *     summary: Post Reply to Ticket
 *     description: Send a follow-up reply message on a ticket.
 *     tags:
 *       - Org Admin - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Reply sent.
 */
router.post("/tickets/:id/replies", addTicketReply);

/**
 * @swagger
 * /org-admin/support/help-center:
 *   get:
 *     summary: Help Center Knowledge Base
 *     description: Retrieve documentation guides, FAQs, and integration manuals.
 *     tags:
 *       - Org Admin - Support
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Guides list returned.
 */
router.get("/help-center", getHelpCenterGuides);

module.exports = router;
