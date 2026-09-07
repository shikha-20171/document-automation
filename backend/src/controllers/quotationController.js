const quotationService = require('../services/quotationService');
const { generateQuotationFromAI } = require('../services/aiQuotationService');

/**
 * Quotation Management Controller
 */
const quotationController = {
  /**
   * GET /api/quotations
   */
  async listQuotations(req, res) {
    try {
      const orgId = req.user.organisationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'Organisation context required.' });
      }

      const result = await quotationService.listQuotations(orgId, req.query);
      return res.json({ success: true, ...result });
    } catch (error) {
      console.error('[QuotationController.listQuotations]', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/quotations/metrics
   */
  async getMetrics(req, res) {
    try {
      const orgId = req.user.organisationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'Organisation context required.' });
      }

      const metrics = await quotationService.getQuotationMetrics(orgId);
      return res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('[QuotationController.getMetrics]', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/quotations/:id
   */
  async getQuotation(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      const quotation = await quotationService.getQuotationById(id, orgId);
      return res.json({ success: true, data: quotation });
    } catch (error) {
      console.error('[QuotationController.getQuotation]', error);
      return res.status(404).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/quotations
   */
  async createQuotation(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;

      if (!orgId) {
        return res.status(400).json({ success: false, message: 'Organisation context required.' });
      }

      const quotation = await quotationService.createQuotation(orgId, userId, userName, req.body, req);
      return res.status(201).json({
        success: true,
        message: `Quotation ${quotation.quotationNumber} created successfully.`,
        data: quotation,
      });
    } catch (error) {
      console.error('[QuotationController.createQuotation]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * PUT /api/quotations/:id
   */
  async updateQuotation(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;
      const { id } = req.params;

      const updated = await quotationService.updateQuotation(id, orgId, userId, userName, req.body, req);
      return res.json({
        success: true,
        message: `Quotation ${updated.quotationNumber} updated successfully.`,
        data: updated,
      });
    } catch (error) {
      console.error('[QuotationController.updateQuotation]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * DELETE /api/quotations/:id
   */
  async deleteQuotation(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;
      const { id } = req.params;

      const result = await quotationService.deleteQuotation(id, orgId, userId, userName, req);
      return res.json(result);
    } catch (error) {
      console.error('[QuotationController.deleteQuotation]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/quotations/:id/duplicate
   */
  async duplicateQuotation(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;
      const { id } = req.params;

      const duplicate = await quotationService.duplicateQuotation(id, orgId, userId, userName, req);
      return res.status(201).json({
        success: true,
        message: `Quotation duplicated as ${duplicate.quotationNumber}.`,
        data: duplicate,
      });
    } catch (error) {
      console.error('[QuotationController.duplicateQuotation]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/quotations/ai-generate
   * Generates a draft quotation structure from natural language prompt
   */
  async generateFromAI(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const { prompt, clientContext, templateContext } = req.body;

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ success: false, message: 'Please provide a prompt to generate a quotation.' });
      }

      const generatedData = await generateQuotationFromAI({
        prompt,
        organisationId: orgId,
        userId,
        clientContext,
        templateContext,
      });

      return res.json({
        success: true,
        message: 'Quotation generated successfully from prompt.',
        data: generatedData,
      });
    } catch (error) {
      console.error('[QuotationController.generateFromAI]', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/quotations/:id/save-as-template
   */
  async saveAsTemplate(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;
      const { name, category, description } = req.body;

      const template = await quotationService.saveQuotationAsTemplate(id, orgId, {
        name,
        category,
        description,
      });

      return res.status(201).json({
        success: true,
        message: `Template "${template.name}" created successfully.`,
        data: template,
      });
    } catch (error) {
      console.error('[QuotationController.saveAsTemplate]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/quotations/:id/send-email
   */
  async sendEmail(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;
      const { id } = req.params;
      const { recipientEmail, recipientName, customMessage, subject } = req.body;

      const result = await quotationService.sendQuotationEmail(id, orgId, userId, userName, {
        recipientEmail,
        recipientName,
        customMessage,
        subject,
      }, req);

      return res.json(result);
    } catch (error) {
      console.error('[QuotationController.sendEmail]', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/quotations/:id/download-pdf
   */
  async downloadPdf(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      const pdfBuffer = await quotationService.generatePdfForQuotation(id, orgId);
      const quote = await quotationService.getQuotationById(id, orgId);

      const filename = `${quote.quotationNumber || 'Quotation'}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error('[QuotationController.downloadPdf]', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};

module.exports = quotationController;
