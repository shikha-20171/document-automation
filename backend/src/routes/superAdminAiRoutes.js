const express = require("express");
const router = express.Router();
const superAdminAiController = require("../controllers/superAdminAiController");

// Overview
router.get("/overview", superAdminAiController.getOverview);

// Providers
router.get("/providers", superAdminAiController.getProviders);
router.post("/providers", superAdminAiController.createProvider);
router.put("/providers/:id", superAdminAiController.updateProvider);
router.put("/providers/:id/toggle", superAdminAiController.toggleProvider);
router.post("/providers/:id/toggle", superAdminAiController.toggleProvider);
router.post("/providers/:id/test", superAdminAiController.testProvider);
router.delete("/providers/:id", superAdminAiController.deleteProvider);

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
