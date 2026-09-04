const express = require("express");
const router = express.Router();
const { getReportsData } = require("../controllers/departmentManagerReportsController");

/**
 * @swagger
 * /department-manager/reports:
 *   get:
 *     summary: Department Reports & KPIs
 *     tags:
 *       - Department Manager - Core
 *     responses:
 *       200:
 *         description: Reports data returned.
 */
router.get("/", getReportsData);

module.exports = router;
