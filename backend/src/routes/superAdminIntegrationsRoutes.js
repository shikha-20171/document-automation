const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { isSuperAdmin } = require("../middleware/roleMiddleware");
const superAdminIntegrationsController = require("../controllers/superAdminIntegrationsController");

// Strict Super Admin RBAC Protection
router.use(verifyToken);
router.use(isSuperAdmin);

// Dynamic Provider Registration
router.post("/providers", superAdminIntegrationsController.createProvider);

// Platform Integrations Management
router.get("/", superAdminIntegrationsController.getPlatformIntegrations);
router.get("/providers", superAdminIntegrationsController.getPlatformIntegrations);
router.get("/:provider", superAdminIntegrationsController.getPlatformIntegrationById);

// Platform Credentials & Toggle & Testing
router.put("/:provider/config", superAdminIntegrationsController.updatePlatformIntegrationConfig);
router.post("/:provider/credentials", superAdminIntegrationsController.updatePlatformIntegrationConfig);
router.put("/:provider/toggle", superAdminIntegrationsController.togglePlatformIntegration);
router.post("/:provider/test", superAdminIntegrationsController.testPlatformIntegration);

module.exports = router;
