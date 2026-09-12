const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const WorkflowEngineService = require("../services/workflowEngineService");
const { getOrgIdSafe, getUserId } = require("../utils/authContext");
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

// =====================================================
// DOCUMENT-CENTRIC WORKFLOW ENDPOINTS (CORE SAAS ENGINE)
// =====================================================

/**
 * GET /api/org-admin/workflow/overview
 * KPI Metric summary cards
 */
router.get("/overview", async (req, res) => {
  try {
    const orgId = getOrgIdSafe(req);
    const stats = await WorkflowEngineService.getOverviewStats(orgId);
    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error("[WorkflowRoutes.overview]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/org-admin/workflow/documents
 * List pending / active workflow documents
 */
router.get("/documents", async (req, res) => {
  try {
    const orgId = getOrgIdSafe(req);
    const { search, status, documentType, stage } = req.query;
    const documents = await WorkflowEngineService.getPendingApprovals(orgId, {
      search,
      status,
      documentType,
      stage,
    });
    return res.json({ success: true, data: documents, total: documents.length });
  } catch (err) {
    console.error("[WorkflowRoutes.documents]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/org-admin/workflow/documents/:id/review
 * Detailed review screen payload with stepper and history
 */
router.get("/documents/:id/review", async (req, res) => {
  try {
    const orgId = getOrgIdSafe(req);
    const details = await WorkflowEngineService.getDocumentReviewDetails(req.params.id, orgId);
    return res.json({ success: true, data: details });
  } catch (err) {
    console.error("[WorkflowRoutes.documentReview]", err);
    return res.status(err.message.includes("not found") ? 404 : 500).json({
      success: false,
      message: err.message,
    });
  }
});

/**
 * POST /api/org-admin/workflow/documents/:id/approve
 * Organization Admin approval -> either routes to signature or marks Completed
 */
router.post("/documents/:id/approve", async (req, res) => {
  try {
    const orgId = getOrgIdSafe(req);
    const { comment = "" } = req.body;
    const result = await WorkflowEngineService.processDecision(req.params.id, orgId, req.user, {
      action: "APPROVE",
      comment,
    });
    return res.json(result);
  } catch (err) {
    console.error("[WorkflowRoutes.approve]", err);
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/org-admin/workflow/documents/:id/reject
 * Reject document with mandatory reason
 */
router.post("/documents/:id/reject", async (req, res) => {
  try {
    const orgId = getOrgIdSafe(req);
    const { comment = "", reason = "" } = req.body;
    const decisionReason = reason || comment;
    if (!decisionReason || !decisionReason.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is mandatory." });
    }
    const result = await WorkflowEngineService.processDecision(req.params.id, orgId, req.user, {
      action: "REJECT",
      comment: decisionReason,
    });
    return res.json(result);
  } catch (err) {
    console.error("[WorkflowRoutes.reject]", err);
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/org-admin/workflow/documents/:id/request-changes
 * Request changes with mandatory comment
 */
router.post("/documents/:id/request-changes", async (req, res) => {
  try {
    const orgId = getOrgIdSafe(req);
    const { comment = "", reason = "" } = req.body;
    const decisionComment = comment || reason;
    if (!decisionComment || !decisionComment.trim()) {
      return res.status(400).json({ success: false, message: "A comment/note is mandatory when requesting changes." });
    }
    const result = await WorkflowEngineService.processDecision(req.params.id, orgId, req.user, {
      action: "REQUEST_CHANGES",
      comment: decisionComment,
    });
    return res.json(result);
  } catch (err) {
    console.error("[WorkflowRoutes.requestChanges]", err);
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/org-admin/workflow/config
 * Get workflow rules per document type
 */
router.get("/config", async (req, res) => {
  try {
    const orgId = getOrgIdSafe(req);
    const config = await WorkflowEngineService.getWorkflowConfig(orgId);
    return res.json({ success: true, data: config });
  } catch (err) {
    console.error("[WorkflowRoutes.getConfig]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/org-admin/workflow/config
 * Update workflow rules per document type
 */
router.put("/config", async (req, res) => {
  try {
    const orgId = getOrgIdSafe(req);
    const userId = getUserId(req);
    const { configs } = req.body;
    const updated = await WorkflowEngineService.updateWorkflowConfig(orgId, userId, configs);
    return res.json({ success: true, message: "Workflow configuration saved.", data: updated });
  } catch (err) {
    console.error("[WorkflowRoutes.updateConfig]", err);
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/org-admin/workflow/audit-history
 * Chronological audit log of all transitions
 */
router.get("/audit-history", async (req, res) => {
  try {
    const orgId = getOrgIdSafe(req);
    const history = await WorkflowEngineService.getWorkflowAuditHistory(orgId);
    return res.json({ success: true, data: history });
  } catch (err) {
    console.error("[WorkflowRoutes.auditHistory]", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// =====================================================
// EXISTING WORKFLOW ROUTES (BACKWARD COMPATIBILITY)
// =====================================================
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
