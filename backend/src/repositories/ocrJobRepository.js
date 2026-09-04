const prisma = require("../config/prismaClient");

const findAll = async ({ organisationId, status, providerId, limit = 50, skip = 0 } = {}) => {
  const where = {};
  if (organisationId) where.organisationId = String(organisationId);
  if (status) where.status = status;
  if (providerId) where.providerId = String(providerId);

  const [jobs, total] = await Promise.all([
    prisma.oCRJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(skip),
      include: {
        provider: { select: { providerName: true, providerCode: true } },
        profile: { select: { profileName: true, profileCode: true } },
      },
    }),
    prisma.oCRJob.count({ where }),
  ]);

  return { jobs, total };
};

const findById = async (id) => {
  return await prisma.oCRJob.findUnique({
    where: { id: String(id) },
    include: {
      provider: true,
      profile: true,
    },
  });
};

const create = async (data) => {
  return await prisma.oCRJob.create({
    data: {
      jobCode: data.jobCode || `OCR-${Date.now()}`,
      organisationId: String(data.organisationId || 1),
      userId: data.userId ? String(data.userId) : null,
      documentId: data.documentId ? String(data.documentId) : null,
      documentName: data.documentName || "document.pdf",
      providerId: data.providerId ? String(data.providerId) : null,
      profileId: data.profileId ? String(data.profileId) : null,
      language: data.language || "eng",
      pages: data.pages ? Number(data.pages) : 1,
      status: data.status || "QUEUED",
      confidenceScore: data.confidenceScore ? Number(data.confidenceScore) : null,
      processingTimeMs: data.processingTimeMs ? Number(data.processingTimeMs) : null,
      errorMessage: data.errorMessage || null,
      startedAt: data.startedAt || new Date(),
    },
    include: {
      provider: true,
      profile: true,
    },
  });
};

const updateStatus = async (id, status, extra = {}) => {
  const data = { status };
  if (status === "PROCESSING") data.startedAt = new Date();
  if (["COMPLETED", "FAILED", "CANCELLED"].includes(status)) data.completedAt = new Date();
  if (extra.confidenceScore !== undefined) data.confidenceScore = Number(extra.confidenceScore);
  if (extra.processingTimeMs !== undefined) data.processingTimeMs = Number(extra.processingTimeMs);
  if (extra.errorMessage !== undefined) data.errorMessage = extra.errorMessage;

  return await prisma.oCRJob.update({
    where: { id: String(id) },
    data,
    include: {
      provider: true,
      profile: true,
    },
  });
};

module.exports = {
  findAll,
  findById,
  create,
  updateStatus,
};
