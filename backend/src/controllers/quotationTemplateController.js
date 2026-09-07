const quotationTemplateService = require('../services/quotationTemplateService');

const quotationTemplateController = {
  /**
   * GET /api/quotation-templates
   */
  async listTemplates(req, res) {
    try {
      const orgId = req.user.organisationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'Organisation context required.' });
      }

      const templates = await quotationTemplateService.listTemplates(orgId, req.query);
      return res.json({ success: true, data: templates });
    } catch (error) {
      console.error('[QuotationTemplateController.listTemplates]', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * GET /api/quotation-templates/:id
   */
  async getTemplate(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      const template = await quotationTemplateService.getTemplateById(id, orgId);
      return res.json({ success: true, data: template });
    } catch (error) {
      console.error('[QuotationTemplateController.getTemplate]', error);
      return res.status(404).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/quotation-templates
   */
  async createTemplate(req, res) {
    try {
      const orgId = req.user.organisationId;
      if (!orgId) {
        return res.status(400).json({ success: false, message: 'Organisation context required.' });
      }

      const template = await quotationTemplateService.createTemplate(orgId, req.body);
      return res.status(201).json({
        success: true,
        message: `Template "${template.name}" created successfully.`,
        data: template,
      });
    } catch (error) {
      console.error('[QuotationTemplateController.createTemplate]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * PUT /api/quotation-templates/:id
   */
  async updateTemplate(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      const updated = await quotationTemplateService.updateTemplate(id, orgId, req.body);
      return res.json({
        success: true,
        message: `Template "${updated.name}" updated successfully.`,
        data: updated,
      });
    } catch (error) {
      console.error('[QuotationTemplateController.updateTemplate]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * DELETE /api/quotation-templates/:id
   */
  async deleteTemplate(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      await quotationTemplateService.deleteTemplate(id, orgId);
      return res.json({ success: true, message: 'Quotation template deleted successfully.' });
    } catch (error) {
      console.error('[QuotationTemplateController.deleteTemplate]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  },
};

module.exports = quotationTemplateController;
