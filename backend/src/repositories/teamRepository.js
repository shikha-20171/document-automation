const prisma = require("../config/prismaClient");

/**
 * Team Repository
 * Handles all database operations for Teams
 */

const findById = async (id) => {
  return await prisma.team.findUnique({
    where: { id: Number(id) },
    include: { organisation: true },
  });
};

const findByOrganisation = async (organisationId, { department } = {}) => {
  const where = { organisation_id: Number(organisationId) };
  if (department) where.department = department;

  return await prisma.team.findMany({
    where,
    orderBy: { name: "asc" },
  });
};

const create = async ({ organisation_id, name, department, team_lead, members }) => {
  return await prisma.team.create({
    data: {
      organisation_id: Number(organisation_id),
      name: name.trim(),
      department: department || null,
      team_lead: team_lead || null,
      members: members ? Number(members) : 0,
    },
  });
};

const update = async (id, updateData) => {
  const data = {};
  if (updateData.name !== undefined) data.name = updateData.name.trim();
  if (updateData.department !== undefined) data.department = updateData.department;
  if (updateData.team_lead !== undefined) data.team_lead = updateData.team_lead;
  if (updateData.members !== undefined) data.members = Number(updateData.members);

  return await prisma.team.update({
    where: { id: Number(id) },
    data,
  });
};

const deleteTeam = async (id) => {
  return await prisma.team.delete({
    where: { id: Number(id) },
  });
};

module.exports = {
  findById,
  findByOrganisation,
  create,
  update,
  deleteTeam,
};
