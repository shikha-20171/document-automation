const prisma = require("../config/prismaClient");
const pool = require("../config/db");

/**
 * Organisation Repository
 * Handles all database operations for Organisations and Locations
 */

/* ---------- Find Organisation By Email ---------- */
const findOrganisationByEmail = async (email) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  try {
    return await prisma.organisation.findFirst({
      where: { email: cleanEmail },
      include: {
        locations: true,
        _count: {
          select: { users: true, departments: true, teams: true, documents: true },
        },
      },
    });
  } catch (err) {
    const result = await pool.query(
      "SELECT * FROM organisations WHERE LOWER(email) = $1 OR LOWER(company_email) = $1 LIMIT 1",
      [cleanEmail]
    );
    return result.rows[0];
  }
};

/* ---------- Find By Id ---------- */
const getOrganisationById = async (id) => {
  try {
    return await prisma.organisation.findUnique({
      where: { id: Number(id) },
      include: {
        locations: true,
        _count: {
          select: { users: true, departments: true, teams: true, documents: true },
        },
      },
    });
  } catch (err) {
    const result = await pool.query("SELECT * FROM organisations WHERE id = $1", [Number(id)]);
    return result.rows[0];
  }
};

/* ---------- Get All Organisations ---------- */
const getAllOrganisations = async ({ page = 1, limit = 50, search, status } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  try {
    const [organisations, total] = await Promise.all([
      prisma.organisation.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: "desc" },
        include: {
          locations: true,
          _count: {
            select: { users: true, departments: true, teams: true, documents: true },
          },
        },
      }),
      prisma.organisation.count({ where }),
    ]);

    return {
      organisations,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    const result = await pool.query("SELECT * FROM organisations ORDER BY created_at DESC");
    return { organisations: result.rows, total: result.rows.length };
  }
};

/* ---------- Create Organisation ---------- */
const createOrganisation = async (organisationData) => {
  return await prisma.organisation.create({
    data: {
      name: organisationData.name || organisationData.organisation_name,
      branch: organisationData.branch || "Headquarters",
      email: (organisationData.email || organisationData.company_email).trim().toLowerCase(),
      phone: organisationData.phone || organisationData.phone_number || null,
      website: organisationData.website || null,
      address: organisationData.address || organisationData.street_address || null,
      city: organisationData.city || null,
      state: organisationData.state || null,
      country: organisationData.country || null,
      postal_code: organisationData.postal_code || null,
      status: organisationData.status || "active",
    },
  });
};

/* ---------- Update Organisation ---------- */
const updateOrganisation = async (id, data) => {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.organisation_name !== undefined) updateData.name = data.organisation_name;
  if (data.branch !== undefined) updateData.branch = data.branch;
  if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
  if (data.company_email !== undefined) updateData.email = data.company_email.trim().toLowerCase();
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.phone_number !== undefined) updateData.phone = data.phone_number;
  if (data.website !== undefined) updateData.website = data.website;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.street_address !== undefined) updateData.address = data.street_address;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.state !== undefined) updateData.state = data.state;
  if (data.country !== undefined) updateData.country = data.country;
  if (data.postal_code !== undefined) updateData.postal_code = data.postal_code;
  if (data.status !== undefined) updateData.status = data.status;

  return await prisma.organisation.update({
    where: { id: Number(id) },
    data: updateData,
  });
};

/* ---------- Update Status ---------- */
const updateOrganisationStatus = async (id, status) => {
  return await prisma.organisation.update({
    where: { id: Number(id) },
    data: { status },
  });
};

/* ---------- Delete Organisation ---------- */
const deleteOrganisation = async (id) => {
  return await prisma.organisation.delete({
    where: { id: Number(id) },
  });
};

/* ---------- Locations Management ---------- */
const addLocation = async (organisationId, locationData) => {
  return await prisma.organisationLocation.create({
    data: {
      organisation_id: Number(organisationId),
      name: locationData.name || null,
      city: locationData.city,
      state: locationData.state || null,
      country: locationData.country || null,
      postal_code: locationData.postal_code || null,
      status: locationData.status || "active",
    },
  });
};

const getLocations = async (organisationId) => {
  return await prisma.organisationLocation.findMany({
    where: { organisation_id: Number(organisationId) },
    include: {
      _count: { select: { users: true } },
    },
  });
};

module.exports = {
  findOrganisationByEmail,
  getOrganisationById,
  getAllOrganisations,
  createOrganisation,
  updateOrganisation,
  updateOrganisationStatus,
  deleteOrganisation,
  addLocation,
  getLocations,
};