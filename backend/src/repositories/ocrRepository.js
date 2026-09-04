const prisma = require("../config/prismaClient");

/**
 * OCR Repository
 * Handles OCREngine and OCRRequest database operations
 */

const findEngines = async ({ status } = {}) => {
  const where = {};
  if (status) where.status = status;

  return await prisma.oCREngine.findMany({
    where,
    orderBy: { engineName: "asc" },
  });
};

const findEngineById = async (id) => {
  return await prisma.oCREngine.findUnique({
    where: { id: String(id) },
  });
};

const createEngine = async (engineData) => {
  return await prisma.oCREngine.create({
    data: {
      engineName: engineData.engineName,
      engineCode: engineData.engineCode.toLowerCase().replace(/\s+/g, "_"),
      provider: engineData.provider,
      description: engineData.description || null,
      supportedLanguages: Number(engineData.supportedLanguages || 1),
      accuracy: engineData.accuracy ? Number(engineData.accuracy) : null,
      averageResponseMs: engineData.averageResponseMs ? Number(engineData.averageResponseMs) : null,
      status: engineData.status || "ACTIVE",
      isDefault: Boolean(engineData.isDefault),
      supportsHandwriting: Boolean(engineData.supportsHandwriting),
      supportsTables: Boolean(engineData.supportsTables),
      supportsForms: Boolean(engineData.supportsForms),
      supportsMultiPage: engineData.supportsMultiPage ?? true,
      version: engineData.version || null,
    },
  });
};

/* OCR Requests */
const createRequest = async (requestData) => {
  return await prisma.oCRRequest.create({
    data: {
      requestCode: requestData.requestCode || `OCR-${Date.now()}`,
      organisationId: String(requestData.organisationId),
      documentId: requestData.documentId ? String(requestData.documentId) : null,
      engineId: String(requestData.engineId),
      requestedBy: requestData.requestedBy || null,
      fileName: requestData.fileName,
      fileType: requestData.fileType || null,
      fileSizeMB: requestData.fileSizeMB ? Number(requestData.fileSizeMB) : null,
      language: requestData.language || "eng",
      status: requestData.status || "QUEUED",
    },
  });
};

const updateRequestStatus = async (id, status, extra = {}) => {
  const data = { status };
  if (status === "PROCESSING") data.startedAt = new Date();
  if (["SUCCESS", "FAILED", "CANCELLED"].includes(status)) data.completedAt = new Date();
  if (extra.confidence) data.confidence = Number(extra.confidence);
  if (extra.extractedPages) data.extractedPages = Number(extra.extractedPages);
  if (extra.processingTimeMs) data.processingTimeMs = Number(extra.processingTimeMs);
  if (extra.errorMessage) data.errorMessage = extra.errorMessage;

  return await prisma.oCRRequest.update({
    where: { id: String(id) },
    data,
  });
};

const getRequests = async ({ organisationId, status, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (organisationId) where.organisationId = String(organisationId);
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [requests, total] = await Promise.all([
    prisma.oCRRequest.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { engine: true },
    }),
    prisma.oCRRequest.count({ where }),
  ]);

  return {
    requests,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = {
  findEngines,
  findEngineById,
  createEngine,
  createRequest,
  updateRequestStatus,
  getRequests,
};
