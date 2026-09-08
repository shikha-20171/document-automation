const express = require("express");
const router = express.Router();
const superAdminOcrController = require("../controllers/superAdminOcrController");
const verifyToken = require("../middleware/authMiddleware");

// Require Super Admin Role
const requireSuperAdmin = (req, res, next) => {
  if (process.env.NODE_ENV === "development" && (!req.user || req.headers["x-dev-admin"] === "true")) {
    if (!req.user) {
      req.user = { id: 1, email: "superadmin@documentautomation.ai", role: "SUPER_ADMIN", rawRole: "SUPER_ADMIN" };
    }
    return next();
  }

  const role = (req.user?.role || req.user?.rawRole || "").toUpperCase().replace(/\s+/g, "_");
  if (role === "SUPER_ADMIN" || role === "SUPERADMIN") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Forbidden. Only Super Admin has access to OCR Management.",
  });
};

// Protect all OCR management routes
router.use((req, res, next) => {
  if (process.env.NODE_ENV === "development" && !req.headers.authorization && !req.cookies?.token) {
    req.user = { id: 1, email: "superadmin@documentautomation.ai", role: "SUPER_ADMIN", rawRole: "SUPER_ADMIN" };
    return next();
  }
  return verifyToken(req, res, (err) => {
    if (err) return next(err);
    requireSuperAdmin(req, res, next);
  });
});

// Unified OCR Configuration for AI Automation -> OCR
router.get("/config", superAdminOcrController.getOcrFullConfig);
router.put("/config", superAdminOcrController.updateOcrRoutingConfig);
router.post("/test/tesseract", superAdminOcrController.testTesseract);
router.post("/test/google-document-ai", superAdminOcrController.testGoogleDocumentAI);
router.post("/google/configure", superAdminOcrController.configureGoogleDocumentAI);
router.post("/google/activate", superAdminOcrController.activateGoogleDocumentAI);
router.post("/google/deactivate", superAdminOcrController.deactivateGoogleDocumentAI);
router.put("/default-engine", superAdminOcrController.setDefaultEngine);
router.get("/integrated-health", superAdminOcrController.getIntegratedHealth);

// Overview
router.get("/overview", superAdminOcrController.getOverview);

// OCR Providers
router.get("/providers", superAdminOcrController.getProviders);
router.post("/providers", superAdminOcrController.createProvider);
router.put("/providers/:id", superAdminOcrController.updateProvider);
router.put("/providers/:id/toggle", superAdminOcrController.toggleProvider);
router.post("/providers/:id/toggle", superAdminOcrController.toggleProvider);
router.post("/providers/:id/test", superAdminOcrController.testProvider);
router.delete("/providers/:id", superAdminOcrController.deleteProvider);

// OCR Profiles
router.get("/profiles", superAdminOcrController.getProfiles);
router.post("/profiles", superAdminOcrController.createProfile);
router.put("/profiles/:id", superAdminOcrController.updateProfile);
router.put("/profiles/:id/toggle", superAdminOcrController.toggleProfile);
router.post("/profiles/:id/toggle", superAdminOcrController.toggleProfile);
router.delete("/profiles/:id", superAdminOcrController.deleteProfile);

// OCR Jobs
router.get("/jobs", superAdminOcrController.getJobs);
router.post("/jobs/:id/retry", superAdminOcrController.retryJob);
router.post("/jobs/:id/reprocess", superAdminOcrController.reprocessJob);
router.post("/jobs/:id/cancel", superAdminOcrController.cancelJob);

// OCR Usage & Costs
router.get("/usage", superAdminOcrController.getUsage);
router.get("/costs", superAdminOcrController.getCosts);

// OCR Logs
router.get("/logs", superAdminOcrController.getLogs);

// OCR Health
router.get("/health", superAdminOcrController.getHealth);
router.post("/health/test-all", superAdminOcrController.testAllHealth);

module.exports = router;
