const express = require("express");
const router = express.Router();
const { getDashboardData } = require("../controllers/teamLeaderDashboardController");

/**
 * @swagger
 * /team-leader/dashboard:
 *   get:
 *     summary: Get Team Leader Dashboard Overview
 *     tags:
 *       - Team Leader - Dashboard
 *     responses:
 *       200:
 *         description: Dashboard stats, pending actions, activities, and team performance.
 */
router.get("/", getDashboardData);

module.exports = router;
