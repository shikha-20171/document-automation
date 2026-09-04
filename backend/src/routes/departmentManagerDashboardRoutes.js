const express = require("express");
const router = express.Router();
const { getDashboardData } = require("../controllers/departmentManagerDashboardController");

/**
 * @swagger
 * /department-manager/dashboard:
 *   get:
 *     summary: Department Manager Dashboard Summary
 *     description: Retrieve department-scoped KPIs, approval queue counts, document volumes, and recent activity.
 *     tags:
 *       - Department Manager - Core
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard telemetry returned.
 */
router.get("/", getDashboardData);

module.exports = router;
