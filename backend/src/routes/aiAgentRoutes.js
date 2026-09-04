const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  executeAgentTask,
  getExecutionHistory,
} = require("../controllers/aiAgentController");

router.use(verifyToken);

router.post("/execute", executeAgentTask);
router.get("/history", getExecutionHistory);

module.exports = router;
