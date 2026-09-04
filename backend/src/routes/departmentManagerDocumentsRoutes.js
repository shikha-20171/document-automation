const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  bulkDocumentAction,
} = require("../controllers/departmentManagerDocumentsController");

/**
 * @swagger
 * /department-manager/documents:
 *   get:
 *     summary: List Department Documents
 *     tags:
 *       - Department Manager - Core
 *     responses:
 *       200:
 *         description: Documents returned.
 *   post:
 *     summary: Upload Department Document
 *     tags:
 *       - Department Manager - Core
 *     responses:
 *       201:
 *         description: Document uploaded.
 */
router.get("/", getDocuments);
router.post("/", upload.single("file"), createDocument);
router.post("/bulk", bulkDocumentAction);
router.post("/bulk-action", bulkDocumentAction);
router.get("/:id", getDocumentById);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
