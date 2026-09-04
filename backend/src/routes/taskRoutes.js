const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");

// All task routes require authentication
router.use(authMiddleware);

router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.get("/:id", taskController.getTaskById);
router.patch("/:id/status", taskController.updateTaskStatus);
router.post("/:id/comments", taskController.addTaskComment);

module.exports = router;
