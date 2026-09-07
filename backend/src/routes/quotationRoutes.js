const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const quotationController = require('../controllers/quotationController');

// All quotation management routes require authenticated token
router.use(verifyToken);
router.use(authorizeRoles('SUPER_ADMIN', 'ORGANISATION_ADMIN', 'DEPARTMENT_MANAGER', 'TEAM_LEADER', 'STAFF'));

// ─── Metrics & Generation ──────────────────────────────────
router.get('/metrics', quotationController.getMetrics);
router.post('/ai-generate', quotationController.generateFromAI);

// ─── Quotation CRUD ────────────────────────────────────────
router.get('/', quotationController.listQuotations);
router.post('/', quotationController.createQuotation);
router.get('/:id', quotationController.getQuotation);
router.put('/:id', quotationController.updateQuotation);
router.delete('/:id', quotationController.deleteQuotation);

// ─── Specific Actions ──────────────────────────────────────
router.post('/:id/duplicate', quotationController.duplicateQuotation);
router.post('/:id/save-as-template', quotationController.saveAsTemplate);
router.post('/:id/send-email', quotationController.sendEmail);
router.get('/:id/download-pdf', quotationController.downloadPdf);

module.exports = router;
