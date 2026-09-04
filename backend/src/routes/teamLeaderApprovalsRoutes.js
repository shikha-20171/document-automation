const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { isTeamLeader } = require("../middleware/roleMiddleware");
const {
  getApprovals,
  processApprovalAction,
} = require("../controllers/teamLeaderApprovalsController");

router.use(verifyToken);
router.use(isTeamLeader);

/**
 * @swagger
 * /team-leader/approvals:
 *   get:
 *     summary: List Team Approvals
 *     tags:
 *       - Team Leader - Approvals
 *     responses:
 *       200:
 *         description: Approvals list.
 */
router.get("/", getApprovals);
router.post("/:id/action", processApprovalAction);
router.post("/:id/approve", (req, res) => {
  req.body.action = "APPROVED";
  return processApprovalAction(req, res);
});
router.post("/:id/reject", (req, res) => {
  req.body.action = "REJECTED";
  return processApprovalAction(req, res);
});

module.exports = router;
