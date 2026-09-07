const unifiedTemplateService = require('../services/unifiedTemplateService');

const unifiedTemplateController = {
  /**
   * GET /api/unified-templates
   */
  async listTemplates(req, res) {
    try {
      const orgId = req.user.organisationId;
      if (!orgId) return res.status(400).json({ success: false, message: 'Organisation context required.' });

      const templates = await unifiedTemplateService.listTemplates(orgId, req.query);
      return res.json({ success: true, data: templates });
    } catch (err) {
      console.error('[UnifiedTemplateController.listTemplates]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/unified-templates/:id
   */
  async getTemplate(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      const template = await unifiedTemplateService.getTemplateById(id, orgId);
      return res.json({ success: true, data: template });
    } catch (err) {
      console.error('[UnifiedTemplateController.getTemplate]', err);
      return res.status(404).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-templates
   */
  async createTemplate(req, res) {
    try {
      const orgId = req.user.organisationId;
      if (!orgId) return res.status(400).json({ success: false, message: 'Organisation context required.' });

      const template = await unifiedTemplateService.createTemplate(orgId, req.body);
      return res.status(201).json({
        success: true,
        message: `Template "${template.name}" created successfully.`,
        data: template,
      });
    } catch (err) {
      console.error('[UnifiedTemplateController.createTemplate]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * PUT /api/unified-templates/:id
   */
  async updateTemplate(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      const updated = await unifiedTemplateService.updateTemplate(id, orgId, req.body);
      return res.json({
        success: true,
        message: `Template "${updated.name}" updated successfully.`,
        data: updated,
      });
    } catch (err) {
      console.error('[UnifiedTemplateController.updateTemplate]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * DELETE /api/unified-templates/:id
   */
  async deleteTemplate(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      await unifiedTemplateService.deleteTemplate(id, orgId);
      return res.json({ success: true, message: 'Template deleted successfully.' });
    } catch (err) {
      console.error('[UnifiedTemplateController.deleteTemplate]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = unifiedTemplateController;
