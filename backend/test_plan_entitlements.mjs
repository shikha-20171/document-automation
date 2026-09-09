import prisma from "./src/config/prismaClient.js";
import OrganisationIntegrationService from "./src/services/organisationIntegrationService.js";
import IntegrationOAuthService from "./src/services/integrationOAuthService.js";
import EntitlementService from "./src/services/entitlementService.js";

async function testEntitlements() {
  console.log("==================================================================");
  console.log("  TESTING SUBSCRIPTION-BASED FEATURE & INTEGRATION GATING         ");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Fetch available plans
    const starterPlan = await prisma.subscriptionPlan.findFirst({ where: { planCode: "starter" } });
    const businessPlan = await prisma.subscriptionPlan.findFirst({ where: { planCode: "business" } });
    const enterprisePlan = await prisma.subscriptionPlan.findFirst({ where: { planCode: "enterprise" } });

    assert(Boolean(starterPlan && businessPlan && enterprisePlan), "All 3 standard subscription plans exist in DB");

    // 2. Assign Organisation 1 to STARTER plan
    await prisma.organisationSubscription.upsert({
      where: { id: "sub_1" },
      update: { planId: starterPlan.id, status: "ACTIVE" },
      create: {
        id: "sub_1",
        organisationId: "1",
        planId: starterPlan.id,
        status: "ACTIVE",
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const starterCatalog = await OrganisationIntegrationService.listIntegrations(1);
    const starterKeys = starterCatalog.map((p) => p.providerKey);
    console.log("  Starter Plan Allowed Integrations:", starterKeys);
    assert(starterKeys.includes("google_workspace"), "Starter includes Google Workspace");
    assert(starterKeys.includes("brevo"), "Starter includes Brevo");
    assert(!starterKeys.includes("slack"), "Starter EXCLUDES Slack");
    assert(!starterKeys.includes("microsoft_365"), "Starter EXCLUDES Microsoft 365");
    assert(!starterKeys.includes("whatsapp_business"), "Starter EXCLUDES WhatsApp Business");

    // Test that initiating connection for a restricted provider is blocked
    let blockedError = false;
    try {
      await IntegrationOAuthService.initiateOAuth({
        organisationId: 1,
        providerKeyOrId: "slack",
      });
    } catch (err) {
      blockedError = true;
      assert(err.message.includes("not included in your organisation's current subscription plan"), "Blocked connection returns subscription upgrade requirement message");
    }
    assert(blockedError, "Starter plan blocked from initiating Slack OAuth connection");

    // 3. Upgrade Organisation 1 to BUSINESS plan
    await prisma.organisationSubscription.update({
      where: { id: "sub_1" },
      data: { planId: businessPlan.id },
    });

    const businessCatalog = await OrganisationIntegrationService.listIntegrations(1);
    const businessKeys = businessCatalog.map((p) => p.providerKey);
    console.log("  Business Plan Allowed Integrations:", businessKeys);
    assert(businessKeys.includes("google_workspace"), "Business includes Google Workspace");
    assert(businessKeys.includes("slack"), "Business UNLOCKS Slack");
    assert(businessKeys.includes("microsoft_365"), "Business UNLOCKS Microsoft 365");
    assert(!businessKeys.includes("whatsapp_business"), "Business still EXCLUDES WhatsApp Business");

    // 4. Upgrade Organisation 1 to ENTERPRISE plan
    await prisma.organisationSubscription.update({
      where: { id: "sub_1" },
      data: { planId: enterprisePlan.id },
    });

    const enterpriseCatalog = await OrganisationIntegrationService.listIntegrations(1);
    const enterpriseKeys = enterpriseCatalog.map((p) => p.providerKey);
    console.log("  Enterprise Plan Allowed Integrations:", enterpriseKeys);
    assert(enterpriseKeys.includes("google_workspace"), "Enterprise includes Google Workspace");
    assert(enterpriseKeys.includes("slack"), "Enterprise includes Slack");
    assert(enterpriseKeys.includes("microsoft_365"), "Enterprise includes Microsoft 365");
    assert(enterpriseKeys.includes("whatsapp_business"), "Enterprise UNLOCKS WhatsApp Business");

    // 5. Test Entitlement Flags for Navigation (Sidebar Gating)
    const starterEntitlements = await EntitlementService.getOrganisationEntitlements(1);
    console.log("  Enterprise Plan Features:", {
      aiProcessing: starterEntitlements.features["ai.processing"],
      workflows: starterEntitlements.features["workflows.enabled"],
      crm: starterEntitlements.features["crm.enabled"],
      analytics: starterEntitlements.features["analytics.advanced"],
      slack: starterEntitlements.features["integrations.slack"],
      whatsapp: starterEntitlements.features["integrations.whatsapp"],
    });

    assert(starterEntitlements.features["crm.enabled"] === true, "Enterprise has CRM enabled");
    assert(starterEntitlements.features["workflows.enabled"] === true, "Enterprise has Workflows enabled");
    assert(starterEntitlements.features["integrations.whatsapp"] === true, "Enterprise has WhatsApp enabled");

    console.log("\n==================================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================================");

    if (failed > 0) process.exit(1);
  } catch (e) {
    console.error("Test failed:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testEntitlements();
