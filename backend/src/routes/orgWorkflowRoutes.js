const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  toggleStatus,
  deleteWorkflow,
  duplicateWorkflow,
  getApprovalRequests,
  processOrgApprovalAction,
  getWorkflowHistory,
} = require("../controllers/workflowController");

router.use(authMiddleware);

/**
 * @swagger
 * /org-admin/workflows:
 *   get:
 *     summary: List Org Workflows
 *     tags:
 *       - Org Admin - Workflows
 */
router.get("/", getWorkflows);
router.post("/", createWorkflow);
router.get("/requests", getApprovalRequests);
router.post("/requests/:id/action", processOrgApprovalAction);
router.get("/history", getWorkflowHistory);
router.get("/:id", getWorkflowById);
router.put("/:id", updateWorkflow);
router.patch("/:id/status", toggleStatus);
router.post("/:id/duplicate", duplicateWorkflow);
router.delete("/:id", deleteWorkflow);

module.exports = router;
