const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { isDepartmentManager } = require("../middleware/roleMiddleware");
const {
  getApprovals,
  handleApprovalAction,
} = require("../controllers/departmentManagerApprovalsController");

router.use(verifyToken);
router.use(isDepartmentManager);

/**
 * @swagger
 * /department-manager/approvals:
 *   get:
 *     summary: List Department Approvals
 *     tags:
 *       - Department Manager - Core
 *     responses:
 *       200:
 *         description: Approvals list returned.
 */
router.get("/", getApprovals);
router.post("/:id/action", handleApprovalAction);
router.post("/:id/approve", (req, res) => {
  req.body.action = "APPROVED";
  return handleApprovalAction(req, res);
});
router.post("/:id/reject", (req, res) => {
  req.body.action = "REJECTED";
  return handleApprovalAction(req, res);
});

module.exports = router;
