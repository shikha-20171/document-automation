const express = require("express");
const router = express.Router();
const { runAiTool } = require("../controllers/teamLeaderAiToolsController");

/**
 * @swagger
 * /team-leader/ai-tools/run:
 *   post:
 *     summary: Run Operational AI Tools
 *     tags:
 *       - Team Leader - AI Tools
 *     responses:
 *       200:
 *         description: Tool execution result.
 */
router.post("/run", runAiTool);

module.exports = router;
