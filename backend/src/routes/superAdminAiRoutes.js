const express = require("express");
const router = express.Router();
const superAdminAiController = require("../controllers/superAdminAiController");
const verifyToken = require("../middleware/authMiddleware");

// Require Super Admin Role
const requireSuperAdmin = (req, res, next) => {
  // If in local development and explicit dev header or test mode
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
    message: "Forbidden. Only Super Admin has access to AI Provider Management.",
  });
};

// Protect all AI Provider management routes
router.use((req, res, next) => {
  // Allow seamless dev bypass if no Authorization header present in development mode
  if (process.env.NODE_ENV === "development" && !req.headers.authorization && !req.cookies?.token) {
    req.user = { id: 1, email: "superadmin@documentautomation.ai", role: "SUPER_ADMIN", rawRole: "SUPER_ADMIN" };
    return next();
  }
  return verifyToken(req, res, (err) => {
    if (err) return next(err);
    requireSuperAdmin(req, res, next);
  });
});

// Overview
router.get("/overview", superAdminAiController.getOverview);

// AI Providers
router.get("/providers", superAdminAiController.getProviders);
router.post("/providers", superAdminAiController.createProvider);
router.get("/providers/:id", superAdminAiController.getProviderById);
router.put("/providers/:id", superAdminAiController.updateProvider);
router.delete("/providers/:id", superAdminAiController.deleteProvider);
router.post("/providers/:id/test", superAdminAiController.testProvider);
router.post("/providers/:id/activate", superAdminAiController.activateProvider);
router.post("/providers/:id/deactivate", superAdminAiController.deactivateProvider);
router.put("/providers/:id/toggle", superAdminAiController.toggleProvider);
router.post("/providers/:id/toggle", superAdminAiController.toggleProvider);
router.post("/providers/:id/models/sync", superAdminAiController.syncModels);

// AI Routing Configuration
router.get("/routing", superAdminAiController.getRoutingConfig);
router.put("/routing", superAdminAiController.updateRoutingConfig);

// Models
router.get("/models", superAdminAiController.getModels);
router.post("/models", superAdminAiController.createModel);
router.put("/models/:id", superAdminAiController.updateModel);
router.delete("/models/:id", superAdminAiController.deleteModel);

// Capabilities
router.get("/capabilities", superAdminAiController.getCapabilities);
router.post("/capabilities", superAdminAiController.createCapability);
router.put("/capabilities/:id", superAdminAiController.updateCapability);
router.put("/capabilities/:id/toggle", superAdminAiController.toggleCapability);
router.post("/capabilities/:id/toggle", superAdminAiController.toggleCapability);
router.delete("/capabilities/:id", superAdminAiController.deleteCapability);

// Jobs
router.get("/jobs", superAdminAiController.getJobs);
router.post("/jobs/:id/retry", superAdminAiController.retryJob);
router.post("/jobs/:id/cancel", superAdminAiController.cancelJob);

// Usage & Costs
router.get("/usage", superAdminAiController.getUsage);
router.get("/costs", superAdminAiController.getCosts);

// Logs
router.get("/logs", superAdminAiController.getLogs);

// Health
router.get("/health", superAdminAiController.getHealth);
router.post("/health/test-all", superAdminAiController.testAllHealth);

module.exports = router;
