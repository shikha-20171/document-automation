const express = require("express");
const router = express.Router();
const {
  getTemplates,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
} = require("../controllers/departmentManagerTemplatesController");

/**
 * @swagger
 * /department-manager/templates:
 *   get:
 *     summary: List Department Templates
 *     tags:
 *       - Department Manager - Core
 *     responses:
 *       200:
 *         description: Templates returned.
 *   post:
 *     summary: Create Template
 *     tags:
 *       - Department Manager - Core
 *     responses:
 *       201:
 *         description: Template created.
 */
router.get("/", getTemplates);
router.post("/", createTemplate);
router.put("/:id", updateTemplate);
router.post("/:id/duplicate", duplicateTemplate);
router.delete("/:id", deleteTemplate);

module.exports = router;
