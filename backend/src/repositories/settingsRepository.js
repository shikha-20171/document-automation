const prisma = require("../config/prismaClient");

/**
 * Settings Repository
 * Handles PlatformSetting database operations
 */

const getSetting = async (key) => {
  return await prisma.platformSetting.findUnique({
    where: { key: String(key) },
  });
};

const getAllSettings = async ({ category } = {}) => {
  const where = {};
  if (category) where.category = category;

  return await prisma.platformSetting.findMany({
    where,
    orderBy: { key: "asc" },
  });
};

const setSetting = async (key, value, { description, category, isEncrypted } = {}) => {
  const valueStr = typeof value === "object" ? JSON.stringify(value) : String(value);

  return await prisma.platformSetting.upsert({
    where: { key: String(key) },
    update: {
      value: valueStr,
      description: description !== undefined ? description : undefined,
      category: category !== undefined ? category : undefined,
      isEncrypted: isEncrypted !== undefined ? Boolean(isEncrypted) : undefined,
    },
    create: {
      key: String(key),
      value: valueStr,
      description: description || null,
      category: category || "GENERAL",
      isEncrypted: Boolean(isEncrypted),
    },
  });
};

const deleteSetting = async (key) => {
  return await prisma.platformSetting.delete({
    where: { key: String(key) },
  });
};

module.exports = {
  getSetting,
  getAllSettings,
  setSetting,
  deleteSetting,
};
