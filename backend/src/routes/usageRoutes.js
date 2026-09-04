const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getUsage } = require("../controllers/usageMeteringController");

router.use(verifyToken);

router.get("/metrics", getUsage);
router.get("/summary", getUsage);

module.exports = router;
