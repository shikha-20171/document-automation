const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  processDocument,
  listExtractions,
  getExtractionById,
} = require("../controllers/idpController");

router.use(verifyToken);

router.post("/process", processDocument);
router.get("/extractions", listExtractions);
router.get("/extractions/:id", getExtractionById);

module.exports = router;
