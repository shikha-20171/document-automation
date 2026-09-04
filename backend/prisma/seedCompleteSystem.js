const prisma = require("../src/config/prismaClient");
const { hashPassword } = require("../src/utils/password");

async function seedCompleteSystem() {
  console.log("🌱 Starting complete system database seeding...");

  const passwordHash = await hashPassword("Admin@123");

  // 1. Roles
  console.log("1. Seeding Roles...");
  const roles = [
    { name: "SUPER_ADMIN", description: "Platform Owner and Global Super Administrator" },
    { name: "ORGANISATION_ADMIN", description: "Enterprise Organization Administrator" },
    { name: "DEPARTMENT_MANAGER", description: "Department Head and Manager" },
    { name: "TEAM_LEADER", description: "Team Lead and Approval Reviewer" },
    { name: "STAFF", description: "Staff / Regular Employee" },
    { name: "EMPLOYEE", description: "Staff / Regular Employee" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
  }

  // 2. Global Super Admin User
  console.log("2. Seeding Global Super Admin...");
  await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: { password_hash: passwordHash, status: "active" },
    create: {
      full_name: "Vikram Malhotra (Super Admin)",
      email: "admin@demo.com",
      password_hash: passwordHash,
      role: "SUPER_ADMIN",
      status: "active",
      must_change_password: false,
    },
  });

  // 3. Organisations & Locations
  console.log("3. Seeding Organisations & Locations...");
  const tcs = await prisma.organisation.upsert({
    where: { id: 1 },
    update: {
      name: "Tata Consultancy Services (TCS)",
      email: "contact@tcs.com",
      phone: "+91 22 6778 9999",
      website: "https://www.tcs.com",
      city: "Mumbai",
      country: "India",
      status: "active",
    },
    create: {
      id: 1,
      name: "Tata Consultancy Services (TCS)",
      email: "contact@tcs.com",
      phone: "+91 22 6778 9999",
      website: "https://www.tcs.com",
      address: "TCS House, Raveline Street, Fort",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      postal_code: "400001",
      status: "active",
    },
  });

  await prisma.organisation.upsert({
    where: { id: 2 },
    update: {
      name: "Infosys Technologies",
      email: "contact@infosys.com",
      phone: "+91 80 2852 0261",
      website: "https://www.infosys.com",
      city: "Bangalore",
      country: "India",
      status: "active",
    },
    create: {
      id: 2,
      name: "Infosys Technologies",
      email: "contact@infosys.com",
      phone: "+91 80 2852 0261",
      website: "https://www.infosys.com",
      address: "Electronics City, Hosur Road",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      postal_code: "560100",
      status: "active",
    },
  });

  // Locations for TCS
  const mumbaiLoc = await prisma.organisationLocation.upsert({
    where: { organisation_id_city: { organisation_id: tcs.id, city: "Mumbai" } },
    update: { name: "TCS - Mumbai HQ", status: "active" },
    create: {
      organisation_id: tcs.id,
      name: "TCS - Mumbai HQ",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      status: "active",
    },
  });

  // 4. Departments for TCS
  console.log("4. Seeding Departments...");
  const engineeringDept = await prisma.department.upsert({
    where: { id: 1 },
    update: { name: "Engineering & Technology", employees_count: 42 },
    create: {
      id: 1,
      organisation_id: tcs.id,
      name: "Engineering & Technology",
      description: "Core software engineering, architecture, and cloud infrastructure.",
      head: "Sunil Verma",
      employees_count: 42,
    },
  });

  const financeDept = await prisma.department.upsert({
    where: { id: 2 },
    update: { name: "Finance & Accounting", employees_count: 18 },
    create: {
      id: 2,
      organisation_id: tcs.id,
      name: "Finance & Accounting",
      description: "Financial audits, invoices, budgeting, and taxation.",
      head: "Ananya Roy",
      employees_count: 18,
    },
  });

  // 5. Teams
  console.log("5. Seeding Teams...");
  await prisma.team.upsert({
    where: { id: 1 },
    update: { name: "Full-Stack Enterprise Team", members: 12 },
    create: {
      id: 1,
      organisation_id: tcs.id,
      name: "Full-Stack Enterprise Team",
      department: "Engineering & Technology",
      team_lead: "Rahul Sharma",
      members: 12,
    },
  });

  await prisma.team.upsert({
    where: { id: 2 },
    update: { name: "Financial Audit & Compliance", members: 6 },
    create: {
      id: 2,
      organisation_id: tcs.id,
      name: "Financial Audit & Compliance",
      department: "Finance & Accounting",
      team_lead: "Rahul Sharma",
      members: 6,
    },
  });

  // 6. Users across all roles
  console.log("6. Seeding Users for all roles...");
  // Org Admin
  const orgAdmin = await prisma.user.upsert({
    where: { email: "orgadmin@demo.com" },
    update: {
      password_hash: passwordHash,
      organisation_id: tcs.id,
      location_id: mumbaiLoc.id,
      role: "ORGANISATION_ADMIN",
      status: "active",
    },
    create: {
      full_name: "Amit Deshmukh (Org Admin)",
      email: "orgadmin@demo.com",
      password_hash: passwordHash,
      role: "ORGANISATION_ADMIN",
      organisation_id: tcs.id,
      location_id: mumbaiLoc.id,
      status: "active",
      must_change_password: false,
    },
  });

  // Department Manager
  const deptManager = await prisma.user.upsert({
    where: { email: "manager@demo.com" },
    update: {
      password_hash: passwordHash,
      organisation_id: tcs.id,
      location_id: mumbaiLoc.id,
      role: "DEPARTMENT_MANAGER",
      status: "active",
    },
    create: {
      full_name: "Sunil Verma (Dept Manager)",
      email: "manager@demo.com",
      password_hash: passwordHash,
      role: "DEPARTMENT_MANAGER",
      organisation_id: tcs.id,
      location_id: mumbaiLoc.id,
      status: "active",
      must_change_password: false,
    },
  });

  // Team Leader
  const teamLead = await prisma.user.upsert({
    where: { email: "teamlead@demo.com" },
    update: {
      password_hash: passwordHash,
      organisation_id: tcs.id,
      location_id: mumbaiLoc.id,
      role: "TEAM_LEADER",
      status: "active",
    },
    create: {
      full_name: "Rahul Sharma (Team Lead)",
      email: "teamlead@demo.com",
      password_hash: passwordHash,
      role: "TEAM_LEADER",
      organisation_id: tcs.id,
      location_id: mumbaiLoc.id,
      status: "active",
      must_change_password: false,
    },
  });

  await prisma.user.upsert({
    where: { email: "shikhagour20@gmail.com" },
    update: {
      password_hash: passwordHash,
      organisation_id: tcs.id,
      location_id: mumbaiLoc.id,
      role: "TEAM_LEADER",
      status: "active",
    },
    create: {
      full_name: "Shikha Gour (Team Lead)",
      email: "shikhagour20@gmail.com",
      password_hash: passwordHash,
      role: "TEAM_LEADER",
      organisation_id: tcs.id,
      location_id: mumbaiLoc.id,
      status: "active",
      must_change_password: false,
    },
  });

  // Employee
  const employee = await prisma.user.upsert({
    where: { email: "employee@demo.com" },
    update: {
      password_hash: passwordHash,
      organisation_id: tcs.id,
      location_id: mumbaiLoc.id,
      role: "STAFF",
      status: "active",
    },
    create: {
      full_name: "Priya Sharma (Software Engineer)",
      email: "employee@demo.com",
      password_hash: passwordHash,
      role: "STAFF",
      organisation_id: tcs.id,
      location_id: mumbaiLoc.id,
      status: "active",
      must_change_password: false,
    },
  });

  // 7. Document Templates
  console.log("7. Seeding Document Templates...");
  await prisma.documentTemplate.upsert({
    where: { id: "tpl-nda-001" },
    update: {
      name: "Standard Non-Disclosure Agreement (NDA)",
      category: "Legal",
      documentType: "NDA",
      content: "This Mutual Non-Disclosure Agreement is entered into between Tata Consultancy Services and Vendor...",
      status: "ACTIVE",
    },
    create: {
      id: "tpl-nda-001",
      organisationId: tcs.id,
      name: "Standard Non-Disclosure Agreement (NDA)",
      description: "Enterprise mutual confidentiality and non-disclosure agreement for vendors and contractors.",
      category: "Legal",
      documentType: "NDA",
      content: "This Mutual Non-Disclosure Agreement is entered into between Tata Consultancy Services and Vendor...",
      status: "ACTIVE",
      createdById: orgAdmin.id,
    },
  });

  await prisma.documentTemplate.upsert({
    where: { id: "tpl-invoice-002" },
    update: {
      name: "Vendor Service Invoice Template",
      category: "Finance",
      documentType: "Invoice",
      content: "INVOICE # INV-2026-XXXX\nBilled To: Tata Consultancy Services\nServices Rendered...",
      status: "ACTIVE",
    },
    create: {
      id: "tpl-invoice-002",
      organisationId: tcs.id,
      name: "Vendor Service Invoice Template",
      description: "Standard billing invoice template for milestone approvals.",
      category: "Finance",
      documentType: "Invoice",
      content: "INVOICE # INV-2026-XXXX\nBilled To: Tata Consultancy Services\nServices Rendered...",
      status: "ACTIVE",
      createdById: deptManager.id,
    },
  });

  // 8. Documents in Connected Pipeline
  console.log("8. Seeding Documents...");
  const doc1 = await prisma.document.upsert({
    where: { id: 1 },
    update: {
      name: "Q1 Financial Audit Report & Vendor Invoices",
      type: "application/pdf",
      size: 2.45,
      uploaded_by: employee.full_name,
    },
    create: {
      id: 1,
      organisation_id: tcs.id,
      name: "Q1 Financial Audit Report & Vendor Invoices",
      type: "application/pdf",
      size: 2.45,
      uploaded_by: employee.full_name,
    },
  });

  const doc2 = await prisma.document.upsert({
    where: { id: 2 },
    update: {
      name: "Enterprise Cloud Infrastructure Agreement",
      type: "application/pdf",
      size: 1.84,
      uploaded_by: employee.full_name,
    },
    create: {
      id: 2,
      organisation_id: tcs.id,
      name: "Enterprise Cloud Infrastructure Agreement",
      type: "application/pdf",
      size: 1.84,
      uploaded_by: employee.full_name,
    },
  });

  // 9. Workflows & Approval Requests (Employee -> Team Lead -> Dept Manager)
  console.log("9. Seeding Workflows & Approval Requests...");
  const defaultWorkflow = await prisma.workflow.upsert({
    where: { id: "wf-standard-approval-01" },
    update: { name: "Standard Document Review Workflow", status: "ACTIVE" },
    create: {
      id: "wf-standard-approval-01",
      organisationId: tcs.id,
      name: "Standard Document Review Workflow",
      description: "2-Step verification workflow with Team Lead and Department Manager approval.",
      appliesTo: "All Documents",
      department: "Engineering & Technology",
      status: "ACTIVE",
      createdById: orgAdmin.id,
    },
  });

  const approval1 = await prisma.approvalRequest.upsert({
    where: { id: "req-appr-001" },
    update: { status: "PENDING", documentName: doc1.name },
    create: {
      id: "req-appr-001",
      organisationId: tcs.id,
      workflowId: defaultWorkflow.id,
      documentId: doc1.id,
      documentName: doc1.name,
      requestedById: employee.id,
      status: "PENDING",
      currentStepOrder: 1,
    },
  });

  const approval2 = await prisma.approvalRequest.upsert({
    where: { id: "req-appr-002" },
    update: { status: "APPROVED", documentName: doc2.name },
    create: {
      id: "req-appr-002",
      organisationId: tcs.id,
      workflowId: defaultWorkflow.id,
      documentId: doc2.id,
      documentName: doc2.name,
      requestedById: employee.id,
      status: "APPROVED",
      currentStepOrder: 2,
    },
  });

  // Approval Actions / Comments
  await prisma.approvalAction.upsert({
    where: { id: "action-appr-001" },
    update: { action: "APPROVE", comment: "All terms verified with engineering budget. Approved." },
    create: {
      id: "action-appr-001",
      approvalRequestId: approval2.id,
      stepOrder: 1,
      performedById: teamLead.id,
      action: "APPROVE",
      comment: "All terms verified with engineering budget. Approved.",
    },
  });

  // 10. Tasks (Assigned by Team Lead & Dept Manager to Employee)
  console.log("10. Seeding Tasks...");
  await prisma.task.upsert({
    where: { id: "task-eng-001" },
    update: { status: "IN_PROGRESS", priority: "HIGH" },
    create: {
      id: "task-eng-001",
      organisation_id: tcs.id,
      title: "Review & Format Q1 Invoice Discrepancy Sheet",
      description: "Cross check vendor billing against monthly purchase orders and upload the finalized PDF.",
      assigned_to: employee.full_name,
      assigned_to_id: String(employee.id),
      assigned_email: employee.email,
      priority: "HIGH",
      status: "IN_PROGRESS",
      due_date: "2026-08-28",
      team: "Full-Stack Enterprise Team",
    },
  });

  await prisma.task.upsert({
    where: { id: "task-eng-002" },
    update: { status: "COMPLETED", priority: "NORMAL" },
    create: {
      id: "task-eng-002",
      organisation_id: tcs.id,
      title: "Prepare Cloud Infrastructure SLA Renewal Document",
      description: "Assemble the SLA contract for cloud clusters and request initial Team Lead signoff.",
      assigned_to: employee.full_name,
      assigned_to_id: String(employee.id),
      assigned_email: employee.email,
      priority: "NORMAL",
      status: "COMPLETED",
      due_date: "2026-08-20",
      team: "Full-Stack Enterprise Team",
    },
  });

  // 11. Notifications
  console.log("11. Seeding Notifications...");
  await prisma.notification.upsert({
    where: { id: "notif-tl-001" },
    update: { unread: true },
    create: {
      id: "notif-tl-001",
      organisation_id: tcs.id,
      user_id: teamLead.id,
      title: "New Approval Request Received",
      message: "Priya Sharma submitted 'Q1 Financial Audit Report & Vendor Invoices' for your review.",
      type: "APPROVAL_REQUEST",
      unread: true,
      read: false,
    },
  });

  await prisma.notification.upsert({
    where: { id: "notif-emp-002" },
    update: { unread: false, read: true },
    create: {
      id: "notif-emp-002",
      organisation_id: tcs.id,
      user_id: employee.id,
      title: "Document Approved",
      message: "Rahul Sharma (Team Lead) approved your 'Enterprise Cloud Infrastructure Agreement' document.",
      type: "DOCUMENT_APPROVED",
      unread: false,
      read: true,
    },
  });

  // 12. Support Tickets
  console.log("12. Seeding Support Tickets...");
  await prisma.supportTicket.upsert({
    where: { ticketCode: "TICK-2026-1089" },
    update: { status: "OPEN" },
    create: {
      ticketCode: "TICK-2026-1089",
      organisationId: String(tcs.id),
      organisationName: tcs.name,
      adminName: orgAdmin.full_name,
      adminEmail: orgAdmin.email,
      category: "Billing & Quota",
      priority: "HIGH",
      status: "OPEN",
      description: "Our current volume for finance and legal archives has reached 85% capacity. Requesting 500GB quota boost.",
    },
  });

  // 13. Subscriptions & Plans
  console.log("13. Seeding Subscriptions...");
  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { planCode: "PLAN-ENT-ULTRA" },
    update: { planName: "Enterprise Ultra Plan", monthlyPrice: 999.00 },
    create: {
      planName: "Enterprise Ultra Plan",
      planCode: "PLAN-ENT-ULTRA",
      description: "Unlimited document automation, priority approval queues, and dedicated support.",
      monthlyPrice: 999.00,
      yearlyPrice: 9990.00,
      currency: "USD",
      userLimit: 500,
      storageLimitGB: 1000,
      aiCredits: 50000,
      supportLevel: "DEDICATED",
      isMostPopular: true,
      isActive: true,
    },
  });

  await prisma.organisationSubscription.upsert({
    where: { id: "sub-tcs-001" },
    update: { status: "ACTIVE" },
    create: {
      id: "sub-tcs-001",
      organisationId: String(tcs.id),
      planId: enterprisePlan.id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      monthlyPrice: 999.00,
      finalPrice: 999.00,
    },
  });

  // 14. Super Admin Audit Logs (Covering all platform categories with strict privacy)
  console.log("14. Seeding Super Admin Audit Logs...");
  const sampleAuditLogs = [
    {
      eventId: "EVT-892101",
      actorName: "Vikram Malhotra (Super Admin)",
      actorType: "SUPER_ADMIN",
      module: "SECURITY",
      action: "LOGIN_SUCCESS",
      resourceName: "Super Admin Portal",
      severity: "INFO",
      result: "SUCCESS",
      ipAddress: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
      browser: "Chrome",
      operatingSystem: "macOS",
      location: "Mumbai, India",
      details: {
        description: "Super Admin authenticated successfully via Password + WebAuthn session.",
        organisationName: "Platform",
        requestId: "req_auth_88291",
        metadata: { authMethod: "PASSWORD_MFA", sessionDurationMinutes: 120 },
      },
    },
    {
      eventId: "EVT-892102",
      actorName: "Vikram Malhotra (Super Admin)",
      actorType: "SUPER_ADMIN",
      module: "ORGANISATION",
      action: "ORGANIZATION_CREATED",
      resourceName: "Tata Consultancy Services (TCS)",
      organisationId: String(tcs.id),
      severity: "INFO",
      result: "SUCCESS",
      ipAddress: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      browser: "Chrome",
      operatingSystem: "macOS",
      details: {
        description: "Provisioned new multi-tenant organization with Enterprise subscription allocations.",
        organisationName: "Tata Consultancy Services (TCS)",
        requestId: "req_org_77210",
        newValues: { name: "Tata Consultancy Services (TCS)", city: "Mumbai", tier: "Enterprise" },
        metadata: { allocatedUsers: 500, storageQuotaGB: 1000 },
      },
    },
    {
      eventId: "EVT-892103",
      actorName: "Vikram Malhotra (Super Admin)",
      actorType: "SUPER_ADMIN",
      module: "AI_CONFIG",
      action: "AI_PROVIDER_ACTIVATED",
      resourceName: "OpenAI GPT-4o Enterprise",
      severity: "INFO",
      result: "SUCCESS",
      ipAddress: "192.168.1.10",
      details: {
        description: "Activated OpenAI production model engine with rotated credentials.",
        organisationName: "Platform",
        requestId: "req_ai_33891",
        newValues: { provider: "OpenAI", model: "gpt-4o", status: "ACTIVE" },
        metadata: { credentialId: "cred_ai_9918", keyLast4: "8X92", rateLimitRpm: 10000 },
      },
    },
    {
      eventId: "EVT-892104",
      actorName: "Vikram Malhotra (Super Admin)",
      actorType: "SUPER_ADMIN",
      module: "STORAGE",
      action: "STORAGE_QUOTA_UPDATED",
      resourceName: "AWS S3 Multi-Region Storage",
      organisationId: String(tcs.id),
      severity: "INFO",
      result: "SUCCESS",
      ipAddress: "192.168.1.10",
      details: {
        description: "Adjusted organization storage quota limit following enterprise capacity expansion.",
        organisationName: "Tata Consultancy Services (TCS)",
        requestId: "req_stg_44120",
        oldValues: { storageQuotaGB: 500 },
        newValues: { storageQuotaGB: 1000 },
        metadata: { storageTier: "Enterprise Hot Storage", retentionYears: 7 },
      },
    },
    {
      eventId: "EVT-892105",
      actorName: "Vikram Malhotra (Super Admin)",
      actorType: "SUPER_ADMIN",
      module: "PLATFORM",
      action: "SESSION_TIMEOUT_CHANGED",
      resourceName: "Global Security Policy",
      severity: "INFO",
      result: "SUCCESS",
      ipAddress: "192.168.1.10",
      details: {
        description: "Enforced shorter idle session timeout for enterprise SOC-2 compliance.",
        organisationName: "Platform",
        requestId: "req_sec_10928",
        oldValues: { idleTimeoutMinutes: 60 },
        newValues: { idleTimeoutMinutes: 30 },
        metadata: { complianceStandard: "SOC2_TYPE_II" },
      },
    },
    {
      eventId: "EVT-892106",
      actorName: "Security Sentinel",
      actorType: "SECURITY_GUARD",
      module: "SECURITY",
      action: "LOGIN_FAILED",
      resourceName: "Super Admin Gateway",
      severity: "WARNING",
      result: "FAILED",
      ipAddress: "185.220.101.5",
      details: {
        description: "Suspicious login attempt blocked from unauthorized IP range.",
        organisationName: "Platform",
        requestId: "req_sec_block_99",
        metadata: { attemptedEmail: "root@platform.io", reason: "INVALID_CREDENTIALS", failureCount: 3 },
      },
    },
    {
      eventId: "EVT-892107",
      actorName: "Vikram Malhotra (Super Admin)",
      actorType: "SUPER_ADMIN",
      module: "BILLING",
      action: "ORGANIZATION_PLAN_CHANGED",
      resourceName: "Infosys Technologies Subscription",
      organisationId: "2",
      severity: "INFO",
      result: "SUCCESS",
      ipAddress: "192.168.1.10",
      details: {
        description: "Upgraded subscription tier from Professional to Enterprise Ultra Plan.",
        organisationName: "Infosys Technologies",
        requestId: "req_bill_9901",
        oldValues: { plan: "Professional Plan", monthlyAmount: 499 },
        newValues: { plan: "Enterprise Ultra Plan", monthlyAmount: 999 },
        metadata: { billingCycle: "MONTHLY", autoRenew: true },
      },
    },
  ];

  for (const logItem of sampleAuditLogs) {
    await prisma.auditLog.upsert({
      where: { eventId: logItem.eventId },
      update: {
        action: logItem.action,
        result: logItem.result,
        severity: logItem.severity,
        details: logItem.details,
      },
      create: logItem,
    });
  }

  console.log("✅ Complete system seeding finished successfully!");
}

seedCompleteSystem()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
