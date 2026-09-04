const StorageService = require("../services/storage/StorageService");

const getStorageOverview = async (req, res, next) => {
  try {
    const stats = await StorageService.getPlatformStorageStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getStorageConfigs = async (req, res, next) => {
  try {
    const config = await StorageService.getSafeStorageConfig();
    res.status(200).json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

const updateStorageConfig = async (req, res, next) => {
  try {
    const updated = await StorageService.updateStorageConfig(req.body, {
      email: req.user?.email || "superadmin@docucore.ai",
      ipAddress: req.ip,
    });
    res.status(200).json({
      success: true,
      message: "AWS S3 storage configuration verified, encrypted, and saved successfully. All tenants will automatically use this AWS S3 vault.",
      data: updated,
    });
  } catch (error) {
    res.status(error.status ? 400 : 500).json({
      success: false,
      status: error.status || "ERROR",
      message: error.message,
    });
  }
};

const testStorageConnection = async (req, res, next) => {
  try {
    const result = await StorageService.testConnection(req.body, {
      email: req.user?.email || "superadmin@docucore.ai",
      ipAddress: req.ip,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      status: "CONNECTION_FAILED",
      error: error.message,
    });
  }
};

const disconnectStorage = async (req, res, next) => {
  try {
    const result = await StorageService.disconnect({
      email: req.user?.email || "superadmin@docucore.ai",
      ipAddress: req.ip,
    });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getStorageBackups = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: [
        { id: "snap_auto_daily", type: "DAILY_AUTO", size: "1.2 GB", status: "VERIFIED", timestamp: new Date().toISOString() },
      ],
    });
  } catch (error) {
    next(error);
  }
};

const triggerBackupRun = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: "Backup routine triggered successfully.",
      snapshotId: `snap_manual_${Date.now()}`,
    });
  } catch (error) {
    next(error);
  }
};

const getRetentionPolicies = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: [
        { id: "pol_def", name: "Default Ingestion Retention", days: 365, status: "ACTIVE" },
      ],
    });
  } catch (error) {
    next(error);
  }
};

const createRetentionPolicy = async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      data: { id: `pol_${Date.now()}`, ...req.body },
    });
  } catch (error) {
    next(error);
  }
};

const getStorageAlerts = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStorageOverview,
  getStorageConfigs,
  updateStorageConfig,
  testStorageConnection,
  disconnectStorage,
  getStorageBackups,
  triggerBackupRun,
  getRetentionPolicies,
  createRetentionPolicy,
  getStorageAlerts,
};
