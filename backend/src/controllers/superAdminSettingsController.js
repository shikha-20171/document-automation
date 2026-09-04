const prisma = require("../config/prismaClient");

const getPlatformSettings = async (req, res, next) => {
  try {
    let settings = await prisma.platformSetting.findFirst();
    if (!settings) {
      settings = await prisma.platformSetting.create({
        data: {
          systemName: "DocuCore AI",
          supportEmail: "support@docucore.ai",
          maintenanceMode: false,
          maxFileUploadMb: 50,
          defaultStorageQuotaGb: 500,
          enforceTwoFactor: false,
          sessionTimeoutMinutes: 60,
        },
      });
    }
    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

const updatePlatformSettings = async (req, res, next) => {
  try {
    const existing = await prisma.platformSetting.findFirst();
    let updated;
    if (existing) {
      updated = await prisma.platformSetting.update({
        where: { id: existing.id },
        data: req.body,
      });
    } else {
      updated = await prisma.platformSetting.create({
        data: req.body,
      });
    }
    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformSettings,
  updatePlatformSettings,
};
