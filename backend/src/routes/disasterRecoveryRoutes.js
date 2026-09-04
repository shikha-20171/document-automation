const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { isSuperAdmin } = require("../middleware/roleMiddleware");
const {
  getDisasterRecoveryOverview,
  triggerManualBackup,
  simulateRestoration,
} = require("../controllers/disasterRecoveryController");

router.use(verifyToken);
router.use(isSuperAdmin);

router.get("/", getDisasterRecoveryOverview);
router.post("/backup", triggerManualBackup);
router.post("/simulate-restore", simulateRestoration);

module.exports = router;
