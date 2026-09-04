const express = require("express");
const router = express.Router();
const {
  getBillingOverview,
  getInvoices,
  createInvoice,
  getTransactions,
  getRefunds,
  updateRefund,
  getGateways,
  updateGateway,
  getBillingSettings,
  updateBillingSettings,
} = require("../controllers/superAdminBillingController");
const isSuperAdmin = require("../middleware/isSuperAdmin");

router.use(isSuperAdmin);

/**
 * @swagger
 * /super-admin/billing/overview:
 *   get:
 *     summary: Super Admin Billing KPI Dashboard
 *     description: Retrieve total revenue, MRR, overdue balances, and payout statistics.
 *     tags:
 *       - Super Admin - Billing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing overview metrics returned.
 */
router.get("/", getBillingOverview);
router.get("/overview", getBillingOverview);

/**
 * @swagger
 * /super-admin/billing/invoices:
 *   get:
 *     summary: List All Customer Invoices
 *     description: Retrieve customer invoices with status (PAID, PENDING, OVERDUE).
 *     tags:
 *       - Super Admin - Billing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer invoices returned.
 */
router.get("/invoices", getInvoices);

/**
 * @swagger
 * /super-admin/billing/invoices:
 *   post:
 *     summary: Create New Customer Invoice
 *     description: Generate and issue a new invoice to an organization.
 *     tags:
 *       - Super Admin - Billing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organisationId
 *               - amount
 *             properties:
 *               organisationId:
 *                 type: string
 *               amount:
 *                 type: number
 *               items:
 *                 type: array
 *     responses:
 *       201:
 *         description: Invoice created successfully.
 */
router.post("/invoices", createInvoice);

/**
 * @swagger
 * /super-admin/billing/transactions:
 *   get:
 *     summary: Audit Payment Transactions
 *     description: Retrieve gateway transactions across Stripe, Razorpay, and PayPal.
 *     tags:
 *       - Super Admin - Billing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transaction logs returned.
 */
router.get("/transactions", getTransactions);

/**
 * @swagger
 * /super-admin/billing/refunds:
 *   get:
 *     summary: List Refund Requests
 *     description: Retrieve customer refund dispute queue.
 *     tags:
 *       - Super Admin - Billing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Refund requests list.
 */
router.get("/refunds", getRefunds);

/**
 * @swagger
 * /super-admin/billing/refunds/{id}:
 *   put:
 *     summary: Approve or Reject Refund Request
 *     description: Update refund request state.
 *     tags:
 *       - Super Admin - Billing
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED, PROCESSED]
 *     responses:
 *       200:
 *         description: Refund request updated.
 */
router.put("/refunds/:id", updateRefund);

/**
 * @swagger
 * /super-admin/billing/gateways:
 *   get:
 *     summary: List Configured Payment Gateways
 *     description: Retrieve gateway status for Stripe, Razorpay, PayPal, Bank Transfer.
 *     tags:
 *       - Super Admin - Billing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment gateways returned.
 */
router.get("/gateways", getGateways);

/**
 * @swagger
 * /super-admin/billing/gateways/{id}:
 *   put:
 *     summary: Update Gateway Settings
 *     description: Modify gateway credentials and toggle live/sandbox status.
 *     tags:
 *       - Super Admin - Billing
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
 *             properties:
 *               isEnabled:
 *                 type: boolean
 *               mode:
 *                 type: string
 *                 enum: [LIVE, SANDBOX]
 *     responses:
 *       200:
 *         description: Gateway updated successfully.
 */
router.put("/gateways/:id", updateGateway);

/**
 * @swagger
 * /super-admin/billing/settings:
 *   get:
 *     summary: Get Global Platform Billing Settings
 *     description: Retrieve platform currency, tax rates, and invoicing grace period.
 *     tags:
 *       - Super Admin - Billing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing settings returned.
 */
router.get("/settings", getBillingSettings);

/**
 * @swagger
 * /super-admin/billing/settings:
 *   put:
 *     summary: Update Global Platform Billing Settings
 *     description: Save default currency and tax configurations.
 *     tags:
 *       - Super Admin - Billing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *               taxRatePct:
 *                 type: number
 *               invoiceGraceDays:
 *                 type: number
 *     responses:
 *       200:
 *         description: Billing settings saved.
 */
router.put("/settings", updateBillingSettings);

module.exports = router;
