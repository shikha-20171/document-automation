const SubscriptionService = require("./subscriptionService");

/**
 * Central Entitlement Service
 * Resolves active feature flags and numerical limits for any organisation dynamically.
 */
class EntitlementService {
  /**
   * Get all active entitlements (features, limits, plan metadata) for an organisation
   */
  static async getOrganisationEntitlements(organisationId) {
    const sub = await SubscriptionService.getOrganisationSubscription(organisationId);
    if (!sub || !sub.plan) {
      return {
        plan: {
          id: "starter",
          name: "Starter",
          code: "starter",
          status: "ACTIVE",
          monthlyPrice: 4999,
        },
        features: {
          "documents.upload": true,
          "documents.download": true,
          "documents.delete": true,
          "documents.bulk_upload": false,
          "ocr.processing": true,
          "ocr.batch_processing": false,
          "ocr.handwriting": false,
          "ai.processing": true,
          "ai.summarization": true,
          "ai.extraction": true,
          "ai.classification": true,
          "ai.chat": true,
          "workflows.enabled": true,
          "templates.max": 10,
          "integrations.google": true,
          "integrations.smtp": true,
          "integrations.slack": false,
          "integrations.microsoft": false,
          "integrations.whatsapp": false,
          "security.rbac": true,
          "security.mfa": true,
          "security.basic_audit": true,
          "analytics.basic": true,
          "analytics.advanced": false,
          "api.access": false,
        },
        limits: {
          "storage.gb": 50,
          "ai.requests_per_month": 2000,
          "ocr.pages_per_month": 1000,
          "users.max": 10,
          "workflows.active_limit": 5,
          "templates.max": 10,
        },
      };
    }

    const plan = sub.plan;
    const planFeatures = plan.features || {};

    // Compute active limits (custom subscription overrides take precedence over plan defaults)
    const storageGB = sub.customStorageLimitGB || plan.storageLimitGB || 50;
    const aiRequests = sub.customAICredits || plan.aiCredits || 2000;
    const ocrPages = sub.customOCRLimit || plan.ocrLimit || 1000;
    const userLimit = sub.customUserLimit || plan.userLimit || 10;
    const workflowLimit = planFeatures["workflows.active_limit"] || (plan.planCode === "enterprise" ? 999 : plan.planCode === "business" ? 50 : 5);
    const templatesLimit = planFeatures["templates.max"] || (plan.planCode === "enterprise" ? 999 : plan.planCode === "business" ? 50 : 10);

    const limits = {
      "storage.gb": Number(storageGB),
      "ai.requests_per_month": Number(aiRequests),
      "ai.tokens_per_month": Number(aiRequests) * 250,
      "ocr.pages_per_month": Number(ocrPages),
      "users.max": Number(userLimit),
      "workflows.active_limit": Number(workflowLimit),
      "templates.max": Number(templatesLimit),
      "api.rate_limit": Number(plan.apiRateLimit || 100),
    };

    // Features boolean map
    const features = {
      // Document capabilities
      "documents.upload": planFeatures["documents.upload"] ?? true,
      "documents.download": planFeatures["documents.download"] ?? true,
      "documents.delete": planFeatures["documents.delete"] ?? true,
      "documents.bulk_upload": Boolean(planFeatures["documents.bulk_upload"]),
      "documents.comparison": Boolean(planFeatures["documents.comparison"]),

      // OCR capabilities
      "ocr.processing": planFeatures["ocr.processing"] ?? true,
      "ocr.batch_processing": Boolean(planFeatures["ocr.batch_processing"]),
      "ocr.handwriting": Boolean(planFeatures["ocr.handwriting"]),

      // AI capabilities
      "ai.processing": planFeatures["ai.processing"] ?? true,
      "ai.summarization": planFeatures["ai.summarization"] ?? true,
      "ai.extraction": planFeatures["ai.extraction"] ?? true,
      "ai.advanced_extraction": Boolean(planFeatures["ai.advanced_extraction"]),
      "ai.classification": planFeatures["ai.classification"] ?? true,
      "ai.chat": planFeatures["ai.chat"] ?? true,
      "ai.custom_prompts": Boolean(planFeatures["ai.custom_prompts"]),
      "ai.custom_models": Boolean(planFeatures["ai.custom_models"]),
      "ai.custom_providers": Boolean(planFeatures["ai.custom_providers"]),
      "ai.routing": Boolean(planFeatures["ai.routing"]),
      "ai.cost_controls": Boolean(planFeatures["ai.cost_controls"]),

      // Workflows
      "workflows.enabled": planFeatures["workflows.enabled"] ?? true,
      "workflows.multi_step": Boolean(planFeatures["workflows.multi_step"]),
      "workflows.conditional": Boolean(planFeatures["workflows.conditional"]),
      "workflows.scheduled": Boolean(planFeatures["workflows.scheduled"]),
      "workflows.unlimited": Boolean(planFeatures["workflows.unlimited"]),

      // Integrations
      "integrations.google": planFeatures["integrations.google"] ?? true,
      "integrations.smtp": planFeatures["integrations.smtp"] ?? true,
      "integrations.slack": Boolean(planFeatures["integrations.slack"]),
      "integrations.microsoft": Boolean(planFeatures["integrations.microsoft"]),
      "integrations.aws_s3": Boolean(planFeatures["integrations.aws_s3"]),
      "integrations.whatsapp": Boolean(planFeatures["integrations.whatsapp"]),
      "integrations.custom": Boolean(planFeatures["integrations.custom"]),

      // APIs & Webhooks
      "api.access": Boolean(planFeatures["api.access"]),
      "webhooks.enabled": Boolean(planFeatures["webhooks.enabled"]),

      // Security & Governance
      "security.rbac": planFeatures["security.rbac"] ?? true,
      "security.mfa": planFeatures["security.mfa"] ?? true,
      "security.mfa_enforced": Boolean(planFeatures["security.mfa_enforced"]),
      "security.sso": Boolean(planFeatures["security.sso"]),
      "security.ip_whitelisting": Boolean(planFeatures["security.ip_whitelisting"]),
      "security.advanced_rbac": Boolean(planFeatures["security.advanced_rbac"]),
      "security.retention_policies": Boolean(planFeatures["security.retention_policies"]),
      "security.audit_retention_days": planFeatures["security.audit_retention_days"] || (plan.planCode === "enterprise" ? 2555 : plan.planCode === "business" ? 365 : 30),

      // Analytics
      "analytics.basic": planFeatures["analytics.basic"] ?? true,
      "analytics.advanced": Boolean(planFeatures["analytics.advanced"]),
      "analytics.cost_monitoring": Boolean(planFeatures["analytics.cost_monitoring"]),

      // Support
      "support.level": plan.supportLevel || "STANDARD",
      ...planFeatures,
    };

    return {
      plan: {
        id: plan.id,
        name: plan.planName,
        code: plan.planCode,
        monthlyPrice: Number(plan.monthlyPrice),
        yearlyPrice: Number(plan.yearlyPrice || Number(plan.monthlyPrice) * 10),
        status: sub.status,
        billingCycle: sub.billingCycle,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        autoRenew: sub.autoRenew,
      },
      features,
      limits,
    };
  }

  /**
   * Check if an organisation has access to a specific feature flag
   */
  static async checkFeatureAccess(organisationId, featureKey) {
    const entitlements = await this.getOrganisationEntitlements(organisationId);
    return Boolean(entitlements.features[featureKey]);
  }

  static async hasFeature(organisationId, featureKey) {
    return this.checkFeatureAccess(organisationId, featureKey);
  }

  static async getLimit(organisationId, limitKey) {
    const entitlements = await this.getOrganisationEntitlements(organisationId);
    return entitlements.limits?.[limitKey] !== undefined ? entitlements.limits[limitKey] : null;
  }

  /**
   * Check if an organisation limit has been exceeded
   */
  static async checkLimit(organisationId, limitKey, currentCount = 0) {
    const entitlements = await this.getOrganisationEntitlements(organisationId);
    const maxLimit = entitlements.limits[limitKey];
    if (maxLimit === undefined) return { allowed: true, limit: null, current: currentCount };

    return {
      allowed: currentCount < maxLimit,
      limit: maxLimit,
      current: currentCount,
      remaining: Math.max(0, maxLimit - currentCount),
    };
  }
}

module.exports = EntitlementService;
