const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const unifiedApprovalController = require("../controllers/unifiedApprovalController");

router.use(verifyToken);

router.get("/", unifiedApprovalController.getApprovals);
router.get("/:id", unifiedApprovalController.getApprovalById);
router.post("/submit", unifiedApprovalController.submitApproval);
router.post("/:id/action", unifiedApprovalController.handleAction);
router.post("/:id/approve", (req, res) => {
  req.body.action = "APPROVE";
  return unifiedApprovalController.handleAction(req, res);
});
router.post("/:id/reject", (req, res) => {
  req.body.action = "REJECT";
  return unifiedApprovalController.handleAction(req, res);
});
router.post("/:id/request-changes", (req, res) => {
  req.body.action = "REQUEST_CHANGES";
  return unifiedApprovalController.handleAction(req, res);
});

module.exports = router;
