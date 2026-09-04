const prisma = require("../config/prismaClient");

/**
 * Task Repository
 * Handles all database operations for Tasks
 */

const findById = async (id) => {
  return await prisma.task.findUnique({
    where: { id: String(id) },
    include: { organisation: true },
  });
};

const findMany = async ({
  organisationId,
  assignedToEmail,
  status,
  priority,
  page = 1,
  limit = 20,
} = {}) => {
  const where = {};
  if (organisationId) where.organisation_id = Number(organisationId);
  if (assignedToEmail) where.assigned_email = assignedToEmail;
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

const create = async (taskData) => {
  return await prisma.task.create({
    data: {
      organisation_id: Number(taskData.organisation_id),
      title: taskData.title,
      description: taskData.description || null,
      assigned_to: taskData.assigned_to || null,
      assigned_to_id: taskData.assigned_to_id || null,
      assigned_email: taskData.assigned_email || null,
      related_doc_id: taskData.related_doc_id || null,
      related_doc_name: taskData.related_doc_name || null,
      priority: taskData.priority || "NORMAL",
      status: taskData.status || "PENDING",
      start_date: taskData.start_date || null,
      due_date: taskData.due_date || null,
      instructions: taskData.instructions || null,
      team: taskData.team || null,
    },
  });
};

const update = async (id, updateData) => {
  return await prisma.task.update({
    where: { id: String(id) },
    data: updateData,
  });
};

const deleteTask = async (id) => {
  return await prisma.task.delete({
    where: { id: String(id) },
  });
};

module.exports = {
  findById,
  findMany,
  create,
  update,
  deleteTask,
};
