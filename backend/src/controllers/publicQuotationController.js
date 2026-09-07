const quotationService = require('../services/quotationService');

const publicQuotationController = {
  /**
   * GET /api/public/quotations/:token
   */
  async getQuotation(req, res) {
    try {
      const { token } = req.params;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const userAgent = req.headers['user-agent'];

      const quotation = await quotationService.getPublicQuotation(token, clientIp, userAgent);
      return res.json({ success: true, data: quotation });
    } catch (error) {
      console.error('[PublicQuotationController.getQuotation]', error);
      return res.status(404).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/public/quotations/:token/respond
   */
  async respond(req, res) {
    try {
      const { token } = req.params;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await quotationService.respondToPublicQuotation(token, req.body, clientIp, userAgent);
      return res.json(result);
    } catch (error) {
      console.error('[PublicQuotationController.respond]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/public/quotations/:token/download-pdf
   */
  async downloadPdf(req, res) {
    try {
      const { token } = req.params;
      const pdfBuffer = await quotationService.generatePublicPdf(token);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Quotation-${token.slice(0, 8)}.pdf"`);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error('[PublicQuotationController.downloadPdf]', error);
      return res.status(404).json({ success: false, message: error.message });
    }
  },
};

module.exports = publicQuotationController;
