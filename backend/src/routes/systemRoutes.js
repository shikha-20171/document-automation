const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { isSuperAdmin } = require("../middleware/roleMiddleware");
const {
  getSystemHealth,
  getSystemMetrics,
  toggleMaintenanceMode,
  updateFeatureFlags,
} = require("../controllers/systemMonitoringController");

// Public health check
router.get("/health", getSystemHealth);

// Super Admin Observability & Controls
router.get("/metrics", verifyToken, isSuperAdmin, getSystemMetrics);
router.post("/maintenance", verifyToken, isSuperAdmin, toggleMaintenanceMode);
router.post("/feature-flags", verifyToken, isSuperAdmin, updateFeatureFlags);

module.exports = router;
