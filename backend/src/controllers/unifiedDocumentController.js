const unifiedDocumentService = require('../services/unifiedDocumentService');
const { detectDocumentIntent, generateStructuredDocumentFromAI } = require('../services/aiDocumentBuilderService');

const unifiedDocumentController = {
  /**
   * GET /api/unified-documents
   */
  async listDocuments(req, res) {
    try {
      const orgId = req.user.organisationId;
      if (!orgId) return res.status(400).json({ success: false, message: 'Organisation context required.' });

      const result = await unifiedDocumentService.listDocuments(orgId, req.query);
      return res.json({ success: true, ...result });
    } catch (err) {
      console.error('[UnifiedDocumentController.listDocuments]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/unified-documents/metrics
   */
  async getMetrics(req, res) {
    try {
      const orgId = req.user.organisationId;
      if (!orgId) return res.status(400).json({ success: false, message: 'Organisation context required.' });

      const metrics = await unifiedDocumentService.getDocumentMetrics(orgId);
      return res.json({ success: true, data: metrics });
    } catch (err) {
      console.error('[UnifiedDocumentController.getMetrics]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/detect-intent
   */
  async detectIntent(req, res) {
    try {
      const { prompt } = req.body;
      const detected = detectDocumentIntent(prompt);
      return res.json({ success: true, data: detected });
    } catch (err) {
      console.error('[UnifiedDocumentController.detectIntent]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/ai-generate
   */
  async generateWithAi(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const { prompt, clientContext, templateContext, documentTypeOverride, categoryOverride } = req.body;

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ success: false, message: 'Please describe the document you want to create.' });
      }

      const generated = await generateStructuredDocumentFromAI({
        prompt,
        organisationId: orgId,
        userId,
        clientContext,
        templateContext,
        documentTypeOverride,
        categoryOverride,
      });

      return res.json({ success: true, message: 'Document generated successfully.', data: generated });
    } catch (err) {
      console.error('[UnifiedDocumentController.generateWithAi]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/unified-documents/:id
   */
  async getDocument(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      const document = await unifiedDocumentService.getDocumentById(id, orgId);
      return res.json({ success: true, data: document });
    } catch (err) {
      console.error('[UnifiedDocumentController.getDocument]', err);
      return res.status(404).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents
   */
  async createDocument(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;

      if (!orgId) return res.status(400).json({ success: false, message: 'Organisation context required.' });

      const newDoc = await unifiedDocumentService.createDocument(orgId, userId, userName, req.body, req);
      return res.status(201).json({
        success: true,
        message: `Document ${newDoc.documentNumber} created successfully.`,
        data: newDoc,
      });
    } catch (err) {
      console.error('[UnifiedDocumentController.createDocument]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * PUT /api/unified-documents/:id
   */
  async updateDocument(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;
      const { id } = req.params;

      const updated = await unifiedDocumentService.updateDocument(id, orgId, userId, userName, req.body, req);
      return res.json({
        success: true,
        message: `Document ${updated.documentNumber} updated to version ${updated.currentVersion}.`,
        data: updated,
      });
    } catch (err) {
      console.error('[UnifiedDocumentController.updateDocument]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/restore-version/:versionNumber
   */
  async restoreVersion(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;
      const { id, versionNumber } = req.params;

      const restored = await unifiedDocumentService.restoreDocumentVersion(
        id,
        versionNumber,
        orgId,
        userId,
        userName,
        req
      );

      return res.json({
        success: true,
        message: `Restored to version ${versionNumber}. Now at version ${restored.currentVersion}.`,
        data: restored,
      });
    } catch (err) {
      console.error('[UnifiedDocumentController.restoreVersion]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * DELETE /api/unified-documents/:id
   */
  async deleteDocument(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;
      const { id } = req.params;

      const result = await unifiedDocumentService.deleteDocument(id, orgId, userId, userName, req);
      return res.json(result);
    } catch (err) {
      console.error('[UnifiedDocumentController.deleteDocument]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/duplicate
   */
  async duplicateDocument(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;
      const { id } = req.params;

      const duplicate = await unifiedDocumentService.duplicateDocument(id, orgId, userId, userName, req);
      return res.status(201).json({
        success: true,
        message: `Duplicated as ${duplicate.documentNumber}.`,
        data: duplicate,
      });
    } catch (err) {
      console.error('[UnifiedDocumentController.duplicateDocument]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/save-as-template
   */
  async saveAsTemplate(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;
      const { name, category, description } = req.body;

      const template = await unifiedDocumentService.saveDocumentAsTemplate(id, orgId, { name, category, description });
      return res.status(201).json({
        success: true,
        message: `Template "${template.name}" created successfully.`,
        data: template,
      });
    } catch (err) {
      console.error('[UnifiedDocumentController.saveAsTemplate]', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/send-email
   */
  async sendEmail(req, res) {
    try {
      const orgId = req.user.organisationId;
      const userId = req.user.userId || req.user.id;
      const userName = req.user.name || req.user.email;
      const { id } = req.params;

      const result = await unifiedDocumentService.sendDocumentEmail(id, orgId, userId, userName, req.body, req);
      return res.json(result);
    } catch (err) {
      console.error('[UnifiedDocumentController.sendEmail]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/unified-documents/:id/download-pdf
   */
  async downloadPdf(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      const pdfBuffer = await unifiedDocumentService.generatePdfForDocument(id, orgId);
      const doc = await unifiedDocumentService.getDocumentById(id, orgId);

      const filename = `${doc.documentNumber || 'Document'}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    } catch (err) {
      console.error('[UnifiedDocumentController.downloadPdf]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/unified-documents/:id/download-docx
   */
  async downloadDocx(req, res) {
    try {
      const orgId = req.user.organisationId;
      const { id } = req.params;

      const docxBuffer = await unifiedDocumentService.generateDocxForDocument(id, orgId);
      const doc = await unifiedDocumentService.getDocumentById(id, orgId);

      const filename = `${doc.documentNumber || 'Document'}.docx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(docxBuffer);
    } catch (err) {
      console.error('[UnifiedDocumentController.downloadDocx]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = unifiedDocumentController;
