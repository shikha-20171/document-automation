const express = require("express");
const router = express.Router();
const {
  getTemplates,
  createTeamTemplate,
  createDocFromTemplate,
} = require("../controllers/teamLeaderTemplatesController");

/**
 * @swagger
 * /team-leader/templates:
 *   get:
 *     summary: List Document Templates
 *     tags:
 *       - Team Leader - Templates
 *     responses:
 *       200:
 *         description: Templates returned.
 */
router.get("/", getTemplates);
router.post("/team", createTeamTemplate);
router.post("/generate", createDocFromTemplate);

module.exports = router;
