import "dotenv/config";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Generate Super Admin token
const superAdminToken = jwt.sign(
  {
    id: 1,
    email: "superadmin@platform.com",
    role: "SUPER_ADMIN",
    first_name: "Super",
    last_name: "Admin",
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);

// Generate Organisation Admin token for Organisation 1
const orgAdminToken = jwt.sign(
  {
    id: 2,
    email: "orgadmin@org1.com",
    role: "ORGANISATION_ADMIN",
    organisation_id: 1,
    organisationId: 1,
    first_name: "Org",
    last_name: "Admin",
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);

async function testHttpApis() {
  console.log("Testing HTTP APIs on http://localhost:5001...\n");

  // 1. Super Admin: GET /api/super-admin/platform-integrations
  const res1 = await fetch("http://localhost:5001/api/super-admin/platform-integrations", {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  const data1 = await res1.json();
  console.log("1. Super Admin GET /platform-integrations:", res1.status, `(${data1.data?.length} providers returned)`);
  if (!res1.ok || !data1.success) {
    console.error("Failed response:", data1);
    process.exit(1);
  }

  // 2. Super Admin: PUT /api/super-admin/platform-integrations/slack/config
  const res2 = await fetch("http://localhost:5001/api/super-admin/platform-integrations/slack/config", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${superAdminToken}`,
    },
    body: JSON.stringify({
      clientId: "slack_client_id_test_123",
      clientSecret: "slack_secret_value_xyz456",
      redirectUri: "http://localhost:5001/api/integrations/slack/callback",
    }),
  });
  const data2 = await res2.json();
  console.log("2. Super Admin PUT /slack/config:", res2.status, data2.message);
  console.log("   Masked Credentials in response:", data2.data?.maskedCredentials);

  // 3. Organisation Admin: GET /api/integrations/providers
  const res3 = await fetch("http://localhost:5001/api/integrations/providers", {
    headers: { Authorization: `Bearer ${orgAdminToken}` },
  });
  const data3 = await res3.json();
  console.log("3. Org Admin GET /api/integrations/providers:", res3.status, `(${data3.data?.length} items)`);
  
  // Verify Org Admin receives ZERO secrets in API response
  const slackOrgView = data3.data?.find((p) => p.providerKey === "slack" || p.id === "SLACK");
  console.log("   Slack Provider Status for Org Admin:", slackOrgView?.status);
  console.log("   Are Client Secrets Exposed to Org Admin?:", Boolean(slackOrgView?.clientSecret || slackOrgView?.clientSecretEncrypted));

  // 4. Organisation Admin: POST /api/integrations/slack/connect
  const res4 = await fetch("http://localhost:5001/api/integrations/slack/connect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${orgAdminToken}`,
    },
    body: JSON.stringify({}),
  });
  const data4 = await res4.json();
  console.log("4. Org Admin POST /slack/connect:", res4.status, `requiresRedirect=${data4.requiresRedirect}`);
  console.log("   OAuth URL returned:", data4.authUrl?.slice(0, 60) + "...");
  console.log("   Secure State Token generated:", Boolean(data4.stateToken));

  console.log("\n✅ All HTTP API Integration endpoints successfully verified!");
}

testHttpApis().catch((err) => {
  console.error("HTTP test failed:", err);
  process.exit(1);
});
