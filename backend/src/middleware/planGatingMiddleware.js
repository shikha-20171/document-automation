const EntitlementService = require("../services/entitlementService");

/**
 * Plan Feature Gating Middleware
 * Checks if the organisation's active subscription plan permits access to the requested feature.
 */
const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      // Super Admin bypasses feature gating
      if (req.user?.role === "SUPER_ADMIN") {
        return next();
      }

      const orgId = req.user?.organisation_id || req.user?.organisationId || req.user?.organization_id;
      if (!orgId) {
        return next();
      }

      const hasAccess = await EntitlementService.checkFeatureAccess(orgId, featureKey);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          code: "PLAN_FEATURE_RESTRICTED",
          message: `This feature (${featureKey}) is not included in your current subscription plan. Please upgrade your plan to access this functionality.`,
          feature: featureKey,
        });
      }

      next();
    } catch (err) {
      console.error("[PlanGatingMiddleware] Error checking feature access:", err.message);
      next();
    }
  };
};

/**
 * Plan Quota Limit Gating Middleware
 */
const requireLimitNotExceeded = (limitKey, getCurrentCountFn) => {
  return async (req, res, next) => {
    try {
      if (req.user?.role === "SUPER_ADMIN") {
        return next();
      }

      const orgId = req.user?.organisation_id || req.user?.organisationId || req.user?.organization_id;
      if (!orgId) {
        return next();
      }

      const currentCount = typeof getCurrentCountFn === "function" ? await getCurrentCountFn(req) : 0;
      const limitCheck = await EntitlementService.checkLimit(orgId, limitKey, currentCount);

      if (!limitCheck.allowed) {
        return res.status(403).json({
          success: false,
          code: "PLAN_LIMIT_EXCEEDED",
          message: `Your organisation has reached the maximum limit (${limitCheck.limit}) for ${limitKey} allowed by your current plan. Please upgrade your subscription.`,
          limit: limitCheck.limit,
          current: limitCheck.current,
        });
      }

      next();
    } catch (err) {
      console.error("[PlanGatingMiddleware] Error checking limit:", err.message);
      next();
    }
  };
};

module.exports = {
  requireFeature,
  requireLimitNotExceeded,
};
