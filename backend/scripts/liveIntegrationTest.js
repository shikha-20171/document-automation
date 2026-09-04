const axios = require("axios");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5001";

async function runTests() {
  console.log(`\n========================================`);
  console.log(`🚀 RUNNING LIVE API INTEGRATION TESTS`);
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`========================================\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing ${name}... `);
      await fn();
      console.log(`✅ PASSED`);
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.response?.status || err.message}`);
      if (err.response?.data) {
        console.log(`   Response:`, JSON.stringify(err.response.data));
      }
      failed++;
    }
  }

  // 1. Health check
  await test("Root & Health Endpoints", async () => {
    const resRoot = await axios.get(`${BASE_URL}/health`);
    if (resRoot.status !== 200 || resRoot.data.app !== "up") throw new Error("Health check failed");
    const resApiHealth = await axios.get(`${BASE_URL}/api/health`);
    if (resApiHealth.status !== 200) throw new Error("API Health check failed");
  });

  // 2. Auth Login via /api/auth/login
  let token = null;
  await test("POST /api/auth/login", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "admin@demo.com",
      password: "Admin@123",
    });
    if (!res.data.success || (!res.data.token && !res.data.accessToken && !res.data.data?.token)) {
      throw new Error("Login failed or token missing");
    }
    token = res.data.token || res.data.accessToken || res.data.data?.token;
  });

  // 3. Direct Alias POST /auth/login
  await test("POST /auth/login (Root Alias)", async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@demo.com",
      password: "Admin@123",
    });
    if (!res.data.success) throw new Error("Alias login failed");
  });

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // 4. GET /api/auth/me & /auth/me
  await test("GET /api/auth/me & /auth/me", async () => {
    const res1 = await axios.get(`${BASE_URL}/api/auth/me`, { headers });
    if (!res1.data.success) throw new Error("GET /api/auth/me failed");
    const res2 = await axios.get(`${BASE_URL}/auth/me`, { headers });
    if (!res2.data.success) throw new Error("GET /auth/me failed");
  });

  // 5. Super Admin Organisations CRUD & Stats
  await test("GET /api/organisations & /organisations", async () => {
    const res1 = await axios.get(`${BASE_URL}/api/organisations`, { headers });
    if (!res1.data.success) throw new Error("GET /api/organisations failed");
    const res2 = await axios.get(`${BASE_URL}/organisations`, { headers });
    if (!res2.data.success) throw new Error("GET /organisations failed");
  });

  // 6. Super Admin Dashboard Stats
  await test("GET /api/super-admin/dashboard/stats", async () => {
    const res = await axios.get(`${BASE_URL}/api/super-admin/dashboard/stats`, { headers });
    if (!res.data.success) throw new Error("GET dashboard stats failed");
  });

  // 7. AI Management Providers
  await test("GET /api/super-admin/ai-management/providers", async () => {
    const res = await axios.get(`${BASE_URL}/api/super-admin/ai-management/providers`, { headers });
    if (!res.data.success) throw new Error("GET AI providers failed");
  });

  // 8. Super Admin Notifications
  await test("GET /api/super-admin/modules/notifications", async () => {
    const res = await axios.get(`${BASE_URL}/api/super-admin/modules/notifications`, { headers });
    if (!res.data.success) throw new Error("GET notifications failed");
  });

  // 9. Governance Dashboard
  await test("GET /api/governance/dashboard", async () => {
    const res = await axios.get(`${BASE_URL}/api/governance/dashboard`, { headers });
    if (!res.data.success) throw new Error("GET governance dashboard failed");
  });

  // 10. Public Subscriptions Plans
  await test("GET /api/public/subscription-plans", async () => {
    const res = await axios.get(`${BASE_URL}/api/public/subscription-plans`);
    if (!res.data.success) throw new Error("GET public subscriptions failed");
  });

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
