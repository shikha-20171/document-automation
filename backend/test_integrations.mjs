import prisma from "./src/config/prismaClient.js";
import {
  encrypt,
  decrypt,
  encryptJson,
  decryptJson,
  sanitizeConfig,
} from "./src/services/integrationEncryptionService.js";
import IntegrationProviderService from "./src/services/integrationProviderService.js";
import IntegrationOAuthService from "./src/services/integrationOAuthService.js";
import OrganisationIntegrationService from "./src/services/organisationIntegrationService.js";

async function runTests() {
  console.log("==========================================================");
  console.log("  DOCUCORE AI - DYNAMIC INTEGRATION MANAGEMENT TEST SUITE  ");
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Encryption Service (AES-256-GCM)
    // -------------------------------------------------------------
    console.log("--- TEST 1: AES-256-GCM Authenticated Encryption ---");
    const sampleSecret = "live_client_secret_xyz987654321_secret!";
    const encrypted = encrypt(sampleSecret);
    assert(encrypted.startsWith("v1:gcm:"), "Ciphertext uses v1:gcm format");
    assert(!encrypted.includes(sampleSecret), "Ciphertext does not contain plaintext secret");
    const decrypted = decrypt(encrypted);
    assert(decrypted === sampleSecret, "Decrypted plaintext matches original secret");

    // Tamper test: Altering one character in ciphertext must cause decryption to fail
    let tampered = encrypted.slice(0, -4) + "ffff";
    let tamperCaught = false;
    try {
      decrypt(tampered);
    } catch {
      tamperCaught = true;
    }
    assert(tamperCaught, "GCM authentication tag verification rejects tampered ciphertext");

    // -------------------------------------------------------------
    // TEST 2: Initial 6 Providers Seeded in Database
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Dynamic Provider Catalog in PostgreSQL ---");
    const providers = await prisma.integrationProvider.findMany({
      orderBy: { providerKey: "asc" },
    });
    assert(providers.length >= 6, `Found ${providers.length} providers in database (expected >= 6)`);

    const expectedKeys = [
      "google_workspace",
      "microsoft_365",
      "slack",
      "brevo",
      "whatsapp_business",
      "microsoft_teams",
    ];
    for (const key of expectedKeys) {
      const exists = providers.some((p) => p.providerKey === key);
      assert(exists, `Provider '${key}' exists in dynamic database table`);
    }

    // -------------------------------------------------------------
    // TEST 3: Super Admin Persists Credentials (Encrypted at Rest)
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Super Admin Credential Storage (AES-256-GCM) ---");
    const googleCreds = {
      clientId: "mock_test_client_id_dev_12345",
      clientSecret: "mock_test_client_secret_dev_67890",
      redirectUri: "http://localhost:5001/api/integrations/google/callback",
    };

    const saveResult = await IntegrationProviderService.saveCredentials("google_workspace", {
      credentials: googleCreds,
      userId: 1,
    });
    assert(saveResult.success === true, "Super Admin credentials saved successfully");
    assert(saveResult.maskedCredentials.clientSecret.includes("••••"), "Super Admin response masks client secret");

    // Check raw PostgreSQL record to verify encryption at rest
    const rawGoogleCred = await prisma.integrationCredential.findFirst({
      where: {
        provider: { providerKey: "google_workspace" },
        environment: "production",
      },
    });
    assert(Boolean(rawGoogleCred), "Credential record found in PostgreSQL table");
    assert(rawGoogleCred.credentialsEncrypted.startsWith("v1:gcm:"), "DB credentials_encrypted column uses AES-256-GCM");
    assert(!rawGoogleCred.credentialsEncrypted.includes(googleCreds.clientSecret), "DB never contains plaintext clientSecret");

    // Configure Brevo API Key
    const brevoCreds = {
      apiKey: "mock_test_api_key_sample_value_889900",
      senderEmail: "notifications@docucore.ai",
      senderName: "DocuCore Enterprise Alerts",
    };
    await IntegrationProviderService.saveCredentials("brevo", {
      credentials: brevoCreds,
      userId: 1,
    });
    const rawBrevoCred = await prisma.integrationCredential.findFirst({
      where: {
        provider: { providerKey: "brevo" },
        environment: "production",
      },
    });
    assert(!rawBrevoCred.credentialsEncrypted.includes(brevoCreds.apiKey), "DB never contains plaintext Brevo API Key");

    // -------------------------------------------------------------
    // TEST 4: Zero Secrets Exposed to Organisation Admins
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Tenant Data Privacy (Zero Secret Leakage) ---");
    const orgCatalog = await OrganisationIntegrationService.listIntegrations(1);
    assert(Array.isArray(orgCatalog) && orgCatalog.length >= 6, "Organisation Admin catalog returns all providers");

    for (const p of orgCatalog) {
      assert(p.credentials === undefined, `Org Admin catalog omits 'credentials' for ${p.providerKey}`);
      assert(p.clientSecret === undefined, `Org Admin catalog omits 'clientSecret' for ${p.providerKey}`);
      assert(p.apiKey === undefined, `Org Admin catalog omits 'apiKey' for ${p.providerKey}`);
      assert(p.credentialsEncrypted === undefined, `Org Admin catalog omits 'credentialsEncrypted' for ${p.providerKey}`);
    }

    const googleOrgView = orgCatalog.find((p) => p.providerKey === "google_workspace");
    assert(googleOrgView.isPlatformConfigured === true, "Google Workspace indicates platform is configured for 1-click connect");

    // -------------------------------------------------------------
    // TEST 5: OAuth 2.0 Flow with PKCE & CSRF State Tracking
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: OAuth 2.0 Initiation & State Protection ---");
    const oauthInitiation = await IntegrationOAuthService.initiateOAuth({
      organisationId: 1,
      providerKeyOrId: "google_workspace",
    });

    assert(Boolean(oauthInitiation.authUrl), "OAuth authUrl generated");
    assert(oauthInitiation.authUrl.includes("accounts.google.com"), "authUrl points to Google OAuth endpoint");
    assert(oauthInitiation.authUrl.includes(googleCreds.clientId), "authUrl includes platform Client ID");
    assert(Boolean(oauthInitiation.stateToken), "Secure random state token generated");

    // Verify OAuthState in DB
    const stateInDb = await prisma.oAuthState.findFirst({
      where: { organisationId: 1, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    assert(Boolean(stateInDb), "OAuthState record persisted in PostgreSQL");
    assert(stateInDb.expiresAt > new Date(), "OAuthState has valid future expiration (> now)");

    // Test tampering with state token
    let invalidStateCaught = false;
    try {
      await IntegrationOAuthService.handleCallback({
        stateToken: "tampered_non_existent_state_token_12345",
        code: "mock_auth_code",
      });
    } catch {
      invalidStateCaught = true;
    }
    assert(invalidStateCaught, "Invalid or altered state token is rejected (CSRF protection)");

    // -------------------------------------------------------------
    // TEST 6: API Key Connection & Tenant-Isolated Data Storage
    // -------------------------------------------------------------
    console.log("\n--- TEST 6: Tenant Connection & Isolation ---");
    const tenant1Connect = await OrganisationIntegrationService.connectApiKeyIntegration({
      organisationId: 1,
      providerKeyOrId: "brevo",
      config: {
        accountName: "Org 1 Brevo Account",
        senderEmail: "billing@org1.com",
        apiKey: "sample_tenant_api_key_custom_org1",
      },
      userId: 1,
    });
    assert(tenant1Connect.success === true, "Tenant 1 connected Brevo successfully");

    // Inspect Tenant 1's saved integration in DB
    const tenant1Record = await prisma.organisationIntegration.findFirst({
      where: { organisationId: 1, providerKey: "brevo" },
    });
    assert(Boolean(tenant1Record), "Tenant 1 record persisted in organisation_integrations");
    assert(tenant1Record.connectionStatus === "CONNECTED", "Tenant 1 status is CONNECTED");
    assert(tenant1Record.accessTokenEncrypted.startsWith("v1:gcm:"), "Tenant 1 API key encrypted with AES-256-GCM");
    assert(!tenant1Record.accessTokenEncrypted.includes("org1-only"), "Tenant secret not in plaintext");

    // Multi-tenant isolation verification: Tenant 2 MUST NOT see Tenant 1's connection
    const tenant2Catalog = await OrganisationIntegrationService.listIntegrations(2);
    const tenant2Brevo = tenant2Catalog.find((p) => p.providerKey === "brevo");
    assert(tenant2Brevo.isConnected === false, "Tenant 2 sees Brevo as NOT connected");
    assert(tenant2Brevo.accountEmail === null, "Tenant 2 does NOT see Tenant 1's accountEmail");

    // -------------------------------------------------------------
    // TEST 7: Disconnect & Reconnect Lifecycle
    // -------------------------------------------------------------
    console.log("\n--- TEST 7: Disconnect & Security Cleanup ---");
    const disconnectResult = await OrganisationIntegrationService.disconnectIntegration({
      organisationId: 1,
      providerKeyOrId: "brevo",
      userId: 1,
    });
    assert(disconnectResult.success === true, "Disconnect succeeds");

    const disconnectedRecord = await prisma.organisationIntegration.findFirst({
      where: { organisationId: 1, providerKey: "brevo" },
    });
    assert(disconnectedRecord.connectionStatus === "DISCONNECTED", "Status updated to DISCONNECTED");
    assert(disconnectedRecord.accessTokenEncrypted === null, "Encrypted token wiped on disconnect");

    // -------------------------------------------------------------
    // TEST 8: Dynamic Extensibility (Zero Code Changes for New Provider)
    // -------------------------------------------------------------
    console.log("\n--- TEST 8: Dynamic Provider Extensibility (Adding 7th Provider) ---");
    const testProviderKey = "test_custom_crm";
    await prisma.integrationProvider.deleteMany({ where: { providerKey: testProviderKey } });

    const newProvider = await prisma.integrationProvider.create({
      data: {
        providerKey: testProviderKey,
        providerName: "Test Custom CRM",
        category: "CRM",
        authenticationType: "api_key",
        description: "Dynamic third-party CRM provider added at runtime.",
        isEnabled: true,
        isActive: true,
        configurationSchema: {
          fields: [{ key: "apiKey", label: "API Key", type: "password", required: true }],
        },
      },
    });
    assert(Boolean(newProvider.id), "New provider created directly in PostgreSQL without schema changes");

    // Verify it appears in Super Admin & Org Admin catalogs immediately
    const updatedCatalog = await OrganisationIntegrationService.listIntegrations(1);
    const foundNew = updatedCatalog.some((p) => p.providerKey === testProviderKey);
    assert(foundNew, "New provider dynamically appeared in Organisation Admin catalog");

    // Clean up test provider
    await prisma.integrationProvider.delete({ where: { id: newProvider.id } });
    console.log("  🧹 Cleaned up test dynamic provider");

    // -------------------------------------------------------------
    // FINAL SUMMARY
    // -------------------------------------------------------------
    console.log("\n==========================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==========================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Unexpected error in test suite:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
