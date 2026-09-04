const express = require("express");
const router = express.Router();
const {
  getWorkflows,
  executeWorkflowStep,
  addWorkflowComment,
} = require("../controllers/teamLeaderWorkflowController");

/**
 * @swagger
 * /team-leader/workflow:
 *   get:
 *     summary: List Team Workflows
 *     tags:
 *       - Team Leader - Workflows
 *     responses:
 *       200:
 *         description: Workflow lists returned.
 */
router.get("/", getWorkflows);
router.post("/:id/step", executeWorkflowStep);
router.post("/:id/execute-step", executeWorkflowStep);
router.post("/:id/comments", addWorkflowComment);

module.exports = router;
