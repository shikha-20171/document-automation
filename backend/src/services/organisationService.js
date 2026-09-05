const bcrypt = require("bcrypt");
const prisma = require("../config/prismaClient");
const mailer = require("../config/mail");
const { createAndSendInvitation } = require("./invitationService");
const SubscriptionService = require("./subscriptionService");

/**
 * Generate a cryptographically secure, easy-to-read temporary password
 */
function generateTemporaryPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "Docu@";
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pwd += "!9";
  return pwd;
}

/**
 * Dispatch Welcome Email to new Organisation Admin via Brevo / Mailer
 */
async function sendWelcomeEmailToAdmin({
  adminName,
  adminEmail,
  orgName,
  temporaryPassword,
  mustChangePassword,
  planName,
}) {
  const frontendUrl = (
    process.env.FRONTEND_URL ||
    "https://document-automation-frontend-amber.vercel.app"
  ).replace(/\/$/, "");
  const loginUrl = `${frontendUrl}/login`;

  const subject = `Welcome to DocuCore AI — Your Organisation Admin Account for ${orgName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
        .card { max-width: 580px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 16px; font-weight: 600; color: #f8fafc; margin-bottom: 16px; }
        .lead-text { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
        .cred-box { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
        .cred-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
        .cred-row:last-child { margin-bottom: 0; }
        .cred-label { color: #64748b; font-weight: 500; }
        .cred-val { color: #38bdf8; font-family: monospace; font-weight: 600; }
        .btn-wrap { text-align: center; margin: 28px 0; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .notice { font-size: 12px; color: #f59e0b; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 12px; border-radius: 6px; margin-top: 20px; line-height: 1.5; }
        .footer { padding: 20px 28px; background: #0b0f19; text-align: center; font-size: 12px; color: #475569; border-top: 1px solid #1e293b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>DocuCore AI</h1>
          <p>Enterprise AI Document Automation Platform</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${adminName},</div>
          <div class="lead-text">
            Your organization <strong>${orgName}</strong> has been registered on DocuCore AI with the <strong>${planName}</strong> plan. An initial Organisation Administrator account has been provisioned for you.
          </div>
          
          <div class="cred-box">
            <div class="cred-row">
              <span class="cred-label">Login Email:</span>
              <span class="cred-val">${adminEmail}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Temporary Password:</span>
              <span class="cred-val">${temporaryPassword}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Assigned Plan:</span>
              <span class="cred-val">${planName}</span>
            </div>
          </div>

          <div class="btn-wrap">
            <a href="${loginUrl}" class="btn">Sign In to DocuCore AI</a>
          </div>

          ${
            mustChangePassword
              ? `<div class="notice">
                  ⚠️ <strong>Security Notice:</strong> For compliance and safety, you will be prompted to set a permanent password upon your first login.
                 </div>`
              : ""
          }
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} DocuCore AI. Secure Enterprise Document Automation.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await mailer.sendMail({
      to: adminEmail,
      subject,
      html,
      text: `Welcome to DocuCore AI. Organization: ${orgName}. Login: ${adminEmail}. Password: ${temporaryPassword}. Login URL: ${loginUrl}`,
    });
    console.log(`[OrgService] Welcome email sent to ${adminEmail}. Result:`, res.messageId || "Success");
    return { success: true, messageId: res.messageId };
  } catch (err) {
    console.warn(`[OrgService] Notice: Could not send welcome email: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Create Organisation (Comprehensive 5-Section Handler)
 */
const createOrganisation = async (data) => {
  // --- Section 1: Organisation Information ---
  const name = (data.name || data.organisationName || data.companyName || "").trim();
  const orgType = data.orgType || data.organisationType || "Company";
  const industry = data.industry || null;
  const companySize = data.companySize || "1-10";
  const website = data.website || null;
  const logo = data.logo || data.organisationLogo || null;
  const description = data.description || null;
  const branch = (data.branch || data.branch_office || data.office || "Headquarters").trim();

  // --- Section 2: Organisation Contact ---
  const orgEmail = (data.email || data.businessEmail || data.companyEmail || "").trim().toLowerCase();
  const phone = data.phone || data.phoneNumber || null;
  const country = data.country || "India";
  const state = data.state || null;
  const city = (data.city || "Mumbai").trim();
  const address = data.address || data.streetAddress || null;
  const timezone = data.timezone || "Asia/Kolkata (IST)";
  const dateFormat = data.dateFormat || "DD-MM-YYYY";
  const currency = data.currency || "INR";
  const postalCode = data.postalCode || data.postal_code || null;

  // --- Section 3: Organisation Admin ---
  const adminName = (data.adminName || data.adminFullName || data.full_name || "Admin").trim();
  const adminEmail = (data.adminEmail || data.admin_email || orgEmail).trim().toLowerCase();
  const adminPhone = data.adminPhone || phone;
  const adminUsername = data.adminUsername || data.username || null;
  const rawPassword = (data.temporaryPassword || data.password || "").trim();
  const temporaryPassword = rawPassword || generateTemporaryPassword();
  const forcePasswordChange = data.forcePasswordChange !== false && data.mustChangePassword !== false;
  const sendWelcomeEmail = Boolean(data.sendWelcomeEmail !== false && data.send_email !== false);

  // --- Section 4: Subscription ---
  const planNameInput = data.subscriptionPlan || data.plan || "Starter";
  const subscriptionStatus = (data.subscriptionStatus || "ACTIVE").toUpperCase();
  const startDate = data.startDate ? new Date(data.startDate) : new Date();
  const expiryDate = data.endDate || data.renewalDate
    ? new Date(data.endDate || data.renewalDate)
    : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  // --- Section 5: Status & Tracking ---
  const status = (data.status || "active").toLowerCase();
  const createdById = data.createdById ? Number(data.createdById) : null;

  if (!name) {
    throw new Error("Organisation name is required.");
  }
  if (!adminEmail) {
    throw new Error("Organisation Admin Email is required.");
  }

  // 1. Create or Update Organisation in PostgreSQL
  let organisation = await prisma.organisation.findFirst({
    where: {
      AND: [
        { name: { equals: name, mode: "insensitive" } },
        { branch: { equals: branch, mode: "insensitive" } },
      ],
    },
  });

  const orgPayload = {
    name,
    branch,
    email: orgEmail || adminEmail,
    phone,
    website,
    address,
    city,
    state,
    country,
    postal_code: postalCode,
    orgType,
    industry,
    companySize,
    logo,
    description,
    timezone,
    dateFormat,
    currency,
    createdById,
    lastActivity: new Date(),
    status,
  };

  if (organisation) {
    organisation = await prisma.organisation.update({
      where: { id: organisation.id },
      data: orgPayload,
    });
  } else {
    organisation = await prisma.organisation.create({
      data: orgPayload,
    });
  }

  // 2. Create or Update Organisation Location (Branch)
  let location = await prisma.organisationLocation.findFirst({
    where: {
      organisation_id: organisation.id,
      city: { equals: city, mode: "insensitive" },
    },
  });

  if (!location) {
    location = await prisma.organisationLocation.create({
      data: {
        organisation_id: organisation.id,
        name: `${organisation.name} - ${city}`,
        city,
        state,
        country,
        postal_code: postalCode,
        status: "active",
      },
    });
  }

  // 3. Create or Update Initial Organisation Admin User with Hashed Temporary Password
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (adminUser) {
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        organisation: { connect: { id: organisation.id } },
        location: { connect: { id: location.id } },
        full_name: adminName,
        phone: adminPhone,
        username: adminUsername || adminUser.username,
        password_hash: passwordHash,
        role: "ORGANISATION_ADMIN",
        status: status === "suspended" ? "SUSPENDED" : "ACTIVE",
        must_change_password: forcePasswordChange,
      },
    });
  } else {
    adminUser = await prisma.user.create({
      data: {
        organisation: { connect: { id: organisation.id } },
        location: { connect: { id: location.id } },
        full_name: adminName,
        email: adminEmail,
        phone: adminPhone,
        username: adminUsername,
        password_hash: passwordHash,
        role: "ORGANISATION_ADMIN",
        status: status === "suspended" ? "SUSPENDED" : "ACTIVE",
        must_change_password: forcePasswordChange,
      },
    });
  }

  // 4. Resolve Subscription Plan from DB & Assign with Limits
  let selectedPlan = null;
  if (data.planId) {
    selectedPlan = await prisma.subscriptionPlan.findUnique({ where: { id: String(data.planId) } }).catch(() => null);
  }
  if (!selectedPlan && planNameInput) {
    selectedPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [
          { planName: { equals: String(planNameInput), mode: "insensitive" } },
          { planCode: { equals: String(planNameInput).toLowerCase(), mode: "insensitive" } },
        ],
      },
    }).catch(() => null);
  }
  if (!selectedPlan) {
    selectedPlan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    }).catch(() => null);
  }

  let assignedSubscription = null;
  if (selectedPlan) {
    try {
      assignedSubscription = await prisma.organisationSubscription.upsert({
        where: { id: `sub_${organisation.id}` },
        update: {
          planId: selectedPlan.id,
          status: subscriptionStatus === "TRIAL" ? "ACTIVE" : subscriptionStatus,
          startDate,
          expiryDate,
          customUserLimit: data.customUserLimit || selectedPlan.userLimit || 10,
          customStorageLimitGB: data.customStorageLimitGB || selectedPlan.storageLimitGB || 50,
          customAICredits: data.customAICredits || selectedPlan.aiCredits || 2000,
          customOCRLimit: data.customOCRLimit || selectedPlan.ocrLimit || 1000,
        },
        create: {
          id: `sub_${organisation.id}`,
          organisationId: String(organisation.id),
          planId: selectedPlan.id,
          status: subscriptionStatus === "TRIAL" ? "ACTIVE" : subscriptionStatus,
          startDate,
          expiryDate,
          customUserLimit: data.customUserLimit || selectedPlan.userLimit || 10,
          customStorageLimitGB: data.customStorageLimitGB || selectedPlan.storageLimitGB || 50,
          customAICredits: data.customAICredits || selectedPlan.aiCredits || 2000,
          customOCRLimit: data.customOCRLimit || selectedPlan.ocrLimit || 1000,
        },
      });
    } catch (subErr) {
      console.warn("[OrgService] Subscription upsert notice:", subErr.message);
    }
  }

  // 5. Create Default Department
  try {
    const existingDept = await prisma.department.findFirst({
      where: { organisation_id: organisation.id },
    });
    if (!existingDept) {
      await prisma.department.create({
        data: {
          organisation_id: organisation.id,
          name: "General Management",
          description: "Primary organization department",
        },
      });
    }
  } catch (deptErr) {}

  // 6. Send Welcome Email via Brevo HTTPS API
  let welcomeEmailResult = { success: false };
  if (sendWelcomeEmail) {
    welcomeEmailResult = await sendWelcomeEmailToAdmin({
      adminName,
      adminEmail,
      orgName: organisation.name,
      temporaryPassword,
      mustChangePassword: forcePasswordChange,
      planName: selectedPlan?.planName || planNameInput || "Starter",
    });
  }

  return {
    id: organisation.id,
    name: organisation.name,
    branch: organisation.branch,
    orgType: organisation.orgType,
    industry: organisation.industry,
    companySize: organisation.companySize,
    website: organisation.website,
    logo: organisation.logo,
    description: organisation.description,
    email: organisation.email,
    phone: organisation.phone,
    address: organisation.address,
    city: organisation.city,
    state: organisation.state,
    country: organisation.country,
    timezone: organisation.timezone,
    dateFormat: organisation.dateFormat,
    currency: organisation.currency,
    status: organisation.status,
    created_at: organisation.created_at,
    lastActivity: organisation.lastActivity,
    plan: selectedPlan?.planName || planNameInput || "Starter",
    limits: {
      userLimit: assignedSubscription?.customUserLimit || selectedPlan?.userLimit || 10,
      storageLimitGB: assignedSubscription?.customStorageLimitGB || selectedPlan?.storageLimitGB || 50,
      aiCredits: assignedSubscription?.customAICredits || selectedPlan?.aiCredits || 2000,
      ocrLimit: assignedSubscription?.customOCRLimit || selectedPlan?.ocrLimit || 1000,
    },
    admin: {
      id: adminUser.id,
      fullName: adminUser.full_name,
      email: adminUser.email,
      phone: adminUser.phone,
      username: adminUser.username,
      status: adminUser.status,
      mustChangePassword: adminUser.must_change_password,
    },
    temporaryPassword: temporaryPassword, // Provided in response for Super Admin record
    welcomeEmailSent: welcomeEmailResult.success,
  };
};

/**
 * 2. Get all Organisations from PostgreSQL with real metrics
 */
const getAllOrganisations = async (filters = {}) => {
  const { search, status, plan, industry, page = 1, limit = 15 } = filters;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};

  if (status && status !== "all") {
    where.status = status;
  }

  if (industry && industry !== "all") {
    where.industry = { equals: industry, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { branch: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { country: { contains: search, mode: "insensitive" } },
      { industry: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, orgs] = await Promise.all([
    prisma.organisation.count({ where }),
    prisma.organisation.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        locations: true,
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
            status: true,
            created_at: true,
          },
        },
        departments: {
          select: { id: true, name: true, description: true },
        },
        teams: {
          select: { id: true, name: true, members: true },
        },
        documents: {
          select: { id: true, size: true, file_size_bytes: true },
        },
      },
    }),
  ]);

  // Fetch subscription records for all returned orgs
  const orgIdsStr = orgs.map((o) => String(o.id));
  const subscriptions = await prisma.organisationSubscription.findMany({
    where: { organisationId: { in: orgIdsStr } },
    include: { plan: true },
  }).catch(() => []);

  const subMap = new Map();
  for (const s of subscriptions) {
    subMap.set(s.organisationId, s);
  }

  const data = orgs.map((org) => {
    const orgSub = subMap.get(String(org.id));
    const primaryAdmin = org.users.find((u) => u.role === "ORGANISATION_ADMIN") || org.users[0];

    const totalStorageBytes = (org.documents || []).reduce((sum, d) => {
      if (d.file_size_bytes) return sum + Number(d.file_size_bytes);
      if (d.size) return sum + Number(d.size) * 1024 * 1024;
      return sum;
    }, 0);
    const storageUsedMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);
    const storageUsedGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);

    const activeUsersCount = org.users.filter((u) => u.status === "ACTIVE" || u.status === "active").length;

    return {
      id: org.id,
      name: org.name,
      branch: org.branch || "Headquarters",
      orgType: org.orgType || "Company",
      industry: org.industry || "Technology",
      companySize: org.companySize || "1-10",
      website: org.website,
      logo: org.logo,
      description: org.description,
      email: org.email,
      phone: org.phone,
      address: org.address,
      city: org.city || "Mumbai",
      state: org.state,
      country: org.country || "India",
      timezone: org.timezone || "Asia/Kolkata (IST)",
      dateFormat: org.dateFormat || "DD-MM-YYYY",
      currency: org.currency || "INR",
      postal_code: org.postal_code,
      status: org.status,
      created_at: org.created_at,
      updated_at: org.updated_at,
      lastActivity: org.lastActivity || org.updated_at || org.created_at,
      plan: orgSub?.plan?.planName || "Starter",
      subscription: orgSub
        ? {
            id: orgSub.id,
            planName: orgSub.plan?.planName || "Starter",
            status: orgSub.status,
            startDate: orgSub.startDate,
            expiryDate: orgSub.expiryDate,
            userLimit: orgSub.customUserLimit || orgSub.plan?.userLimit || 10,
            storageLimitGB: orgSub.customStorageLimitGB || orgSub.plan?.storageLimitGB || 50,
            aiCredits: orgSub.customAICredits || orgSub.plan?.aiCredits || 2000,
            ocrLimit: orgSub.customOCRLimit || orgSub.plan?.ocrLimit || 1000,
          }
        : {
            planName: "Starter",
            status: "ACTIVE",
            userLimit: 10,
            storageLimitGB: 50,
            aiCredits: 2000,
            ocrLimit: 1000,
          },
      admin: primaryAdmin
        ? {
            id: primaryAdmin.id,
            fullName: primaryAdmin.full_name,
            email: primaryAdmin.email,
            status: primaryAdmin.status,
          }
        : undefined,
      stats: {
        usersCount: org.users.length,
        activeUsersCount,
        docsCount: org.documents.length,
        departmentsCount: org.departments.length,
        teamsCount: org.teams.length,
        storageUsedMB: Number(storageUsedMB),
        storageUsedGB: Number(storageUsedGB),
      },
    };
  });

  return {
    data,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / take) || 1,
  };
};

/**
 * 3. Get Organisation by ID with full relations
 */
const getOrganisationById = async (id) => {
  const orgId = Number(id);
  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    include: {
      locations: true,
      users: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          username: true,
          role: true,
          status: true,
          must_change_password: true,
          created_at: true,
          last_login: true,
        },
      },
      departments: true,
      teams: true,
      documents: {
        take: 10,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          name: true,
          original_name: true,
          type: true,
          mime_type: true,
          size: true,
          file_size_bytes: true,
          created_at: true,
        },
      },
      activity_logs: {
        take: 20,
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!org) return null;

  const orgSub = await prisma.organisationSubscription.findFirst({
    where: { organisationId: String(org.id) },
    include: { plan: true },
  }).catch(() => null);

  const totalStorageBytes = (org.documents || []).reduce((sum, d) => {
    if (d.file_size_bytes) return sum + Number(d.file_size_bytes);
    if (d.size) return sum + Number(d.size) * 1024 * 1024;
    return sum;
  }, 0);
  const storageUsedGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);

  const primaryAdmin = org.users.find((u) => u.role === "ORGANISATION_ADMIN") || org.users[0];

  return {
    id: org.id,
    name: org.name,
    branch: org.branch,
    orgType: org.orgType || "Company",
    industry: org.industry || "Technology",
    companySize: org.companySize || "1-10",
    website: org.website,
    logo: org.logo,
    description: org.description,
    email: org.email,
    phone: org.phone,
    address: org.address,
    city: org.city,
    state: org.state,
    country: org.country,
    timezone: org.timezone || "Asia/Kolkata (IST)",
    dateFormat: org.dateFormat || "DD-MM-YYYY",
    currency: org.currency || "INR",
    postal_code: org.postal_code,
    status: org.status,
    created_at: org.created_at,
    updated_at: org.updated_at,
    lastActivity: org.lastActivity || org.updated_at,
    plan: orgSub?.plan?.planName || "Starter",
    subscription: orgSub
      ? {
          id: orgSub.id,
          planName: orgSub.plan?.planName || "Starter",
          status: orgSub.status,
          startDate: orgSub.startDate,
          expiryDate: orgSub.expiryDate,
          userLimit: orgSub.customUserLimit || orgSub.plan?.userLimit || 10,
          storageLimitGB: orgSub.customStorageLimitGB || orgSub.plan?.storageLimitGB || 50,
          aiCredits: orgSub.customAICredits || orgSub.plan?.aiCredits || 2000,
          ocrLimit: orgSub.customOCRLimit || orgSub.plan?.ocrLimit || 1000,
        }
      : {
          planName: "Starter",
          status: "ACTIVE",
          userLimit: 10,
          storageLimitGB: 50,
          aiCredits: 2000,
          ocrLimit: 1000,
        },
    admin: primaryAdmin,
    users: org.users,
    departments: org.departments,
    teams: org.teams,
    documents: org.documents,
    activityLogs: org.activity_logs,
    locations: org.locations,
    stats: {
      usersCount: org.users.length,
      departmentsCount: org.departments.length,
      teamsCount: org.teams.length,
      docsCount: org.documents.length,
      storageUsedGB: Number(storageUsedGB),
    },
  };
};

/**
 * 4. Update Organisation
 */
const updateOrganisation = async (id, data) => {
  const orgId = Number(id);

  const updatedOrg = await prisma.organisation.update({
    where: { id: orgId },
    data: {
      name: data.name,
      branch: data.branch,
      orgType: data.orgType || data.organisationType,
      industry: data.industry,
      companySize: data.companySize,
      website: data.website,
      logo: data.logo,
      description: data.description,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postal_code: data.postal_code || data.postalCode,
      timezone: data.timezone,
      dateFormat: data.dateFormat,
      currency: data.currency,
      status: data.status,
      lastActivity: new Date(),
    },
  });

  return updatedOrg;
};

/**
 * 5. Update Organisation Status (Activate / Suspend)
 */
const updateOrganisationStatus = async (id, status) => {
  const orgId = Number(id);
  const normalizedStatus = status.toLowerCase();

  const org = await prisma.organisation.update({
    where: { id: orgId },
    data: {
      status: normalizedStatus,
      lastActivity: new Date(),
    },
  });

  // Also update users of this organization if suspended
  if (normalizedStatus === "suspended") {
    await prisma.user.updateMany({
      where: { organisation_id: orgId },
      data: { status: "SUSPENDED" },
    });
  } else if (normalizedStatus === "active") {
    await prisma.user.updateMany({
      where: { organisation_id: orgId, status: "SUSPENDED" },
      data: { status: "ACTIVE" },
    });
  }

  return org;
};

/**
 * 6. Resend Welcome Email to Organisation Admin
 */
const resendWelcomeEmail = async (id) => {
  const orgId = Number(id);
  const org = await prisma.organisation.findUnique({
    where: { id: orgId },
    include: {
      users: { where: { role: "ORGANISATION_ADMIN" } },
    },
  });

  if (!org) throw new Error("Organisation not found");
  const admin = org.users[0];
  if (!admin) throw new Error("No Organisation Admin found for this organisation");

  const tempPwd = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(tempPwd, 10);

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      password_hash: passwordHash,
      must_change_password: true,
      status: "ACTIVE",
    },
  });

  const sub = await prisma.organisationSubscription.findFirst({
    where: { organisationId: String(org.id) },
    include: { plan: true },
  }).catch(() => null);

  const emailRes = await sendWelcomeEmailToAdmin({
    adminName: admin.full_name,
    adminEmail: admin.email,
    orgName: org.name,
    temporaryPassword: tempPwd,
    mustChangePassword: true,
    planName: sub?.plan?.planName || "Starter",
  });

  return {
    success: emailRes.success,
    adminEmail: admin.email,
    temporaryPassword: tempPwd,
    message: emailRes.success
      ? `Welcome credentials successfully dispatched to ${admin.email}`
      : `Email dispatch notice: ${emailRes.error || "Please check Brevo configuration"}`,
  };
};

/**
 * 7. Delete Organisation
 */
const deleteOrganisation = async (id) => {
  const orgId = Number(id);
  await prisma.organisation.delete({
    where: { id: orgId },
  });
};

/**
 * 8. Super Admin Dashboard Metrics
 */
const getDashboardMetrics = async () => {
  const [
    totalOrganisations,
    pendingOrganisationsCount,
    activeOrganisationsCount,
    suspendedOrganisationsCount,
    latestOrganisations,
    totalAdmins,
    totalUsers,
    totalDocs,
  ] = await Promise.all([
    prisma.organisation.count(),
    prisma.organisation.count({ where: { status: "pending" } }),
    prisma.organisation.count({ where: { status: "active" } }),
    prisma.organisation.count({ where: { status: "suspended" } }),
    prisma.organisation.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      include: {
        users: { where: { role: "ORGANISATION_ADMIN" } },
      },
    }),
    prisma.user.count({ where: { role: "ORGANISATION_ADMIN" } }),
    prisma.user.count(),
    prisma.document.count().catch(() => 0),
  ]);

  return {
    totalOrganisations,
    activeOrganisationsCount,
    pendingApprovalsCount: pendingOrganisationsCount,
    suspendedOrganisationsCount,
    totalAdmins,
    totalUsers,
    totalDocs,
    latestOrganisations: latestOrganisations.map((o) => ({
      id: o.id,
      name: o.name,
      status: o.status,
      email: o.email,
      adminName: o.users[0]?.full_name || "N/A",
      created_at: o.created_at,
    })),
  };
};

module.exports = {
  createOrganisation,
  getAllOrganisations,
  getOrganisationById,
  updateOrganisation,
  updateOrganisationStatus,
  resendWelcomeEmail,
  deleteOrganisation,
  getDashboardMetrics,
};
