const EntitlementService = require("../services/entitlementService");
const QuotaService = require("../services/quotaService");

/**
 * Feature Guard Middleware
 * Protects backend routes against unauthorized tenant feature access based on assigned subscription plan.
 */
const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      // Super Admin bypasses tenant subscription checks
      if (req.user?.role === "SUPER_ADMIN") {
        return next();
      }

      const orgId = req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || req.headers["x-organisation-id"];
      if (!orgId) {
        return res.status(403).json({
          success: false,
          code: "ORGANISATION_REQUIRED",
          message: "Organisation context is required to verify subscription entitlements.",
        });
      }

      const hasAccess = await EntitlementService.hasFeature(orgId, featureKey);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          code: "FEATURE_NOT_IN_PLAN",
          feature: featureKey,
          message: `The feature '${featureKey}' is not included in your organization's subscription plan. Please upgrade to unlock this feature.`,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Quota Guard Middleware
 * Protects backend routes against exceeded numerical quota usage.
 */
const requireQuota = (quotaKey, amount = 1) => {
  return async (req, res, next) => {
    try {
      // Super Admin bypasses tenant subscription checks
      if (req.user?.role === "SUPER_ADMIN") {
        return next();
      }

      const orgId = req.user?.organisation_id || req.user?.organization_id || req.user?.organisationId || req.headers["x-organisation-id"];
      if (!orgId) {
        return res.status(403).json({
          success: false,
          code: "ORGANISATION_REQUIRED",
          message: "Organisation context is required to verify quota limits.",
        });
      }

      const requested = typeof amount === "function" ? amount(req) : amount;
      const { allowed, limit, current } = await QuotaService.checkQuota(orgId, quotaKey, requested);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          code: "QUOTA_EXCEEDED",
          quotaKey,
          current,
          limit,
          message: `Your organization has reached the maximum allowed limit for '${quotaKey}' (${current}/${limit}). Please upgrade your subscription plan.`,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  requireFeature,
  requireQuota,
};
