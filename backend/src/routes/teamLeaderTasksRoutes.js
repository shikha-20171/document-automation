const express = require("express");
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
} = require("../controllers/teamLeaderTasksController");

/**
 * @swagger
 * /team-leader/tasks:
 *   get:
 *     summary: List Team Tasks
 *     tags:
 *       - Team Leader - Tasks
 *     responses:
 *       200:
 *         description: Tasks list returned.
 */
router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.patch("/:id", updateTask);

module.exports = router;
