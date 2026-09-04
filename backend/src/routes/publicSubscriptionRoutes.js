const express = require("express");
const router = express.Router();
const SubscriptionService = require("../services/subscriptionService");

/**
 * @swagger
 * /public/subscription-plans:
 *   get:
 *     summary: Public Subscription Plans Catalog
 *     description: Retrieve all active public plans with dynamic pricing, features, and limits for the pricing page.
 *     tags:
 *       - Public
 *     responses:
 *       200:
 *         description: Active subscription plans returned.
 */
router.get("/subscription-plans", async (req, res, next) => {
  try {
    const plans = await SubscriptionService.getPublicPlans();
    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
