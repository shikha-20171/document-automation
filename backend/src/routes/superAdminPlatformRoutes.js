const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { isSuperAdmin } = require("../middleware/roleMiddleware");
const {
  listFeatureFlags,
  createOrUpdateFeatureFlag,
  toggleFeatureFlag,
  listAnnouncements,
  createAnnouncement,
  getAutomationMonitoring,
  getPlatformSettings,
  updatePlatformSettings,
  runSystemTests,
  requestEmergencyAccess,
} = require("../controllers/superAdminPlatformController");

// Strict Super Admin RBAC Protection
router.use(verifyToken);
router.use(isSuperAdmin);

// Feature Flags
router.get("/feature-flags", listFeatureFlags);
router.post("/feature-flags", createOrUpdateFeatureFlag);
router.put("/feature-flags/:id/toggle", toggleFeatureFlag);

// Announcements & Maintenance
router.get("/announcements", listAnnouncements);
router.post("/announcements", createAnnouncement);

// Automation Monitoring
router.get("/automation/jobs", getAutomationMonitoring);
router.get("/jobs", getAutomationMonitoring);

// Platform Settings
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);

// System Health Testing Harness
router.get("/system-tests/run", runSystemTests);
router.post("/system-tests/run", runSystemTests);
router.get("/run", runSystemTests);
router.post("/run", runSystemTests);

// Emergency Break-Glass Access
router.post("/emergency-access", requestEmergencyAccess);

module.exports = router;
