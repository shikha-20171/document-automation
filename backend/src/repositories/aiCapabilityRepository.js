const prisma = require("../config/prismaClient");

const findAll = async ({ status } = {}) => {
  const where = {};
  if (status) where.status = status;
  return await prisma.aICapability.findMany({
    where,
    orderBy: { name: "asc" },
  });
};

const findById = async (id) => {
  return await prisma.aICapability.findUnique({
    where: { id: String(id) },
  });
};

const findByCode = async (code) => {
  return await prisma.aICapability.findUnique({
    where: { code: String(code) },
  });
};

const create = async (data) => {
  return await prisma.aICapability.create({
    data: {
      name: data.name,
      code: data.code.toLowerCase().replace(/\s+/g, "_"),
      description: data.description || null,
      defaultModel: data.defaultModel || "gemini-3.5-flash",
      fallbackModel: data.fallbackModel || "gpt-4o-mini",
      maxTokens: data.maxTokens ? Number(data.maxTokens) : 4096,
      temperature: data.temperature !== undefined ? Number(data.temperature) : 0.3,
      systemPrompt: data.systemPrompt || null,
      status: data.status || "ACTIVE",
    },
  });
};

const update = async (id, data) => {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.defaultModel !== undefined) updateData.defaultModel = data.defaultModel;
  if (data.fallbackModel !== undefined) updateData.fallbackModel = data.fallbackModel;
  if (data.maxTokens !== undefined) updateData.maxTokens = Number(data.maxTokens);
  if (data.temperature !== undefined) updateData.temperature = Number(data.temperature);
  if (data.systemPrompt !== undefined) updateData.systemPrompt = data.systemPrompt;
  if (data.status !== undefined) updateData.status = data.status;

  return await prisma.aICapability.update({
    where: { id: String(id) },
    data: updateData,
  });
};

const deleteCapability = async (id) => {
  return await prisma.aICapability.delete({
    where: { id: String(id) },
  });
};

module.exports = {
  findAll,
  findById,
  findByCode,
  create,
  update,
  deleteCapability,
};
