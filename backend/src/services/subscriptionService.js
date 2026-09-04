const prisma = require("../config/prismaClient");

/**
 * Enterprise Production Subscription Plans
 */
const DEFAULT_PLANS = [
  {
    planName: "Starter",
    planCode: "starter",
    description: "Perfect for small businesses, startups, and small teams getting real DocuCore AI automation.",
    monthlyPrice: 4999.00,
    yearlyPrice: 49990.00,
    currency: "INR",
    billingCycle: "MONTHLY",
    userLimit: 10,
    storageLimitGB: 50,
    aiCredits: 2000,
    ocrLimit: 1000,
    apiRateLimit: 100,
    supportLevel: "STANDARD",
    badge: "Startups & Teams",
    isMostPopular: false,
    isCustomPlan: false,
    displayOrder: 1,
    isActive: true,
    features: {
      "users.max": 10,
      "storage.gb": 50,
      "storage.file_size_mb": 50,
      "ai.processing": true,
      "ai.requests_per_month": 2000,
      "ocr.processing": true,
      "ocr.pages_per_month": 1000,
      "ai.classification": true,
      "ai.extraction": true,
      "ai.summarization": true,
      "ai.chat": true,
      "documents.upload": true,
      "documents.download": true,
      "documents.delete": true,
      "documents.bulk_upload": false,
      "documents.basic_automation": true,
      "workflows.enabled": true,
      "workflows.active_limit": 5,
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
      "departments.max": 2,
      "teams.max": 3,
    },
  },
  {
    planName: "Business",
    planCode: "business",
    description: "Our flagship growth plan for scaling companies and departments with multi-step workflows, full integrations, and high throughput.",
    monthlyPrice: 14999.00,
    yearlyPrice: 149990.00,
    currency: "INR",
    billingCycle: "MONTHLY",
    userLimit: 50,
    storageLimitGB: 250,
    aiCredits: 10000,
    ocrLimit: 5000,
    apiRateLimit: 500,
    supportLevel: "PRIORITY",
    badge: "Most Popular",
    isMostPopular: true,
    isCustomPlan: false,
    displayOrder: 2,
    isActive: true,
    features: {
      "users.max": 50,
      "storage.gb": 250,
      "storage.file_size_mb": 200,
      "ai.processing": true,
      "ai.requests_per_month": 10000,
      "ocr.processing": true,
      "ocr.batch_processing": true,
      "ocr.handwriting": true,
      "ocr.pages_per_month": 5000,
      "ai.classification": true,
      "ai.extraction": true,
      "ai.advanced_extraction": true,
      "ai.summarization": true,
      "ai.chat": true,
      "ai.custom_prompts": true,
      "documents.upload": true,
      "documents.download": true,
      "documents.delete": true,
      "documents.bulk_upload": true,
      "documents.comparison": true,
      "workflows.enabled": true,
      "workflows.multi_step": true,
      "workflows.conditional": true,
      "workflows.scheduled": true,
      "workflows.active_limit": 50,
      "templates.max": 50,
      "integrations.google": true,
      "integrations.microsoft": true,
      "integrations.aws_s3": true,
      "integrations.slack": true,
      "integrations.teams": true,
      "integrations.smtp": true,
      "integrations.whatsapp": false,
      "api.access": true,
      "webhooks.enabled": true,
      "security.rbac": true,
      "security.mfa": true,
      "security.advanced_rbac": true,
      "security.department_access": true,
      "security.team_access": true,
      "security.audit_retention_days": 365,
      "analytics.basic": true,
      "analytics.advanced": true,
      "analytics.cost_monitoring": true,
      "support.level": "PRIORITY",
      "departments.max": 10,
      "teams.max": 25,
    },
  },
  {
    planName: "Enterprise",
    planCode: "enterprise",
    description: "Complete enterprise intelligence suite with custom AI routing, SSO, 7-year audit retention, unlimited workflows, and 99.9% custom SLA.",
    monthlyPrice: 39999.00,
    yearlyPrice: 399990.00,
    currency: "INR",
    billingCycle: "MONTHLY",
    userLimit: 500,
    storageLimitGB: 1000,
    aiCredits: 50000,
    ocrLimit: 25000,
    apiRateLimit: 2000,
    supportLevel: "DEDICATED",
    badge: "Enterprise",
    isMostPopular: false,
    isCustomPlan: false,
    displayOrder: 3,
    isActive: true,
    features: {
      "users.max": 500,
      "storage.gb": 1000,
      "storage.file_size_mb": 500,
      "ai.processing": true,
      "ai.requests_per_month": 50000,
      "ocr.processing": true,
      "ocr.batch_processing": true,
      "ocr.handwriting": true,
      "ocr.pages_per_month": 25000,
      "ai.classification": true,
      "ai.extraction": true,
      "ai.advanced_extraction": true,
      "ai.summarization": true,
      "ai.chat": true,
      "ai.custom_models": true,
      "ai.custom_providers": true,
      "ai.routing": true,
      "ai.cost_controls": true,
      "ai.custom_schemas": true,
      "documents.upload": true,
      "documents.download": true,
      "documents.delete": true,
      "documents.bulk_upload": true,
      "documents.comparison": true,
      "workflows.enabled": true,
      "workflows.unlimited": true,
      "workflows.multi_level": true,
      "workflows.conditional_branching": true,
      "workflows.scheduled": true,
      "workflows.cross_department": true,
      "workflows.custom_rules": true,
      "workflows.active_limit": 999,
      "templates.max": 999,
      "integrations.google": true,
      "integrations.microsoft": true,
      "integrations.aws_s3": true,
      "integrations.slack": true,
      "integrations.teams": true,
      "integrations.smtp": true,
      "integrations.whatsapp": true,
      "integrations.custom": true,
      "api.access": true,
      "webhooks.enabled": true,
      "security.rbac": true,
      "security.mfa": true,
      "security.mfa_enforced": true,
      "security.sso": true,
      "security.ip_whitelisting": true,
      "security.advanced_sessions": true,
      "security.password_policies": true,
      "security.retention_policies": true,
      "security.audit_retention_days": 2555,
      "analytics.basic": true,
      "analytics.advanced": true,
      "analytics.cost_monitoring": true,
      "support.level": "DEDICATED",
      "support.sla": "99.9%",
      "departments.max": 100,
      "teams.max": 200,
    },
  },
];

class SubscriptionService {
  /**
   * Seed / Update default plans in the database
   */
  static async ensurePlansSeeded() {
    try {
      for (const plan of DEFAULT_PLANS) {
        const existing = await prisma.subscriptionPlan.findFirst({
          where: {
            OR: [
              { planCode: plan.planCode },
              { planName: plan.planName },
            ],
          },
        });

        if (!existing) {
          await prisma.subscriptionPlan.create({
            data: plan,
          });
        } else {
          // Keep plan metadata, quotas and pricing up-to-date with current specifications
          await prisma.subscriptionPlan.update({
            where: { id: existing.id },
            data: {
              planName: plan.planName,
              description: plan.description,
              monthlyPrice: plan.monthlyPrice,
              yearlyPrice: plan.yearlyPrice,
              userLimit: plan.userLimit,
              storageLimitGB: plan.storageLimitGB,
              aiCredits: plan.aiCredits,
              ocrLimit: plan.ocrLimit,
              apiRateLimit: plan.apiRateLimit,
              supportLevel: plan.supportLevel,
              badge: plan.badge,
              isMostPopular: plan.isMostPopular,
              displayOrder: plan.displayOrder,
              isActive: true,
              features: plan.features,
            },
          });
        }
      }
    } catch (err) {
      console.warn("ensurePlansSeeded error:", err.message);
    }
  }

  /**
   * Get all plans (Super Admin view)
   */
  static async getAllPlans() {
    await this.ensurePlansSeeded();
    return await prisma.subscriptionPlan.findMany({
      orderBy: { displayOrder: "asc" },
    });
  }

  /**
   * Get public active plans (for public pricing page & signup)
   */
  static async getPublicPlans() {
    await this.ensurePlansSeeded();
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    return plans.map((p) => ({
      id: p.id,
      name: p.planName,
      code: p.planCode,
      description: p.description,
      monthlyPrice: Number(p.monthlyPrice),
      yearlyPrice: Number(p.yearlyPrice || Number(p.monthlyPrice) * 10),
      currency: p.currency,
      userLimit: p.userLimit,
      storageLimitGB: p.storageLimitGB,
      aiCredits: p.aiCredits,
      ocrLimit: p.ocrLimit,
      supportLevel: p.supportLevel,
      badge: p.badge,
      isMostPopular: p.isMostPopular,
      features: p.features || {},
    }));
  }

  /**
   * Get single plan by ID
   */
  static async getPlanById(id) {
    return await prisma.subscriptionPlan.findUnique({
      where: { id: String(id) },
    });
  }

  /**
   * Create custom subscription plan (Super Admin)
   */
  static async createPlan(data) {
    const code = (data.planCode || data.planName || "custom")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    return await prisma.subscriptionPlan.create({
      data: {
        planName: data.planName,
        planCode: `${code}-${Date.now()}`,
        description: data.description,
        monthlyPrice: Number(data.monthlyPrice) || 0,
        yearlyPrice: Number(data.yearlyPrice) || Number(data.monthlyPrice) * 10,
        currency: data.currency || "INR",
        userLimit: Number(data.userLimit) || 10,
        storageLimitGB: Number(data.storageLimitGB) || 50,
        aiCredits: Number(data.aiCredits) || 2000,
        ocrLimit: Number(data.ocrLimit) || 1000,
        apiRateLimit: Number(data.apiRateLimit) || 100,
        supportLevel: data.supportLevel || "STANDARD",
        badge: data.badge || null,
        isMostPopular: Boolean(data.isMostPopular),
        isCustomPlan: true,
        displayOrder: 99,
        isActive: true,
        features: data.features || {},
      },
    });
  }

  /**
   * Update plan (Super Admin)
   */
  static async updatePlan(id, data) {
    return await prisma.subscriptionPlan.update({
      where: { id: String(id) },
      data: {
        ...data,
        monthlyPrice: data.monthlyPrice !== undefined ? Number(data.monthlyPrice) : undefined,
        yearlyPrice: data.yearlyPrice !== undefined ? Number(data.yearlyPrice) : undefined,
        userLimit: data.userLimit !== undefined ? Number(data.userLimit) : undefined,
        storageLimitGB: data.storageLimitGB !== undefined ? Number(data.storageLimitGB) : undefined,
        aiCredits: data.aiCredits !== undefined ? Number(data.aiCredits) : undefined,
        ocrLimit: data.ocrLimit !== undefined ? Number(data.ocrLimit) : undefined,
      },
    });
  }

  /**
   * Delete custom plan (Super Admin)
   */
  static async deletePlan(id) {
    const activeSubs = await prisma.organisationSubscription.count({
      where: { planId: String(id), status: "ACTIVE" },
    });

    if (activeSubs > 0) {
      throw new Error(`Cannot delete plan: ${activeSubs} active organization subscription(s) are assigned to it. Please reassign them first.`);
    }

    return await prisma.subscriptionPlan.delete({
      where: { id: String(id) },
    });
  }

  /**
   * Get active subscription for an organisation
   */
  static async getOrganisationSubscription(organisationId) {
    const orgId = String(organisationId);
    let sub = await prisma.organisationSubscription.findFirst({
      where: {
        organisationId: orgId,
        status: "ACTIVE",
      },
      include: {
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fallback: If no subscription row exists, create a default Starter subscription
    if (!sub) {
      await this.ensurePlansSeeded();
      const starterPlan = await prisma.subscriptionPlan.findFirst({
        where: { planCode: "starter" },
      });

      if (starterPlan) {
        sub = await prisma.organisationSubscription.create({
          data: {
            organisationId: orgId,
            planId: starterPlan.id,
            status: "ACTIVE",
            billingCycle: "MONTHLY",
            startDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            autoRenew: true,
          },
          include: { plan: true },
        });
      }
    }

    return sub;
  }

  /**
   * Assign or upgrade subscription for an organisation
   */
  static async assignSubscriptionToOrganisation({
    organisationId,
    planId,
    billingCycle = "MONTHLY",
    customStorageLimitGB = null,
    customUserLimit = null,
    customAICredits = null,
  }) {
    const plan = await this.getPlanById(planId);
    if (!plan) throw new Error("Subscription plan not found.");

    const days = billingCycle === "ANNUAL" ? 365 : 30;
    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Deactivate previous active subscriptions
    await prisma.organisationSubscription.updateMany({
      where: { organisationId: String(organisationId), status: "ACTIVE" },
      data: { status: "UPGRADED" },
    });

    // Create new active subscription
    const newSub = await prisma.organisationSubscription.create({
      data: {
        organisationId: String(organisationId),
        planId: plan.id,
        billingCycle,
        status: "ACTIVE",
        startDate: new Date(),
        expiryDate,
        autoRenew: true,
        customStorageLimitGB: customStorageLimitGB ? Number(customStorageLimitGB) : null,
        customUserLimit: customUserLimit ? Number(customUserLimit) : null,
        customAICredits: customAICredits ? Number(customAICredits) : null,
      },
      include: { plan: true },
    });

    // Also update organisation.plan string field for quick reference
    await prisma.organisation.update({
      where: { id: Number(organisationId) },
      data: { plan: plan.planName },
    }).catch(() => null);

    return newSub;
  }

  /**
   * Controller alias for assigning subscription
   */
  static async assignSubscription(organisationId, { planId, billingCycle = "MONTHLY", customLimits = {} } = {}) {
    return await this.assignSubscriptionToOrganisation({
      organisationId,
      planId,
      billingCycle,
      customStorageLimitGB: customLimits?.storageLimitGB,
      customUserLimit: customLimits?.userLimit,
      customAICredits: customLimits?.aiCredits,
    });
  }

  /**
   * Get all organization subscriptions (Super Admin view)
   */
  static async getAllOrganisationSubscriptions() {
    const orgs = await prisma.organisation.findMany({
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { users: true, documents: true },
        },
      },
    });

    return orgs.map((org) => {
      const activeSub = org.subscriptions?.[0];
      const plan = activeSub?.plan;
      return {
        id: activeSub?.id || `sub-${org.id}`,
        organisationId: org.id,
        organisation: {
          id: org.id,
          name: org.name,
          plan: org.plan || plan?.planName || "Starter",
          userCount: org._count.users,
          documentCount: org._count.documents,
        },
        plan: plan
          ? {
              id: plan.id,
              planName: plan.planName,
              monthlyPrice: plan.monthlyPrice,
              storageLimitGB: plan.storageLimitGB,
              userLimit: plan.userLimit,
            }
          : {
              planName: org.plan || "Starter",
              monthlyPrice: 4999,
              storageLimitGB: 50,
              userLimit: 10,
            },
        status: activeSub?.status || "ACTIVE",
        billingCycle: activeSub?.billingCycle || "MONTHLY",
        startDate: activeSub?.startDate || org.created_at,
        expiryDate: activeSub?.expiryDate || null,
        autoRenew: activeSub?.autoRenew ?? true,
      };
    });
  }
}

module.exports = SubscriptionService;
