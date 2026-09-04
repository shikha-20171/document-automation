const prisma = require("../config/prismaClient");

const getAiJobQueue = async (req, res, next) => {
  try {
    const queue = await prisma.aIJobQueue.findMany({
      include: {
        provider: true,
        model: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      success: true,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

const getAiLogs = async (req, res, next) => {
  try {
    const logs = await prisma.aILog.findMany({
      include: {
        provider: true,
        model: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

const getAiCostUsages = async (req, res, next) => {
  try {
    const costs = await prisma.aICostUsage.findMany({
      include: {
        provider: true,
        model: true,
      },
      orderBy: { billingDate: "desc" },
    });
    res.status(200).json({
      success: true,
      data: costs,
    });
  } catch (error) {
    next(error);
  }
};

const getAiServiceHealth = async (req, res, next) => {
  try {
    const health = await prisma.aIServiceHealth.findMany({
      include: {
        provider: true,
      },
    });
    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
};

const { checkTesseractStatus } = require("../services/ocrService");

const getOcrEngines = async (req, res, next) => {
  try {
    const engines = await prisma.oCREngine.findMany({
      orderBy: { createdAt: "desc" },
    });

    const liveStatus = await checkTesseractStatus();

    // If no OCR engines exist in DB yet, provide detected local Tesseract engine
    if (!engines || engines.length === 0) {
      const defaultEngines = [
        {
          id: 1,
          name: liveStatus.systemTesseractAvailable ? "Local Tesseract OCR (Native 5.5)" : "Tesseract.js Engine",
          provider: "TESSERACT",
          status: "ACTIVE",
          languages: liveStatus.languages.join(", "),
          version: liveStatus.version,
          isDefault: true,
          type: "LOCAL",
        },
      ];
      return res.status(200).json({
        success: true,
        data: defaultEngines,
        meta: liveStatus,
      });
    }

    res.status(200).json({
      success: true,
      data: engines,
      meta: liveStatus,
    });
  } catch (error) {
    next(error);
  }
};

const getOcrRequests = async (req, res, next) => {
  try {
    const requests = await prisma.oCRRequest.findMany({
      include: {
        engine: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAiJobQueue,
  getAiLogs,
  getAiCostUsages,
  getAiServiceHealth,
  getOcrEngines,
  getOcrRequests,
};
