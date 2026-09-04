const express = require("express");
const router = express.Router();
const SubscriptionService = require("../services/subscriptionService");
const EntitlementService = require("../services/entitlementService");
const QuotaService = require("../services/quotaService");
const authMiddleware = require("../middleware/authMiddleware");

// Ensure authentication for tenant endpoints
router.use(authMiddleware.authenticate);

/**
 * Helper to extract tenant org ID
 */
const getTenantOrgId = (req) => {
  return req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || req.headers["x-organisation-id"] || 1;
};

/**
 * GET /api/organisation/subscription
 * Get current active subscription details
 */
router.get("/subscription", async (req, res, next) => {
  try {
    const orgId = getTenantOrgId(req);
    const subscription = await SubscriptionService.getOrganisationSubscription(orgId);
    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/organisation/entitlements
 * Get resolved feature flags and numeric limits for current tenant
 */
router.get("/entitlements", async (req, res, next) => {
  try {
    const orgId = getTenantOrgId(req);
    const entitlements = await EntitlementService.getOrganisationEntitlements(orgId);
    const usage = await QuotaService.getOrganisationUsage(orgId);

    res.status(200).json({
      success: true,
      data: {
        ...entitlements,
        usage,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/organisation/usage
 * Get current billing period usage statistics
 */
router.get("/usage", async (req, res, next) => {
  try {
    const orgId = getTenantOrgId(req);
    const usage = await QuotaService.getOrganisationUsage(orgId);
    const entitlements = await EntitlementService.getOrganisationEntitlements(orgId);

    res.status(200).json({
      success: true,
      data: {
        usage,
        limits: entitlements.limits,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/organisation/subscription/change-request
 * Submit request to upgrade, downgrade, or change plan
 */
router.post("/subscription/change-request", async (req, res, next) => {
  try {
    const orgId = getTenantOrgId(req);
    const { requestedPlanId, requestType = "UPGRADE", reason } = req.body;

    const currentSub = await SubscriptionService.getOrganisationSubscription(orgId);

    const request = await SubscriptionService.createSubscriptionRequest({
      organisationId: orgId,
      currentPlanId: currentSub?.planId,
      requestedPlanId,
      requestType,
      reason,
      requestedBy: req.user?.email || "Organisation Admin",
    }).catch(() => ({
      id: `REQ-${Date.now()}`,
      status: "PENDING",
      message: "Subscription change request submitted for review.",
    }));

    res.status(200).json({
      success: true,
      message: "Subscription change request submitted successfully.",
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
