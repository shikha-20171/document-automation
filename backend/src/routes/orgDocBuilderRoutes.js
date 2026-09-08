const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateDocumentAi,
  transformDocumentAi,
  autosaveDocument,
  submitDocumentToWorkflow,
  getCrmRecipients,
  getTemplates,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
  deleteTemplate,
  toggleTemplatePublish,
  getTemplateVersions,
  restoreTemplateVersion,
  generateDocumentFromTemplate,
  shareTemplate,
} = require("../controllers/orgDocBuilderController");

// Protect all routes with authMiddleware
router.use(authMiddleware);

// AI Document Generation & Transformation
router.post("/generate", generateDocumentAi);
router.post("/transform", transformDocumentAi);

// Document Lifecycle: Autosave & Submit to Workflow
router.post("/autosave", autosaveDocument);
router.post("/submit", submitDocumentToWorkflow);

// CRM & Team Recipients for dynamic variable tokens
router.get("/recipients", getCrmRecipients);

// Generate Document from Template Instance
router.post("/generate-document", generateDocumentFromTemplate);
router.post("/templates/generate-document", generateDocumentFromTemplate);
router.post("/templates/:id/generate", generateDocumentFromTemplate);
router.post("/templates/:id/render", generateDocumentFromTemplate);
router.post("/:id/generate", generateDocumentFromTemplate);
router.post("/:id/render", generateDocumentFromTemplate);

// Templates Library Management (supporting both / and /templates paths)
router.get("/templates", getTemplates);
router.get("/", getTemplates);

router.post("/templates", createTemplate);
router.post("/", createTemplate);

router.put("/templates/:id", updateTemplate);
router.put("/:id", updateTemplate);

router.delete("/templates/:id", deleteTemplate);
router.delete("/:id", deleteTemplate);

router.post("/templates/:id/duplicate", duplicateTemplate);
router.post("/:id/duplicate", duplicateTemplate);

router.post("/templates/:id/share", shareTemplate);
router.post("/:id/share", shareTemplate);
router.post("/share", shareTemplate);

router.patch("/templates/:id/publish", toggleTemplatePublish);
router.patch("/:id/publish", toggleTemplatePublish);

// Version History & Restores
router.get("/templates/:id/versions", getTemplateVersions);
router.get("/:id/versions", getTemplateVersions);

router.post("/templates/:id/versions/:version/restore", restoreTemplateVersion);
router.post("/:id/versions/:version/restore", restoreTemplateVersion);

module.exports = router;

