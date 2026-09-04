const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  createForm,
  listForms,
  getFormById,
  submitForm,
} = require("../controllers/formController");

router.use(verifyToken);

router.post("/", createForm);
router.get("/", listForms);
router.get("/:id", getFormById);
router.post("/:id/submit", submitForm);

module.exports = router;
