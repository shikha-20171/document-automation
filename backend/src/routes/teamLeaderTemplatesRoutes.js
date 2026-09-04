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
router.post("/create-team-template", createTeamTemplate);
router.post("/generate", createDocFromTemplate);
router.post("/use-template", createDocFromTemplate);

module.exports = router;
