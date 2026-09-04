const express = require("express");
const router = express.Router();
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
} = require("../controllers/orgDocBuilderController");

// AI Document Generation & Transformation
router.post("/generate", generateDocumentAi);
router.post("/transform", transformDocumentAi);

// Document Lifecycle: Autosave & Submit to Workflow
router.post("/autosave", autosaveDocument);
router.post("/submit", submitDocumentToWorkflow);

// CRM & Team Recipients for dynamic variable tokens
router.get("/recipients", getCrmRecipients);

// Templates Library Management
router.get("/templates", getTemplates);
router.post("/templates", createTemplate);
router.put("/templates/:id", updateTemplate);
router.delete("/templates/:id", deleteTemplate);
router.post("/templates/:id/duplicate", duplicateTemplate);
router.patch("/templates/:id/publish", toggleTemplatePublish);

// Version History & Restores
router.get("/templates/:id/versions", getTemplateVersions);
router.post("/templates/:id/versions/:version/restore", restoreTemplateVersion);

module.exports = router;
