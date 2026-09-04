const express = require("express");
const router = express.Router();
const {
  getTickets,
  createTicket,
  updateTicket,
  replyToTicket,
} = require("../controllers/superAdminSupportController");

/**
 * @swagger
 * /super-admin/support/tickets:
 *   get:
 *     summary: List Support Tickets
 *     description: Retrieve all support tickets submitted by customer organisations.
 *     tags:
 *       - Super Admin - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Support tickets returned.
 *   post:
 *     summary: Create Support Ticket
 *     description: Submit an internal or customer support inquiry.
 *     tags:
 *       - Super Admin - Support
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
 *         description: Ticket created.
 */
router.get("/", getTickets);
router.get("/tickets", getTickets);
router.post("/tickets", createTicket);

/**
 * @swagger
 * /super-admin/support/tickets/{id}:
 *   put:
 *     summary: Update Support Ticket Status
 *     description: Update ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED) or assign support agent.
 *     tags:
 *       - Super Admin - Support
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
 *     responses:
 *       200:
 *         description: Ticket updated.
 */
router.put("/tickets/:id", updateTicket);

/**
 * @swagger
 * /super-admin/support/tickets/{id}/reply:
 *   post:
 *     summary: Reply to Support Ticket
 *     description: Post a message reply to the ticket thread.
 *     tags:
 *       - Super Admin - Support
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
router.post("/tickets/:id/reply", replyToTicket);

module.exports = router;
