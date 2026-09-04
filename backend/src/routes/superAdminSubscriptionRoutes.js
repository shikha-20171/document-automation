const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { isSuperAdmin } = require("../middleware/roleMiddleware");
const {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getOrgSubscriptions,
  assignOrgSubscription,
  updateOrgSubscription,
  getSubscriptionRequests,
  handleSubscriptionRequest,
} = require("../controllers/superAdminSubscriptionController");

// Require Super Admin authentication for all routes
router.use(verifyToken);
router.use(isSuperAdmin);

router.post("/assign", assignOrgSubscription);
router.post("/org-subscriptions/assign", assignOrgSubscription);

/**
 * @swagger
 * /super-admin/subscriptions/plans:
 *   get:
 *     summary: List All Subscription Plans
 *     description: Retrieve all pricing tiers (Free Trial, Starter, Business, Enterprise).
 *     tags:
 *       - Super Admin - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plan tiers returned.
 *   post:
 *     summary: Create Subscription Plan
 *     description: Add a new subscription tier with quotas, limits, and pricing.
 *     tags:
 *       - Super Admin - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               billing_period:
 *                 type: string
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Plan created.
 */
router.get("/", getPlans);
router.get("/plans", getPlans);
router.post("/plans", createPlan);

/**
 * @swagger
 * /super-admin/subscriptions/plans/{id}:
 *   put:
 *     summary: Update Subscription Plan
 *     description: Update features, pricing, or storage limits for a plan tier.
 *     tags:
 *       - Super Admin - Subscriptions
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
 *         description: Plan updated.
 *   delete:
 *     summary: Delete Subscription Plan
 *     description: Delete a plan tier.
 *     tags:
 *       - Super Admin - Subscriptions
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
 *         description: Plan deleted.
 */
router.put("/plans/:id", updatePlan);
router.delete("/plans/:id", deletePlan);

/**
 * @swagger
 * /super-admin/subscriptions/org-subscriptions:
 *   get:
 *     summary: List Organisation Subscriptions
 *     description: Retrieve all active and pending customer subscriptions.
 *     tags:
 *       - Super Admin - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions returned.
 */
router.get("/org-subscriptions", getOrgSubscriptions);

/**
 * @swagger
 * /super-admin/subscriptions/org-subscriptions/{id}:
 *   put:
 *     summary: Update Organisation Subscription
 *     description: Upgrade, downgrade, or extend validity for a customer subscription.
 *     tags:
 *       - Super Admin - Subscriptions
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
 *         description: Subscription updated.
 */
router.put("/org-subscriptions/:id", updateOrgSubscription);

/**
 * @swagger
 * /super-admin/subscriptions/requests:
 *   get:
 *     summary: List Plan Upgrade Requests
 *     description: Retrieve pending subscription upgrade or custom quota requests.
 *     tags:
 *       - Super Admin - Subscriptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upgrade requests returned.
 */
router.get("/requests", getSubscriptionRequests);

/**
 * @swagger
 * /super-admin/subscriptions/requests/{id}:
 *   put:
 *     summary: Handle Upgrade Request
 *     description: Approve or reject an organisation upgrade request.
 *     tags:
 *       - Super Admin - Subscriptions
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *     responses:
 *       200:
 *         description: Request handled.
 */
router.put("/requests/:id", handleSubscriptionRequest);

module.exports = router;
