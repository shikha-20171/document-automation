const express = require("express");
const router = express.Router();
const superAdminOcrController = require("../controllers/superAdminOcrController");

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
