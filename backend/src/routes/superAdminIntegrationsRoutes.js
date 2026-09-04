const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { isSuperAdmin } = require("../middleware/roleMiddleware");
const superAdminIntegrationsController = require("../controllers/superAdminIntegrationsController");

// Strict Super Admin RBAC Protection
router.use(verifyToken);
router.use(isSuperAdmin);

// Platform Integrations Management
router.get("/", superAdminIntegrationsController.getPlatformIntegrations);
router.put("/:provider/config", superAdminIntegrationsController.updatePlatformIntegrationConfig);
router.put("/:provider/toggle", superAdminIntegrationsController.togglePlatformIntegration);
router.post("/:provider/test", superAdminIntegrationsController.testPlatformIntegration);

module.exports = router;
