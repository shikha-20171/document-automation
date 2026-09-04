const express = require("express");
const router = express.Router();
const {
  getTeamOverview,
  getEmployeeProfile,
  assignWorkToEmployee,
  sendMessageToEmployee,
} = require("../controllers/teamLeaderTeamController");

/**
 * @swagger
 * /team-leader/my-team:
 *   get:
 *     summary: Get Team Overview & Employees
 *     tags:
 *       - Team Leader - Team
 *     responses:
 *       200:
 *         description: Team roster and details.
 */
router.get("/", getTeamOverview);
router.get("/employees/:id", getEmployeeProfile);
router.post("/assign", assignWorkToEmployee);
router.post("/assign-work", assignWorkToEmployee);
router.post("/message", sendMessageToEmployee);
router.post("/send-message", sendMessageToEmployee);

module.exports = router;
