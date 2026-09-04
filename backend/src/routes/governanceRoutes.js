const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const governanceController = require("../controllers/governanceController");

router.use(verifyToken);
router.use(authorizeRoles("SUPER_ADMIN", "ORGANISATION_ADMIN"));

// 1. Dashboard & Compliance
router.get("/dashboard", governanceController.getDashboardSummary);
router.get("/readiness", governanceController.getComplianceReadiness);
router.get("/audit-evidence", governanceController.exportAuditEvidence);

// 2. Security & AI Policies
router.get("/security-policy", governanceController.getSecurityPolicy);
router.put("/security-policy", governanceController.updateSecurityPolicy);
router.get("/ai-policy", governanceController.getAiPolicies);
router.post("/ai-policy", governanceController.saveAiPolicy);

// 3. Change Requests
router.get("/change-requests", governanceController.getChangeRequests);
router.post("/change-requests", governanceController.createChangeRequest);
router.post("/change-requests/:id/approve", governanceController.approveChangeRequest);
router.post("/change-requests/:id/reject", governanceController.rejectChangeRequest);
router.post("/change-requests/:id/apply", governanceController.applyChangeRequest);

// 4. Access Reviews
router.get("/access-reviews", governanceController.getAccessReviewCampaigns);
router.post("/access-reviews", governanceController.createAccessReviewCampaign);
router.get("/access-reviews/:id", governanceController.getCampaignDetails);
router.post("/access-reviews/:campaignId/items/:itemId/decide", governanceController.decideAccessReviewItem);
router.post("/access-reviews/:id/complete", governanceController.completeCampaign);

// 5. Incidents
router.get("/incidents", governanceController.getIncidents);
router.post("/incidents", governanceController.createIncident);
router.patch("/incidents/:id", governanceController.updateIncident);

// 6. Risks
router.get("/risks", governanceController.getRisks);
router.post("/risks", governanceController.createRisk);
router.patch("/risks/:id", governanceController.updateRisk);
router.delete("/risks/:id", governanceController.deleteRisk);

// 7. Data Retention
router.get("/retention", governanceController.getRetentionPolicies);
router.post("/retention", governanceController.createRetentionPolicy);
router.put("/retention/:id", governanceController.updateRetentionPolicy);
router.delete("/retention/:id", governanceController.deleteRetentionPolicy);
router.post("/retention/run-worker", governanceController.runRetentionSweep);

module.exports = router;
