const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  createBulkJob,
  listBulkJobs,
  getBulkJobById,
} = require("../controllers/bulkGenerationController");

router.use(verifyToken);

router.post("/jobs", createBulkJob);
router.get("/jobs", listBulkJobs);
router.get("/jobs/:id", getBulkJobById);

module.exports = router;
