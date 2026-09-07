const express = require('express');
const router = express.Router();
const publicQuotationController = require('../controllers/publicQuotationController');

// Public portal routes - no authentication middleware required
router.get('/:token', publicQuotationController.getQuotation);
router.post('/:token/respond', publicQuotationController.respond);
router.get('/:token/download-pdf', publicQuotationController.downloadPdf);

module.exports = router;
