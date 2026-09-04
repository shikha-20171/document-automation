const axios = require("axios");

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5001";

async function testRoles() {
  console.log(`\n==============================================`);
  console.log(`🚀 COMPREHENSIVE MULTI-ROLE PRODUCTION API TEST`);
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`==============================================\n`);

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing [${name}]... `);
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

  // 1. Super Admin Role
  let superAdminToken = null;
  await test("Super Admin Login & Endpoints", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "admin@demo.com",
      password: "Admin@123",
    });
    superAdminToken = res.data.token || res.data.accessToken || res.data.data?.token;
    const h = { Authorization: `Bearer ${superAdminToken}` };

    await axios.get(`${BASE_URL}/api/super-admin/dashboard/stats`, { headers: h });
    await axios.get(`${BASE_URL}/api/super-admin/organisations`, { headers: h });
    await axios.get(`${BASE_URL}/api/super-admin/storage/overview`, { headers: h });
    await axios.get(`${BASE_URL}/api/super-admin/ai/providers`, { headers: h });
    await axios.get(`${BASE_URL}/api/super-admin/audit-logs`, { headers: h });
  });

  // 2. Org Admin Role
  let orgAdminToken = null;
  await test("Org Admin Login & Endpoints", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "neha@tcs.com",
      password: "Admin@123",
    });
    orgAdminToken = res.data.token || res.data.accessToken || res.data.data?.token;
    const h = { Authorization: `Bearer ${orgAdminToken}` };

    await axios.get(`${BASE_URL}/api/org-admin/documents`, { headers: h });
    await axios.get(`${BASE_URL}/api/org-admin/team/users`, { headers: h });
    await axios.get(`${BASE_URL}/api/org-admin/team/teams`, { headers: h });
    await axios.get(`${BASE_URL}/api/org-admin/team/departments`, { headers: h });
    await axios.get(`${BASE_URL}/api/org-admin/analytics/overview`, { headers: h });
    await axios.get(`${BASE_URL}/api/org-admin/workflows`, { headers: h });
    await axios.get(`${BASE_URL}/api/org-admin/notifications`, { headers: h });
    await axios.get(`${BASE_URL}/api/org-admin/settings`, { headers: h });
  });

  // 3. Department Manager Role
  await test("Department Manager Login & Endpoints", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "dept.manager@tcs.com",
      password: "Admin@123",
    });
    const dmToken = res.data.token || res.data.accessToken || res.data.data?.token;
    const h = { Authorization: `Bearer ${dmToken}` };

    await axios.get(`${BASE_URL}/api/department-manager/dashboard`, { headers: h });
    await axios.get(`${BASE_URL}/api/department-manager/documents`, { headers: h });
    await axios.get(`${BASE_URL}/api/department-manager/team`, { headers: h });
    await axios.get(`${BASE_URL}/api/department-manager/approvals`, { headers: h });
    await axios.get(`${BASE_URL}/api/department-manager/notifications`, { headers: h });
  });

  // 4. Team Leader Role
  await test("Team Leader Login & Endpoints", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "team.lead@tcs.com",
      password: "Admin@123",
    });
    const tlToken = res.data.token || res.data.accessToken || res.data.data?.token;
    const h = { Authorization: `Bearer ${tlToken}` };

    await axios.get(`${BASE_URL}/api/team-leader/dashboard`, { headers: h });
    await axios.get(`${BASE_URL}/api/team-leader/my-team`, { headers: h });
    await axios.get(`${BASE_URL}/api/team-leader/documents`, { headers: h });
    await axios.get(`${BASE_URL}/api/team-leader/tasks`, { headers: h });
    await axios.get(`${BASE_URL}/api/team-leader/notifications`, { headers: h });
  });

  // 5. Employee Role
  await test("Employee Login & Endpoints", async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "employee@tcs.com",
      password: "Admin@123",
    });
    const empToken = res.data.token || res.data.accessToken || res.data.data?.token;
    const h = { Authorization: `Bearer ${empToken}` };

    await axios.get(`${BASE_URL}/api/employee/dashboard`, { headers: h });
    await axios.get(`${BASE_URL}/api/employee/documents`, { headers: h });
    await axios.get(`${BASE_URL}/api/employee/tasks`, { headers: h });
    await axios.get(`${BASE_URL}/api/employee/notifications`, { headers: h });
  });

  console.log(`\n==============================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`==============================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

testRoles();
