const express = require("express");
const router = express.Router();
const { getReports } = require("../controllers/teamLeaderReportsController");

/**
 * @swagger
 * /team-leader/reports:
 *   get:
 *     summary: Get Team Reports & Analytics
 *     tags:
 *       - Team Leader - Reports
 *     responses:
 *       200:
 *         description: Reports data returned.
 */
router.get("/", getReports);

module.exports = router;
