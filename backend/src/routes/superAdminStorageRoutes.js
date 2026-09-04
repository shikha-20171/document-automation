const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { isSuperAdmin } = require("../middleware/roleMiddleware");
const {
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
} = require("../controllers/superAdminStorageController");

// Require Super Admin authentication
router.use(verifyToken);
router.use(isSuperAdmin);

router.get("/", getStorageOverview);
router.get("/overview", getStorageOverview);
router.get("/config", getStorageConfigs);
router.get("/configs", getStorageConfigs);
router.post("/config", updateStorageConfig);
router.post("/configs", updateStorageConfig);
router.put("/config", updateStorageConfig);
router.put("/configs/:id", updateStorageConfig);
router.post("/test-connection", testStorageConnection);
router.post("/disconnect", disconnectStorage);

router.get("/backups", getStorageBackups);
router.post("/backups/run", triggerBackupRun);
router.get("/retention", getRetentionPolicies);
router.post("/retention", createRetentionPolicy);
router.get("/alerts", getStorageAlerts);

module.exports = router;
