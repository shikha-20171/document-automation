const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getDashboardGrowthData,
  getPlatformHealthStatus,
} = require("../controllers/superAdminDashboardController");

router.get("/", getDashboardStats);
router.get("/stats", getDashboardStats);
router.get("/metrics", getDashboardStats);
router.get("/growth", getDashboardGrowthData);
router.get("/platform-health", getPlatformHealthStatus);
router.get("/health", getPlatformHealthStatus);

module.exports = router;
