const express = require('express');
const router = express.Router();
const publicDocumentController = require('../controllers/publicDocumentController');

// Public endpoints - no auth required
router.get('/:token', publicDocumentController.getDocument);
router.post('/:token/respond', publicDocumentController.respond);
router.get('/:token/download-pdf', publicDocumentController.downloadPdf);
router.get('/:token/download-docx', publicDocumentController.downloadDocx);

module.exports = router;
