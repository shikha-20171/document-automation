const prisma = require("../config/prismaClient");

/**
 * AI Model Repository
 * Handles AIModel and OrganizationAIModelAssignment database operations
 */

const findById = async (id) => {
  return await prisma.aIModel.findUnique({
    where: { id: String(id) },
    include: {
      provider: true,
      orgAssignments: { include: { organisation: true } },
    },
  });
};

const findAll = async ({ providerId, status, isDefault } = {}) => {
  const where = {};
  if (providerId) where.providerId = String(providerId);
  if (status) where.status = status;
  if (isDefault !== undefined) where.isDefault = Boolean(isDefault);

  return await prisma.aIModel.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { provider: true },
  });
};

const create = async (modelData) => {
  return await prisma.aIModel.create({
    data: {
      providerId: String(modelData.providerId),
      modelName: modelData.modelName,
      modelCode: modelData.modelCode,
      modelVersion: modelData.modelVersion || null,
      description: modelData.description || null,
      contextWindow: modelData.contextWindow ? Number(modelData.contextWindow) : null,
      maxInputTokens: modelData.maxInputTokens ? Number(modelData.maxInputTokens) : null,
      maxOutputTokens: modelData.maxOutputTokens ? Number(modelData.maxOutputTokens) : null,
      inputCostPer1K: modelData.inputCostPer1K ? Number(modelData.inputCostPer1K) : null,
      outputCostPer1K: modelData.outputCostPer1K ? Number(modelData.outputCostPer1K) : null,
      supportsStreaming: modelData.supportsStreaming ?? true,
      supportsVision: Boolean(modelData.supportsVision),
      supportsFunctionCalling: Boolean(modelData.supportsFunctionCalling),
      supportsJSONMode: Boolean(modelData.supportsJSONMode),
      supportsImageInput: Boolean(modelData.supportsImageInput),
      status: modelData.status || "ACTIVE",
      isDefault: Boolean(modelData.isDefault),
    },
  });
};

const update = async (id, updateData) => {
  return await prisma.aIModel.update({
    where: { id: String(id) },
    data: updateData,
  });
};

const deleteModel = async (id) => {
  return await prisma.aIModel.delete({
    where: { id: String(id) },
  });
};

/* Organisation Assignments */
const assignModelToOrg = async (organisationId, modelId, assignedBy = null) => {
  return await prisma.organizationAIModelAssignment.upsert({
    where: {
      organisationId_modelId: {
        organisationId: Number(organisationId),
        modelId: String(modelId),
      },
    },
    update: {
      status: "ACTIVE",
      assignedBy,
    },
    create: {
      organisationId: Number(organisationId),
      modelId: String(modelId),
      status: "ACTIVE",
      assignedBy,
    },
  });
};

const getOrgAssignedModels = async (organisationId) => {
  return await prisma.organizationAIModelAssignment.findMany({
    where: {
      organisationId: Number(organisationId),
      status: "ACTIVE",
    },
    include: {
      model: { include: { provider: true } },
    },
  });
};

module.exports = {
  findById,
  findAll,
  create,
  update,
  deleteModel,
  assignModelToOrg,
  getOrgAssignedModels,
};
