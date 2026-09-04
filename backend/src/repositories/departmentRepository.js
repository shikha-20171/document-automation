const prisma = require("../config/prismaClient");

/**
 * Department Repository
 * Handles all database operations for Departments
 */

const findById = async (id) => {
  return await prisma.department.findUnique({
    where: { id: Number(id) },
    include: { organisation: true },
  });
};

const findByOrganisation = async (organisationId) => {
  return await prisma.department.findMany({
    where: { organisation_id: Number(organisationId) },
    orderBy: { name: "asc" },
  });
};

const create = async ({ organisation_id, name, description, head, employees_count }) => {
  return await prisma.department.create({
    data: {
      organisation_id: Number(organisation_id),
      name: name.trim(),
      description: description || null,
      head: head || null,
      employees_count: employees_count ? Number(employees_count) : 0,
    },
  });
};

const update = async (id, updateData) => {
  const data = {};
  if (updateData.name !== undefined) data.name = updateData.name.trim();
  if (updateData.description !== undefined) data.description = updateData.description;
  if (updateData.head !== undefined) data.head = updateData.head;
  if (updateData.employees_count !== undefined) data.employees_count = Number(updateData.employees_count);

  return await prisma.department.update({
    where: { id: Number(id) },
    data,
  });
};

const deleteDepartment = async (id) => {
  return await prisma.department.delete({
    where: { id: Number(id) },
  });
};

const incrementEmployeeCount = async (id, amount = 1) => {
  return await prisma.department.update({
    where: { id: Number(id) },
    data: {
      employees_count: { increment: amount },
    },
  });
};

const decrementEmployeeCount = async (id, amount = 1) => {
  return await prisma.department.update({
    where: { id: Number(id) },
    data: {
      employees_count: { decrement: amount },
    },
  });
};

module.exports = {
  findById,
  findByOrganisation,
  create,
  update,
  deleteDepartment,
  incrementEmployeeCount,
  decrementEmployeeCount,
};
