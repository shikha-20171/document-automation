const prisma = require("../config/prismaClient");
const { hashPassword } = require("../utils/password");
const { sendAdminCredentialsEmail } = require("./emailService");

/**
 * Create Organisation Admin for an existing or specified Organisation under a specific City/Location.
 */
const createOrganisationAdmin = async (data) => {
  const {
    organisation_id,
    organisation_name,
    admin_name,
    admin_email,
    city,
    password = "TempPass123!",
    status = "active",
    send_email = true,
  } = data;

  const cleanEmail = (admin_email || "").trim().toLowerCase();
  const cleanCity = (city || "Headquarters").trim();

  if (!cleanEmail) {
    throw new Error("Admin email address is required.");
  }

  // 1. Find or Create Organisation in PostgreSQL DB
  let organisation;
  if (organisation_id && !isNaN(Number(organisation_id))) {
    organisation = await prisma.organisation.findUnique({
      where: { id: Number(organisation_id) },
    });
  }

  if (!organisation && organisation_name) {
    organisation = await prisma.organisation.findFirst({
      where: { name: { equals: organisation_name.trim(), mode: "insensitive" } },
    });
  }

  if (!organisation) {
    const orgName = organisation_name || "Customer Organization";
    organisation = await prisma.organisation.create({
      data: {
        name: orgName,
        branch: `${cleanCity} HQ`,
        email: cleanEmail,
        city: cleanCity,
        status: status,
      },
    });
  }

  // 2. Find or Create Location for this City under the Organisation
  let location = await prisma.organisationLocation.findFirst({
    where: {
      organisation_id: organisation.id,
      city: { equals: cleanCity, mode: "insensitive" },
    },
  });

  if (!location) {
    location = await prisma.organisationLocation.create({
      data: {
        organisation_id: organisation.id,
        name: `${organisation.name} - ${cleanCity}`,
        city: cleanCity,
        status: status,
      },
    });
  }

  // 3. Hash password
  const passwordHash = await hashPassword(password);

  // 4. Upsert Organisation Admin User in PostgreSQL DB
  let user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        organisation_id: organisation.id,
        location_id: location.id,
        full_name: admin_name || user.full_name,
        password_hash: passwordHash,
        role: "ORGANISATION_ADMIN",
        status: status,
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        organisation_id: organisation.id,
        location_id: location.id,
        full_name: admin_name || "Organisation Admin",
        email: cleanEmail,
        password_hash: passwordHash,
        role: "ORGANIZATION_ADMIN",
        status: status,
        must_change_password: true,
      },
    });
  }

  // 5. Send credentials email via Gmail SMTP
  let emailSent = false;
  if (send_email) {
    const mailResult = await sendAdminCredentialsEmail({
      adminName: user.full_name,
      organisationName: organisation.name,
      branch: `${cleanCity} Branch`,
      city: cleanCity,
      adminEmail: cleanEmail,
      password: password,
    });
    emailSent = mailResult.success;
  }

  return {
    id: user.id,
    organisation_id: organisation.id,
    organisation_name: organisation.name,
    admin_name: user.full_name,
    email: user.email,
    city: cleanCity,
    location_id: location.id,
    status: user.status,
    created_at: user.created_at,
    email_sent: emailSent,
  };
};

/**
 * Get flat list of Organisation Admins for the Super Admin Organisation Page Table view.
 */
const getAllOrganisationAdmins = async (filters = {}) => {
  const { search, status, page = 1, limit = 10, organisation_id } = filters;
  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where = {
    role: { in: ["ORGANISATION_ADMIN", "ORGANIZATION_ADMIN"] },
  };

  if (organisation_id) {
    where.organisation_id = Number(organisation_id);
  }

  if (status && status !== "all") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { organisation: { name: { contains: search, mode: "insensitive" } } },
      { location: { city: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        organisation: true,
        location: true,
      },
    }),
  ]);

  const data = users.map((user) => ({
    id: user.id,
    organisation_id: user.organisation_id,
    organisation_name: user.organisation?.name || "N/A",
    admin_name: user.full_name,
    full_name: user.full_name,
    email: user.email,
    city: user.location?.city || user.organisation?.city || "N/A",
    location_id: user.location_id,
    status: user.status,
    created_at: user.created_at,
  }));

  return {
    data,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / take) || 1,
  };
};

const getOrganisationAdminById = async (id) => {
  const user = await prisma.user.findFirst({
    where: { id: Number(id), role: "ORGANISATION_ADMIN" },
    include: { organisation: true, location: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    organisation_id: user.organisation_id,
    organisation_name: user.organisation?.name || "N/A",
    admin_name: user.full_name,
    full_name: user.full_name,
    email: user.email,
    city: user.location?.city || "N/A",
    location_id: user.location_id,
    status: user.status,
    created_at: user.created_at,
  };
};

const updateOrganisationAdmin = async (id, data) => {
  const adminId = Number(id);
  const existingUser = await prisma.user.findFirst({
    where: { id: adminId, role: "ORGANISATION_ADMIN" },
  });

  if (!existingUser) {
    throw new Error("Organisation Admin not found.");
  }

  const updateData = {};
  if (data.admin_name) updateData.full_name = data.admin_name;
  if (data.status) updateData.status = data.status;

  if (data.city && existingUser.organisation_id) {
    const cleanCity = data.city.trim();
    let location = await prisma.organisationLocation.findFirst({
      where: {
        organisation_id: existingUser.organisation_id,
        city: { equals: cleanCity, mode: "insensitive" },
      },
    });

    if (!location) {
      location = await prisma.organisationLocation.create({
        data: {
          organisation_id: existingUser.organisation_id,
          city: cleanCity,
          status: "active",
        },
      });
    }
    updateData.location_id = location.id;
  }

  const updatedUser = await prisma.user.update({
    where: { id: adminId },
    data: updateData,
    include: { organisation: true, location: true },
  });

  return {
    id: updatedUser.id,
    organisation_id: updatedUser.organisation_id,
    organisation_name: updatedUser.organisation?.name || "N/A",
    admin_name: updatedUser.full_name,
    full_name: updatedUser.full_name,
    email: updatedUser.email,
    city: updatedUser.location?.city || "N/A",
    location_id: updatedUser.location_id,
    status: updatedUser.status,
    updated_at: updatedUser.updated_at,
  };
};

const sendCredentialsEmail = async (id, temporaryPassword) => {
  const adminId = Number(id);
  const user = await prisma.user.findFirst({
    where: { id: adminId, role: "ORGANISATION_ADMIN" },
    include: { organisation: true, location: true },
  });

  if (!user) {
    throw new Error("Organisation Admin not found.");
  }

  const passwordToSend = temporaryPassword || "TempAdmin@123";

  const mailResult = await sendAdminCredentialsEmail({
    adminName: user.full_name,
    organisationName: user.organisation?.name || "Organisation",
    city: user.location?.city || "Default Location",
    adminEmail: user.email,
    password: passwordToSend,
  });

  if (!mailResult.success) {
    throw new Error(mailResult.error || "Failed to send email to " + user.email);
  }

  return {
    success: true,
    message: `Credentials email successfully sent to ${user.email}`,
  };
};

const deleteOrganisationAdmin = async (id) => {
  const adminId = Number(id);
  const existingUser = await prisma.user.findFirst({
    where: { id: adminId, role: "ORGANISATION_ADMIN" },
  });

  if (!existingUser) {
    throw new Error("Organisation Admin not found.");
  }

  await prisma.user.delete({ where: { id: adminId } });
};

module.exports = {
  createOrganisationAdmin,
  getAllOrganisationAdmins,
  getOrganisationAdminById,
  updateOrganisationAdmin,
  sendCredentialsEmail,
  deleteOrganisationAdmin,
};
