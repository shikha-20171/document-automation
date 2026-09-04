const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getOrgDocuments,
  createOrgDocument,
  uploadOrgDocument,
  getOrgDocumentById,
  getDocumentDownloadUrl,
  deleteOrgDocument,
} = require("../controllers/orgDocumentsController");
const {
  searchDocuments,
  addComment,
  getComments,
} = require("../controllers/documentSearchController");

router.use(verifyToken);

router.get("/search", searchDocuments);
router.get("/", getOrgDocuments);
router.post("/", createOrgDocument);
router.post("/upload", upload.singleDocument, uploadOrgDocument);
router.get("/:id/comments", getComments);
router.post("/:id/comments", addComment);
router.get("/:id/download", getDocumentDownloadUrl);
router.get("/:id", getOrgDocumentById);
router.delete("/:id", deleteOrgDocument);

module.exports = router;
