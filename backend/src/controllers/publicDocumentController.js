const unifiedDocumentService = require('../services/unifiedDocumentService');

const publicDocumentController = {
  /**
   * GET /api/public/documents/:token
   */
  async getDocument(req, res) {
    try {
      const { token } = req.params;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const userAgent = req.headers['user-agent'];

      const doc = await unifiedDocumentService.getPublicDocument(token, clientIp, userAgent);
      return res.json({ success: true, data: doc });
    } catch (err) {
      console.error('[PublicDocumentController.getDocument]', err);
      return res.status(404).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/public/documents/:token/respond
   */
  async respond(req, res) {
    try {
      const { token } = req.params;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await unifiedDocumentService.respondToPublicDocument(token, req.body, clientIp, userAgent);
      return res.json(result);
    } catch (err) {
      console.error('[PublicDocumentController.respond]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/public/documents/:token/download-pdf
   */
  async downloadPdf(req, res) {
    try {
      const { token } = req.params;
      const pdfBuffer = await unifiedDocumentService.generatePublicPdf(token);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Document-${token.slice(0, 8)}.pdf"`);
      return res.send(pdfBuffer);
    } catch (err) {
      console.error('[PublicDocumentController.downloadPdf]', err);
      return res.status(404).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/public/documents/:token/download-docx
   */
  async downloadDocx(req, res) {
    try {
      const { token } = req.params;
      const docxBuffer = await unifiedDocumentService.generatePublicDocx(token);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="Document-${token.slice(0, 8)}.docx"`);
      return res.send(docxBuffer);
    } catch (err) {
      console.error('[PublicDocumentController.downloadDocx]', err);
      return res.status(404).json({ success: false, message: err.message });
    }
  },
};

module.exports = publicDocumentController;
