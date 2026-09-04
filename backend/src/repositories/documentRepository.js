const prisma = require("../config/prismaClient");

/**
 * Document Repository
 * Handles all database operations for Documents
 */

const findById = async (id) => {
  return await prisma.document.findUnique({
    where: { id: Number(id) },
    include: {
      organisation: true,
      approvalRequests: true,
    },
  });
};

const findMany = async ({
  organisationId,
  type,
  uploadedBy,
  search,
  page = 1,
  limit = 20,
} = {}) => {
  const where = {};

  if (organisationId) {
    where.organisation_id = Number(organisationId);
  }

  if (type) {
    where.type = { equals: type, mode: "insensitive" };
  }

  if (uploadedBy) {
    where.uploaded_by = uploadedBy;
  }

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    documents,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

const create = async (docData) => {
  return await prisma.document.create({
    data: {
      organisation_id: Number(docData.organisation_id),
      name: docData.name,
      type: docData.type || null,
      size: docData.size ? Number(docData.size) : 0,
      uploaded_by: docData.uploaded_by || null,
    },
  });
};

const update = async (id, updateData) => {
  const data = {};
  if (updateData.name !== undefined) data.name = updateData.name;
  if (updateData.type !== undefined) data.type = updateData.type;
  if (updateData.size !== undefined) data.size = Number(updateData.size);

  return await prisma.document.update({
    where: { id: Number(id) },
    data,
  });
};

const deleteDocument = async (id) => {
  return await prisma.document.delete({
    where: { id: Number(id) },
  });
};

const getTotalStorageUsage = async (organisationId) => {
  const aggregate = await prisma.document.aggregate({
    where: organisationId ? { organisation_id: Number(organisationId) } : {},
    _sum: { size: true },
    _count: { id: true },
  });

  return {
    totalSizeMB: aggregate._sum.size || 0,
    totalCount: aggregate._count.id || 0,
  };
};

module.exports = {
  findById,
  findMany,
  create,
  update,
  deleteDocument,
  getTotalStorageUsage,
};
