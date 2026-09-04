const express = require("express");
const router = express.Router();
const {
  getDocuments,
  getDocumentDetail,
  addDocumentComment,
  updateDocumentAction,
} = require("../controllers/teamLeaderDocumentsController");

/**
 * @swagger
 * /team-leader/documents:
 *   get:
 *     summary: List Team Documents
 *     tags:
 *       - Team Leader - Documents
 *     responses:
 *       200:
 *         description: Document list returned.
 */
router.get("/", getDocuments);
router.get("/:id", getDocumentDetail);
router.post("/:id/comments", addDocumentComment);
router.post("/:id/action", updateDocumentAction);

module.exports = router;
