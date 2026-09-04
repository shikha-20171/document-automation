const prisma = require("../config/prismaClient");

const findAll = async ({ status, providerId } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (providerId) where.providerId = String(providerId);

  return await prisma.oCRProfile.findMany({
    where,
    orderBy: { profileName: "asc" },
    include: {
      provider: true,
      _count: { select: { jobs: true } },
    },
  });
};

const findById = async (id) => {
  return await prisma.oCRProfile.findUnique({
    where: { id: String(id) },
    include: {
      provider: true,
    },
  });
};

const findByCode = async (profileCode) => {
  return await prisma.oCRProfile.findUnique({
    where: { profileCode: String(profileCode) },
    include: {
      provider: true,
    },
  });
};

const create = async (data) => {
  return await prisma.oCRProfile.create({
    data: {
      profileName: data.profileName,
      profileCode: data.profileCode.toLowerCase().replace(/\s+/g, "_"),
      description: data.description || null,
      providerId: data.providerId ? String(data.providerId) : null,
      language: data.language || "eng",
      inputFormats: data.inputFormats || ["PDF", "PNG", "JPG", "TIFF"],
      textDetection: data.textDetection !== undefined ? Boolean(data.textDetection) : true,
      tableDetection: data.tableDetection !== undefined ? Boolean(data.tableDetection) : true,
      layoutDetection: data.layoutDetection !== undefined ? Boolean(data.layoutDetection) : true,
      handwritingDetection: Boolean(data.handwritingDetection),
      confidenceThreshold: data.confidenceThreshold ? Number(data.confidenceThreshold) : 80.0,
      outputFormat: data.outputFormat || "STRUCTURED_JSON",
      status: data.status || "ACTIVE",
      isDefault: Boolean(data.isDefault),
    },
  });
};

const update = async (id, data) => {
  const updateData = {};
  if (data.profileName !== undefined) updateData.profileName = data.profileName;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.providerId !== undefined) updateData.providerId = data.providerId ? String(data.providerId) : null;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.inputFormats !== undefined) updateData.inputFormats = data.inputFormats;
  if (data.textDetection !== undefined) updateData.textDetection = Boolean(data.textDetection);
  if (data.tableDetection !== undefined) updateData.tableDetection = Boolean(data.tableDetection);
  if (data.layoutDetection !== undefined) updateData.layoutDetection = Boolean(data.layoutDetection);
  if (data.handwritingDetection !== undefined) updateData.handwritingDetection = Boolean(data.handwritingDetection);
  if (data.confidenceThreshold !== undefined) updateData.confidenceThreshold = Number(data.confidenceThreshold);
  if (data.outputFormat !== undefined) updateData.outputFormat = data.outputFormat;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.isDefault !== undefined) updateData.isDefault = Boolean(data.isDefault);

  return await prisma.oCRProfile.update({
    where: { id: String(id) },
    data: updateData,
  });
};

const deleteProfile = async (id) => {
  return await prisma.oCRProfile.delete({
    where: { id: String(id) },
  });
};

module.exports = {
  findAll,
  findById,
  findByCode,
  create,
  update,
  deleteProfile,
};
