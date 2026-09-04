const express = require("express");
const router = express.Router();
const orgIntegrationsController = require("../controllers/orgIntegrationsController");

// 1. Providers Catalog & Integrations List
router.get("/providers", orgIntegrationsController.getProvidersCatalog);
router.get("/", orgIntegrationsController.getIntegrations);
router.get("/status", orgIntegrationsController.getIntegrations);

// 2. Named OAuth 2.0 Direct Endpoints
router.post("/google/connect", (req, res) => {
  req.params.provider = "GOOGLE_WORKSPACE";
  orgIntegrationsController.connectProvider(req, res);
});
router.get("/google/callback", (req, res) => {
  req.params.provider = "GOOGLE_WORKSPACE";
  orgIntegrationsController.oauthCallback(req, res);
});

router.post("/microsoft/connect", (req, res) => {
  req.params.provider = "MICROSOFT_365";
  orgIntegrationsController.connectProvider(req, res);
});
router.get("/microsoft/callback", (req, res) => {
  req.params.provider = "MICROSOFT_365";
  orgIntegrationsController.oauthCallback(req, res);
});

router.post("/slack/connect", (req, res) => {
  req.params.provider = "SLACK";
  orgIntegrationsController.connectProvider(req, res);
});
router.get("/slack/callback", (req, res) => {
  req.params.provider = "SLACK";
  orgIntegrationsController.oauthCallback(req, res);
});

router.post("/teams/connect", (req, res) => {
  req.params.provider = "MICROSOFT_TEAMS";
  orgIntegrationsController.connectProvider(req, res);
});
router.get("/teams/callback", (req, res) => {
  req.params.provider = "MICROSOFT_TEAMS";
  orgIntegrationsController.oauthCallback(req, res);
});

// 3. Developer API Keys
router.get("/api-keys", orgIntegrationsController.getOrgApiKeys);
router.post("/api-keys", orgIntegrationsController.generateOrgApiKey);
router.delete("/api-keys/:id", orgIntegrationsController.revokeOrgApiKey);

// 4. Webhooks & Deliveries
router.get("/webhooks", orgIntegrationsController.getWebhooks);
router.post("/webhooks", orgIntegrationsController.createWebhook);
router.put("/webhooks/:id", orgIntegrationsController.updateWebhook);
router.delete("/webhooks/:id", orgIntegrationsController.deleteWebhook);
router.post("/webhooks/:id/test", orgIntegrationsController.testWebhook);
router.get("/webhooks/:id/deliveries", orgIntegrationsController.getWebhookDeliveries);
router.post("/webhooks/deliveries/:id/retry", orgIntegrationsController.retryWebhookDelivery);

// 5. Custom REST Integrations
router.get("/custom", orgIntegrationsController.getCustomRestIntegrations);
router.post("/custom", orgIntegrationsController.createCustomRestIntegration);
router.post("/custom/test", orgIntegrationsController.testCustomRest);

// 6. Generic Connect & OAuth Callback
router.post("/:provider/connect", orgIntegrationsController.connectProvider);
router.get("/:provider/callback", orgIntegrationsController.oauthCallback);

// 7. Test, Actions, Logs & Disconnect
router.post("/:provider/test", orgIntegrationsController.testConnection);
router.post("/:provider/actions/:action", orgIntegrationsController.executeProviderAction);
router.post("/:provider/action", (req, res) => {
  req.params.action = req.body.action;
  orgIntegrationsController.executeProviderAction(req, res);
});
router.get("/:provider/logs", orgIntegrationsController.getIntegrationLogs);
router.post("/:id/disconnect", orgIntegrationsController.disconnectIntegration);
router.delete("/:id", orgIntegrationsController.disconnectIntegration);

// 8. Single Provider Details
router.get("/:id", orgIntegrationsController.getIntegrationById);

module.exports = router;
