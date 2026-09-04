const express = require("express");
const router = express.Router();
const {
  getPlatformAnalytics,
  getOrganisationAnalytics,
  getAiAnalytics,
  getOcrAnalytics,
} = require("../controllers/superAdminAnalyticsController");
const verifyToken = require("../middleware/authMiddleware");

const requireSuperAdmin = (req, res, next) => {
  const role = (req.user?.role || req.user?.rawRole || "").toUpperCase().replace(/\s+/g, "_");
  if (role === "SUPER_ADMIN" || role === "SUPERADMIN") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Super Admin access required.",
  });
};

router.use(verifyToken);
router.use(requireSuperAdmin);

router.get("/platform", getPlatformAnalytics);
router.get("/summary", getPlatformAnalytics);
router.get("/organisations", getOrganisationAnalytics);
router.get("/ai", getAiAnalytics);
router.get("/ocr", getOcrAnalytics);

module.exports = router;
