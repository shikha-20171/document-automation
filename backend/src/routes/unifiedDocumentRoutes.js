const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const unifiedDocumentController = require('../controllers/unifiedDocumentController');

router.use(verifyToken);
router.use(authorizeRoles('SUPER_ADMIN', 'ORGANISATION_ADMIN', 'DEPARTMENT_MANAGER', 'TEAM_LEADER', 'STAFF'));

// Metrics & AI
router.get('/metrics', unifiedDocumentController.getMetrics);
router.post('/detect-intent', unifiedDocumentController.detectIntent);
router.post('/ai-generate', unifiedDocumentController.generateWithAi);
router.post('/ai-edit', unifiedDocumentController.editWithAi);

// Document CRUD
router.get('/', unifiedDocumentController.listDocuments);
router.post('/', unifiedDocumentController.createDocument);
router.get('/:id', unifiedDocumentController.getDocument);
router.put('/:id', unifiedDocumentController.updateDocument);
router.delete('/:id', unifiedDocumentController.deleteDocument);

// Specific Actions
router.post('/:id/duplicate', unifiedDocumentController.duplicateDocument);
router.post('/:id/save-as-template', unifiedDocumentController.saveAsTemplate);
router.post('/:id/restore-version/:versionNumber', unifiedDocumentController.restoreVersion);
router.post('/:id/send-email', unifiedDocumentController.sendEmail);
router.get('/:id/download-pdf', unifiedDocumentController.downloadPdf);
router.get('/:id/download-docx', unifiedDocumentController.downloadDocx);

// Complete Document Lifecycle Actions
router.post('/:id/assign', unifiedDocumentController.assignDocument);
router.post('/:id/share', unifiedDocumentController.shareDocument);
router.post('/:id/submit-approval', unifiedDocumentController.submitForApproval);
router.post('/:id/approval-action', unifiedDocumentController.processApproval);
router.post('/:id/send-for-signature', unifiedDocumentController.sendForSignature);
router.post('/:id/sign', unifiedDocumentController.signDocument);
router.post('/:id/archive', unifiedDocumentController.archiveDocument);
router.post('/:id/restore', unifiedDocumentController.restoreDocument);
router.post('/:id/comments', unifiedDocumentController.addComment);
router.get('/:id/audit-logs', unifiedDocumentController.getAuditLogs);

module.exports = router;
