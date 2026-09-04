const prisma = require("../config/prismaClient");

/**
 * User Repository
 * Handles all database operations for Users and Roles
 */

const findById = async (id) => {
  return await prisma.user.findUnique({
    where: { id: Number(id) },
    include: {
      organisation: true,
      location: true,
      userRole: true,
    },
  });
};

const findByEmail = async (email) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  return await prisma.user.findUnique({
    where: { email: cleanEmail },
    include: {
      organisation: true,
      location: true,
      userRole: true,
    },
  });
};

const findMany = async ({
  organisationId,
  role,
  status,
  search,
  page = 1,
  limit = 20,
} = {}) => {
  const where = {};

  if (organisationId) {
    where.organisation_id = Number(organisationId);
  }

  if (role) {
    where.role = { equals: role, mode: "insensitive" };
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        location: true,
        userRole: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

const create = async (userData) => {
  return await prisma.user.create({
    data: {
      full_name: userData.full_name,
      email: userData.email.trim().toLowerCase(),
      password_hash: userData.password_hash || null,
      role: userData.role || "STAFF",
      status: userData.status || "active",
      organisation_id: userData.organisation_id ? Number(userData.organisation_id) : null,
      location_id: userData.location_id ? Number(userData.location_id) : null,
      role_id: userData.role_id ? Number(userData.role_id) : null,
      must_change_password: userData.must_change_password ?? false,
    },
    include: {
      organisation: true,
      location: true,
    },
  });
};

const update = async (id, updateData) => {
  const data = {};

  if (updateData.full_name !== undefined) data.full_name = updateData.full_name;
  if (updateData.email !== undefined) data.email = updateData.email.trim().toLowerCase();
  if (updateData.password_hash !== undefined) data.password_hash = updateData.password_hash;
  if (updateData.role !== undefined) data.role = updateData.role;
  if (updateData.status !== undefined) data.status = updateData.status;
  if (updateData.organisation_id !== undefined) {
    data.organisation_id = updateData.organisation_id ? Number(updateData.organisation_id) : null;
  }
  if (updateData.location_id !== undefined) {
    data.location_id = updateData.location_id ? Number(updateData.location_id) : null;
  }
  if (updateData.must_change_password !== undefined) data.must_change_password = updateData.must_change_password;
  if (updateData.last_login !== undefined) data.last_login = updateData.last_login;

  return await prisma.user.update({
    where: { id: Number(id) },
    data,
  });
};

const deleteUser = async (id) => {
  return await prisma.user.delete({
    where: { id: Number(id) },
  });
};

const countByOrganisation = async (organisationId) => {
  return await prisma.user.count({
    where: { organisation_id: Number(organisationId) },
  });
};

const getUsersByRoles = async (organisationId, roles = []) => {
  return await prisma.user.findMany({
    where: {
      organisation_id: Number(organisationId),
      role: { in: roles },
      status: "active",
    },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
    },
  });
};

module.exports = {
  findById,
  findByEmail,
  findMany,
  create,
  update,
  deleteUser,
  countByOrganisation,
  getUsersByRoles,
};
