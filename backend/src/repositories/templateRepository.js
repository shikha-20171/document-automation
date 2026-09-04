const prisma = require("../config/prismaClient");

/**
 * Template Repository
 * Handles DocumentTemplate, DocumentTemplateVersion, and DocumentTemplateField operations
 */

const findById = async (id) => {
  return await prisma.documentTemplate.findUnique({
    where: { id: String(id) },
    include: {
      versions: { orderBy: { version: "desc" } },
      fields: true,
      createdBy: { select: { id: true, full_name: true, email: true } },
    },
  });
};

const findByOrganisation = async (organisationId, { category, search, page = 1, limit = 20 } = {}) => {
  const where = { organisationId: Number(organisationId) };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [templates, total] = await Promise.all([
    prisma.documentTemplate.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      include: {
        fields: true,
        createdBy: { select: { id: true, full_name: true } },
      },
    }),
    prisma.documentTemplate.count({ where }),
  ]);

  return {
    templates,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

const create = async (templateData) => {
  return await prisma.documentTemplate.create({
    data: {
      organisationId: Number(templateData.organisationId),
      name: templateData.name,
      description: templateData.description || null,
      category: templateData.category || "General",
      bodyHtml: templateData.bodyHtml || "",
      bodyJson: templateData.bodyJson || null,
      createdById: Number(templateData.createdById),
      updatedById: Number(templateData.updatedById || templateData.createdById),
    },
  });
};

const update = async (id, updateData) => {
  const data = {};
  if (updateData.name !== undefined) data.name = updateData.name;
  if (updateData.description !== undefined) data.description = updateData.description;
  if (updateData.category !== undefined) data.category = updateData.category;
  if (updateData.bodyHtml !== undefined) data.bodyHtml = updateData.bodyHtml;
  if (updateData.bodyJson !== undefined) data.bodyJson = updateData.bodyJson;
  if (updateData.updatedById !== undefined) data.updatedById = Number(updateData.updatedById);

  return await prisma.documentTemplate.update({
    where: { id: String(id) },
    data,
  });
};

const deleteTemplate = async (id) => {
  return await prisma.documentTemplate.delete({
    where: { id: String(id) },
  });
};

/* Fields Management */
const createFields = async (templateId, fields = []) => {
  if (!fields.length) return [];
  return await prisma.documentTemplateField.createMany({
    data: fields.map((f) => ({
      templateId: String(templateId),
      name: f.name,
      label: f.label || f.name,
      type: f.type || "text",
      required: f.required ?? false,
      defaultValue: f.defaultValue || null,
      options: f.options || null,
    })),
  });
};

module.exports = {
  findById,
  findByOrganisation,
  create,
  update,
  deleteTemplate,
  createFields,
};
