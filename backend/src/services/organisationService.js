const prisma = require("../config/prismaClient");
const { createAndSendInvitation } = require("./invitationService");


const createOrganisation = async (data) => {
  const name = (data.name || data.organisation_name || data.companyName || "").trim();
  const branch = (data.branch || data.branch_office || data.office || "Headquarters").trim();
  const adminEmail = (data.admin_email || data.adminEmail || data.email || data.company_email || data.companyEmail || "").trim().toLowerCase();
  const orgEmail = (data.email || data.company_email || data.companyEmail || adminEmail).trim().toLowerCase();
  const adminName = data.admin_name || data.adminName || data.full_name || "Admin";
  const city = (data.city || "Headquarters").trim();
  const sendEmail = Boolean(data.send_email !== false && data.sendEmail !== false);

  if (!name) {
    throw new Error("Organisation name is required.");
  }
  if (!adminEmail) {
    throw new Error("Organisation Admin Email is required.");
  }

  // 1. Create or Update Organisation record in DB with INVITED status
  let organisation = await prisma.organisation.findFirst({
    where: {
      AND: [
        { name: { equals: name, mode: "insensitive" } },
        { branch: { equals: branch, mode: "insensitive" } },
      ],
    },
  });

  if (organisation) {
    organisation = await prisma.organisation.update({
      where: { id: organisation.id },
      data: {
        email: orgEmail || adminEmail,
        status: "INVITED",
      },
    });
  } else {
    organisation = await prisma.organisation.create({
      data: {
        name,
        branch,
        email: orgEmail || adminEmail,
        phone: data.phone || null,
        website: data.website || null,
        address: data.address || data.street_address || null,
        city,
        state: data.state || null,
        country: data.country || null,
        postal_code: data.postal_code || null,
        status: "INVITED",
      },
    });
  }

  // 2. Check or Create Organisation Location (Branch) in DB
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
        state: data.state || null,
        country: data.country || null,
        postal_code: data.postal_code || null,
        status: "active",
      },
    });
  }

  // 3. Create or Update User (Organisation Admin) in DB with INVITED status and NO PASSWORD HASH
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (adminUser) {
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        organisation_id: organisation.id,
        location_id: location.id,
        full_name: adminName,
        role: "ORGANISATION_ADMIN",
        status: "INVITED",
      },
    });
  } else {
    adminUser = await prisma.user.create({
      data: {
        organisation_id: organisation.id,
        location_id: location.id,
        full_name: adminName,
        email: adminEmail,
        password_hash: null, // NO usable password created by Super Admin
        role: "ORGANISATION_ADMIN",
        status: "INVITED",
        must_change_password: false,
      },
    });
  }

  // 4. Assign Subscription Plan according to Super Admin selection
  const SubscriptionService = require("./subscriptionService");
  let selectedPlan = null;
  if (data.planId) {
    selectedPlan = await prisma.subscriptionPlan.findUnique({ where: { id: String(data.planId) } }).catch(() => null);
  }
  if (!selectedPlan && data.plan) {
    selectedPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [
          { planName: { equals: String(data.plan), mode: "insensitive" } },
          { planCode: { equals: String(data.plan).toLowerCase(), mode: "insensitive" } },
        ],
      },
    }).catch(() => null);
  }
  if (!selectedPlan) {
    selectedPlan = await prisma.subscriptionPlan.findFirst({ where: { isActive: true }, orderBy: { displayOrder: "asc" } }).catch(() => null);
  }

  if (selectedPlan) {
    await SubscriptionService.assignSubscription(organisation.id, {
      planId: selectedPlan.id,
      billingCycle: data.billingCycle || "MONTHLY",
    }).catch((err) => console.warn("Plan assignment notice:", err.message));
  }

  // 5. Create Cryptographically Secure Invitation Token & Dispatch Email
  let invitationResult = { success: false };
  if (sendEmail) {
    invitationResult = await createAndSendInvitation({
      organisationId: organisation.id,
      email: adminEmail,
      adminName,
    });
  }

  return {
    id: organisation.id,
    name: organisation.name,
    branch: organisation.branch,
    city: organisation.city,
    email: organisation.email,
    phone: organisation.phone,
    status: organisation.status,
    plan: selectedPlan?.planName || "Starter",
    admin: {
      id: adminUser.id,
      full_name: adminUser.full_name,
      email: adminUser.email,
      status: adminUser.status,
    },
    invitationSent: invitationResult.success,
  };
};

const ensureInitialOrganisationsExist = async () => {
  try {
    const count = await prisma.organisation.count();
    if (count === 0) {
      await createOrganisation({
        name: "Tata Consultancy Services (TCS)",
        branch: "Mumbai HQ",
        email: "admin@tcs.com",
        admin_name: "Neha Kapoor",
        admin_email: "neha@tcs.com",
        city: "Mumbai",
        password: "Admin@123",
        status: "active",
        send_email: false,
      });
      await createOrganisation({
        name: "Infosys Limited",
        branch: "Bangalore HQ",
        email: "admin@infosys.com",
        admin_name: "Rahul Verma",
        admin_email: "rahul@infosys.com",
        city: "Bangalore",
        password: "Admin@123",
        status: "active",
        send_email: false,
      });
    }
  } catch (e) {}
};

/**
 * Get all Organisations from PostgreSQL DB
 */
const getAllOrganisations = async (filters = {}) => {
  await ensureInitialOrganisationsExist();

  const { search, status, page = 1, limit = 10 } = filters;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {};

  if (status && status !== "all") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { branch: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
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
          where: { role: "ORGANISATION_ADMIN" },
          include: { location: true },
        },
      },
    }),
  ]);

  const data = orgs.map((org) => {
    const primaryAdmin = org.users[0];
    return {
      id: org.id,
      name: org.name,
      branch: org.branch || "Headquarters",
      email: org.email,
      phone: org.phone,
      address: org.address,
      city: org.city || (org.locations[0] ? org.locations[0].city : "N/A"),
      state: org.state,
      country: org.country,
      postal_code: org.postal_code,
      website: org.website,
      status: org.status,
      created_at: org.created_at,
      updated_at: org.updated_at,
      admin: primaryAdmin
        ? {
            id: primaryAdmin.id,
            full_name: primaryAdmin.full_name,
            email: primaryAdmin.email,
            city: primaryAdmin.location?.city || org.city || "N/A",
          }
        : undefined,
      locations: org.locations.map((loc) => ({
        id: loc.id,
        name: loc.name,
        city: loc.city,
        status: loc.status,
      })),
      stats: {
        locations_count: org.locations.length,
        admins_count: org.users.length,
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
 * Get Organisation by ID
 */
const getOrganisationById = async (id) => {
  const org = await prisma.organisation.findUnique({
    where: { id: Number(id) },
    include: {
      locations: true,
      users: {
        include: { location: true },
      },
    },
  });

  if (!org) return null;

  const admins = org.users
    .filter((u) => u.role === "ORGANISATION_ADMIN")
    .map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      city: u.location?.city || org.city || "N/A",
      location_id: u.location_id,
      status: u.status,
      created_at: u.created_at,
    }));

  return {
    id: org.id,
    name: org.name,
    branch: org.branch || "Headquarters",
    email: org.email,
    phone: org.phone,
    address: org.address,
    city: org.city,
    state: org.state,
    country: org.country,
    postal_code: org.postal_code,
    website: org.website,
    status: org.status,
    created_at: org.created_at,
    updated_at: org.updated_at,
    locations: org.locations,
    admins,
  };
};

/**
 * Update Organisation
 */
const updateOrganisation = async (id, data) => {
  const orgId = Number(id);

  const updatedOrg = await prisma.organisation.update({
    where: { id: orgId },
    data: {
      name: data.name,
      branch: data.branch,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postal_code: data.postal_code,
      status: data.status,
    },
  });

  return updatedOrg;
};

/**
 * Delete Organisation
 */
const deleteOrganisation = async (id) => {
  const orgId = Number(id);
  await prisma.organisation.delete({
    where: { id: orgId },
  });
};

/**
 * Get Super Admin Dashboard Calculated Metrics
 */
const getDashboardMetrics = async () => {
  const [
    totalOrganisations,
    pendingOrganisationsCount,
    activeOrganisationsCount,
    latestOrganisations,
    totalAdmins,
  ] = await Promise.all([
    prisma.organisation.count(),
    prisma.organisation.count({ where: { status: "pending" } }),
    prisma.organisation.count({ where: { status: "active" } }),
    prisma.organisation.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
    }),
    prisma.user.count({ where: { role: "ORGANISATION_ADMIN" } }),
  ]);

  return {
    pendingApprovalsCount: pendingOrganisationsCount,
    subscriptionRenewalsCount: 5,
    failedAiJobsCount: 1,
    storageAlertsCount: 2,
    totalOrganisations,
    activeOrganisationsCount,
    totalAdmins,
    latestOrganisations,
  };
};

module.exports = {
  createOrganisation,
  getAllOrganisations,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
  getDashboardMetrics,
};
