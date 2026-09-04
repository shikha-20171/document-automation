const express = require("express");
const router = express.Router();
const orgGovernanceController = require("../controllers/orgGovernanceController");
const authMiddleware = require("../middleware/authMiddleware");
const { isOrgAdmin } = require("../middleware/roleMiddleware");

router.use(authMiddleware);
router.use(isOrgAdmin);

router.get("/security", orgGovernanceController.getSecurityPolicy);
router.put("/security", orgGovernanceController.updateSecurityPolicy);
router.get("/ai-policy", orgGovernanceController.getAiPolicies);
router.post("/ai-policy", orgGovernanceController.updateAiPolicy);

module.exports = router;
