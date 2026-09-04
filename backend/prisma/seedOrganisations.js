const prisma = require("../src/config/prismaClient");
const { hashPassword } = require("../src/utils/password");

async function seedRealOrganisations() {
  console.log("Seeding real organisations into PostgreSQL...");

  // 1. Ensure Super Admin Role & User
  let superAdminRole = await prisma.role.findFirst({ where: { name: "SUPER_ADMIN" } });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: { name: "SUPER_ADMIN", description: "Super Admin Platform Owner" },
    });
  }

  let orgAdminRole = await prisma.role.findFirst({ where: { name: "ORGANISATION_ADMIN" } });
  if (!orgAdminRole) {
    orgAdminRole = await prisma.role.create({
      data: { name: "ORGANISATION_ADMIN", description: "Organisation City Level Admin" },
    });
  }

  const passwordHash = await hashPassword("Admin@123");

  // 2. Create TCS Organisation
  let tcs = await prisma.organisation.findFirst({ where: { name: "TCS" } });
  if (!tcs) {
    tcs = await prisma.organisation.create({
      data: {
        name: "TCS",
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
  }

  // Seed Integrations for TCS
  await prisma.organisationIntegration.upsert({
    where: { organisationId_provider: { organisationId: tcs.id, provider: "GOOGLE_DRIVE" } },
    update: { status: "CONNECTED", accountEmail: "admin@tcs.com", lastSyncedAt: new Date() },
    create: {
      organisationId: tcs.id,
      provider: "GOOGLE_DRIVE",
      category: "STORAGE",
      status: "CONNECTED",
      accountName: "TCS Admin",
      accountEmail: "admin@tcs.com",
      connectedAt: new Date(),
      lastSyncedAt: new Date(),
    },
  });

  await prisma.organisationIntegration.upsert({
    where: { organisationId_provider: { organisationId: tcs.id, provider: "SLACK" } },
    update: { status: "CONNECTED", accountEmail: "admin@tcs.com", lastSyncedAt: new Date() },
    create: {
      organisationId: tcs.id,
      provider: "SLACK",
      category: "COMMUNICATION",
      status: "CONNECTED",
      accountName: "TCS Slack Workspace",
      accountEmail: "admin@tcs.com",
      connectedAt: new Date(),
      lastSyncedAt: new Date(),
    },
  });

  // TCS Locations
  const cities = [
    { city: "Mumbai", adminName: "Amit", adminEmail: "amit@tcs.com" },
    { city: "Pune", adminName: "Neha", adminEmail: "neha@tcs.com" },
    { city: "Bangalore", adminName: "Rahul", adminEmail: "rahul@tcs.com" },
    { city: "Hyderabad", adminName: "Sanjay", adminEmail: "sanjay@tcs.com" },
  ];

  for (const locItem of cities) {
    let loc = await prisma.organisationLocation.findFirst({
      where: { organisation_id: tcs.id, city: locItem.city },
    });
    if (!loc) {
      loc = await prisma.organisationLocation.create({
        data: {
          organisation_id: tcs.id,
          name: `TCS - ${locItem.city}`,
          city: locItem.city,
          status: "active",
        },
      });
    }

    let user = await prisma.user.findFirst({ where: { email: locItem.adminEmail } });
    if (!user) {
      await prisma.user.create({
        data: {
          organisation_id: tcs.id,
          location_id: loc.id,
          full_name: locItem.adminName,
          email: locItem.adminEmail,
          password_hash: passwordHash,
          role: "ORGANISATION_ADMIN",
          status: "active",
        },
      });
    }
  }

  console.log("Real organisations & demo integrations seeded successfully into PostgreSQL!");
}

seedRealOrganisations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
