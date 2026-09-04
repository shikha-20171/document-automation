const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  searchDocuments,
  addComment,
  getComments,
} = require("../controllers/documentSearchController");

router.use(verifyToken);

router.get("/search", searchDocuments);
router.post("/:id/comments", addComment);
router.get("/:id/comments", getComments);

module.exports = router;
