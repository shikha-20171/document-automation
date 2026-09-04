const prisma = require("../config/prismaClient");

function safeModel(m) {
  return {
    id: m.id,
    providerId: m.providerId,
    providerName: m.provider?.providerName ?? null,
    providerCode: m.provider?.providerCode ?? null,
    modelName: m.modelName,
    modelCode: m.modelCode,
    modelVersion: m.modelVersion,
    description: m.description,
    contextWindow: m.contextWindow,
    maxInputTokens: m.maxInputTokens,
    maxOutputTokens: m.maxOutputTokens,
    inputCostPer1K: m.inputCostPer1K,
    outputCostPer1K: m.outputCostPer1K,
    supportsStreaming: m.supportsStreaming,
    supportsVision: m.supportsVision,
    supportsFunctionCalling: m.supportsFunctionCalling,
    supportsJSONMode: m.supportsJSONMode,
    status: m.status,
    isDefault: m.isDefault,
    totalRequests: m.totalRequests ? Number(m.totalRequests) : 0,
    assignedOrgsCount: m._count?.orgAssignments ?? 0,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

const aiModelService = {
  async getAll() {
    const models = await prisma.aIModel.findMany({
      include: {
        provider: { select: { providerName: true, providerCode: true } },
        _count: { select: { orgAssignments: true } },
      },
      orderBy: [{ providerId: "asc" }, { modelName: "asc" }],
    });
    return models.map(safeModel);
  },

  async getById(id) {
    const m = await prisma.aIModel.findUnique({
      where: { id },
      include: {
        provider: { select: { providerName: true, providerCode: true } },
        _count: { select: { orgAssignments: true } },
      },
    });
    if (!m) return null;
    return safeModel(m);
  },

  async create({ providerId, modelName, modelCode, modelVersion, description, contextWindow, maxInputTokens, maxOutputTokens, inputCostPer1K, outputCostPer1K, supportsVision, supportsFunctionCalling, supportsJSONMode, status, isDefault }) {
    const m = await prisma.aIModel.create({
      data: {
        providerId,
        modelName,
        modelCode,
        modelVersion,
        description,
        contextWindow,
        maxInputTokens,
        maxOutputTokens,
        inputCostPer1K,
        outputCostPer1K,
        supportsVision: !!supportsVision,
        supportsFunctionCalling: !!supportsFunctionCalling,
        supportsJSONMode: !!supportsJSONMode,
        status: status || "ACTIVE",
        isDefault: !!isDefault,
      },
      include: {
        provider: { select: { providerName: true, providerCode: true } },
        _count: { select: { orgAssignments: true } },
      },
    });
    return safeModel(m);
  },

  async update(id, data) {
    const { providerId, modelName, modelCode, modelVersion, description, contextWindow, maxInputTokens, maxOutputTokens, inputCostPer1K, outputCostPer1K, supportsVision, supportsFunctionCalling, supportsJSONMode, status, isDefault } = data;
    const m = await prisma.aIModel.update({
      where: { id },
      data: {
        providerId,
        modelName,
        modelCode,
        modelVersion,
        description,
        contextWindow,
        maxInputTokens,
        maxOutputTokens,
        inputCostPer1K,
        outputCostPer1K,
        supportsVision,
        supportsFunctionCalling,
        supportsJSONMode,
        status,
        isDefault,
      },
      include: {
        provider: { select: { providerName: true, providerCode: true } },
        _count: { select: { orgAssignments: true } },
      },
    });
    return safeModel(m);
  },

  async toggleStatus(id, status) {
    const m = await prisma.aIModel.update({
      where: { id },
      data: { status },
      include: {
        provider: { select: { providerName: true, providerCode: true } },
        _count: { select: { orgAssignments: true } },
      },
    });
    return safeModel(m);
  },

  async getOrgAssignments(modelId) {
    const assignments = await prisma.organizationAIModelAssignment.findMany({
      where: { modelId },
      include: { organisation: { select: { id: true, name: true, status: true } } },
    });
    return assignments.map((a) => ({
      id: a.id,
      organisationId: a.organisationId,
      orgName: a.organisation.name,
      orgStatus: a.organisation.status,
      status: a.status,
      assignedBy: a.assignedBy,
      createdAt: a.createdAt,
    }));
  },

  async saveOrgAssignments(modelId, organisationIds) {
    // Upsert all provided org IDs as ACTIVE, deactivate others
    await prisma.$transaction(async (tx) => {
      // Deactivate all existing
      await tx.organizationAIModelAssignment.updateMany({
        where: { modelId },
        data: { status: "INACTIVE" },
      });
      // Upsert provided ones as ACTIVE
      for (const organisationId of organisationIds) {
        await tx.organizationAIModelAssignment.upsert({
          where: { organisationId_modelId: { organisationId: Number(organisationId), modelId } },
          update: { status: "ACTIVE" },
          create: { organisationId: Number(organisationId), modelId, status: "ACTIVE" },
        });
      }
    });
    return aiModelService.getOrgAssignments(modelId);
  },
};

module.exports = aiModelService;
