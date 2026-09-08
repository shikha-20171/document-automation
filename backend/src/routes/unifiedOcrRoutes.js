const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const unifiedOcrController = require("../controllers/unifiedOcrController");

router.use(verifyToken);

// Process document extraction
router.post("/process", upload.single("file"), unifiedOcrController.processDocument);

// Direct document creation from OCR
router.post("/create-document", unifiedOcrController.createDocumentFromOcr);

module.exports = router;
