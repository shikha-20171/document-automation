const unifiedDocumentService = require('../services/unifiedDocumentService');
const { detectDocumentIntent, generateStructuredDocumentFromAI, editDocumentWithAI } = require('../services/aiDocumentBuilderService');

/**
 * Extract resilient tenant organisation ID from user token or request headers
 */
function getOrgId(req) {
  const resolved =
    req.user?.organisationId ||
    req.user?.organisation_id ||
    req.user?.organization_id ||
    (req.headers && req.headers['x-organisation-id'] ? parseInt(req.headers['x-organisation-id'], 10) : null) ||
    1;
  return Number(resolved) || 1;
}

function getUserId(req) {
  return req.user?.id || req.user?.userId || 1;
}

function getUserName(req) {
  return req.user?.full_name || req.user?.name || req.user?.email || 'User';
}

const unifiedDocumentController = {
  /**
   * GET /api/unified-documents
   */
  async listDocuments(req, res) {
    try {
      const orgId = getOrgId(req);
      const result = await unifiedDocumentService.listDocuments(orgId, req.query, req.user);
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
      const orgId = getOrgId(req);
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
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const { prompt, clientContext, templateContext, documentTypeOverride, categoryOverride, companyName } = req.body;
      const effectiveCompany = companyName || req.body.companyContext?.name || null;

      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ success: false, message: 'Please describe the document you want to create.' });
      }

      const generated = await generateStructuredDocumentFromAI({
        prompt,
        organisationId: orgId,
        userId,
        clientContext,
        companyName: effectiveCompany,
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
   * POST /api/unified-documents/ai-edit
   */
  async editWithAi(req, res) {
    try {
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const { document, instruction, sectionId, action } = req.body;

      if (!document) {
        return res.status(400).json({ success: false, message: 'Document object required.' });
      }

      const updated = await editDocumentWithAI({
        document,
        instruction,
        sectionId,
        action,
        organisationId: orgId,
        userId,
      });

      return res.json({ success: true, message: 'Document updated successfully with AI.', data: updated });
    } catch (err) {
      console.error('[UnifiedDocumentController.editWithAi]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/unified-documents/:id
   */
  async getDocument(req, res) {
    try {
      const orgId = getOrgId(req);
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
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const userName = getUserName(req);

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
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const userName = getUserName(req);
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
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const userName = getUserName(req);
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
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const userName = getUserName(req);
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
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const userName = getUserName(req);
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
      const orgId = getOrgId(req);
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
      const orgId = getOrgId(req);
      const userId = getUserId(req);
      const userName = getUserName(req);
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
      const orgId = getOrgId(req);
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
      const orgId = getOrgId(req);
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

  /**
   * POST /api/unified-documents/:id/assign
   */
  async assignDocument(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const updated = await unifiedDocumentService.assignDocument(id, orgId, req.body, req.user, req);
      return res.json({ success: true, message: 'Document assigned successfully.', data: updated });
    } catch (err) {
      console.error('[UnifiedDocumentController.assignDocument]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/share
   */
  async shareDocument(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const share = await unifiedDocumentService.shareDocument(id, orgId, req.body, req.user, req);
      return res.json({ success: true, message: 'Document shared successfully.', data: share });
    } catch (err) {
      console.error('[UnifiedDocumentController.shareDocument]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/submit-approval
   */
  async submitForApproval(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const result = await unifiedDocumentService.submitForApproval(id, orgId, req.body, req.user, req);
      return res.json({ success: true, message: 'Document submitted for approval.', data: result });
    } catch (err) {
      console.error('[UnifiedDocumentController.submitForApproval]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/approval-action
   */
  async processApproval(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const result = await unifiedDocumentService.processApproval(id, orgId, req.body, req.user, req);
      return res.json({ success: true, message: `Approval action processed: ${req.body.action}`, data: result });
    } catch (err) {
      console.error('[UnifiedDocumentController.processApproval]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/send-for-signature
   */
  async sendForSignature(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const envelope = await unifiedDocumentService.sendForSignature(id, orgId, req.body, req.user, req);
      return res.status(201).json({ success: true, message: 'Signature request dispatched.', data: envelope });
    } catch (err) {
      console.error('[UnifiedDocumentController.sendForSignature]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/sign
   */
  async signDocument(req, res) {
    try {
      const { id } = req.params;
      const { envelopeId, recipientId, signatureData } = req.body;
      const result = await unifiedDocumentService.signDocument(
        envelopeId || id,
        recipientId || req.body,
        signatureData || req.body.signatureData,
        req
      );
      return res.json(result);
    } catch (err) {
      console.error('[UnifiedDocumentController.signDocument]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/archive
   */
  async archiveDocument(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const updated = await unifiedDocumentService.archiveDocument(id, orgId, req.user, req);
      return res.json({ success: true, message: 'Document archived.', data: updated });
    } catch (err) {
      console.error('[UnifiedDocumentController.archiveDocument]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/restore
   */
  async restoreDocument(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const updated = await unifiedDocumentService.restoreDocument(id, orgId, req.user, req);
      return res.json({ success: true, message: 'Document restored.', data: updated });
    } catch (err) {
      console.error('[UnifiedDocumentController.restoreDocument]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/comments
   */
  async addComment(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const comment = await unifiedDocumentService.addComment(id, orgId, req.body, req.user, req);
      return res.status(201).json({ success: true, message: 'Comment added.', data: comment });
    } catch (err) {
      console.error('[UnifiedDocumentController.addComment]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/unified-documents/:id/audit-logs
   */
  async getAuditLogs(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const logs = await unifiedDocumentService.getAuditLogs(id, orgId);
      return res.json({ success: true, data: logs });
    } catch (err) {
      console.error('[UnifiedDocumentController.getAuditLogs]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/upload-process
   */
  async uploadAndProcess(req, res) {
    try {
      const orgId = getOrgId(req);
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded for processing.' });
      }
      const user = {
        id: getUserId(req),
        name: getUserName(req),
        role: req.user?.role || 'STAFF',
      };
      const document = await unifiedDocumentService.uploadAndProcessDocument(orgId, user, req.file, req.body, req);
      return res.status(201).json({
        success: true,
        message: `Document processed successfully (${document.status}).`,
        data: document,
      });
    } catch (err) {
      console.error('[UnifiedDocumentController.uploadAndProcess]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/review-action
   */
  async processReviewAction(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const user = {
        id: getUserId(req),
        name: getUserName(req),
        role: req.user?.role || 'STAFF',
      };
      const updated = await unifiedDocumentService.processReviewAction(id, orgId, user, req.body, req);
      return res.json({
        success: true,
        message: 'Document review action recorded.',
        data: updated,
      });
    } catch (err) {
      console.error('[UnifiedDocumentController.processReviewAction]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/unified-documents/:id/chat
   */
  async chatWithDocument(req, res) {
    try {
      const orgId = getOrgId(req);
      const { id } = req.params;
      const { query } = req.body;
      if (!query || !query.trim()) {
        return res.status(400).json({ success: false, message: 'Question query is required.' });
      }
      const user = {
        id: getUserId(req),
        name: getUserName(req),
      };
      const response = await unifiedDocumentService.chatWithDocument(id, orgId, user, query);
      return res.json(response);
    } catch (err) {
      console.error('[UnifiedDocumentController.chatWithDocument]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * GET /api/unified-documents/audit-logs/all
   */
  async getOrganisationAuditLogs(req, res) {
    try {
      const orgId = getOrgId(req);
      const logsData = await unifiedDocumentService.getOrganisationAuditLogs(orgId, req.query);
      return res.json({ success: true, data: logsData });
    } catch (err) {
      console.error('[UnifiedDocumentController.getOrganisationAuditLogs]', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = unifiedDocumentController;
