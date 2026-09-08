const UnifiedOcrService = require("../services/unifiedOcrService");

const unifiedOcrController = {
  /**
   * POST /api/ocr/process
   * Upload file and run extraction with selected action
   */
  async processDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Please upload a document or image file." });
      }

      const orgId = req.user?.organisationId || req.user?.organisation_id || req.user?.organization_id || 1;
      const userId = req.user?.id || req.user?.userId || null;
      const userName = req.user?.full_name || req.user?.name || req.user?.email || "System User";
      const { action = "extract_text", customPrompt = "" } = req.body;

      const result = await UnifiedOcrService.processDocument({
        file: req.file,
        action,
        customPrompt,
        organisationId: orgId,
        userId,
        userName,
        req,
      });

      return res.json(result);
    } catch (err) {
      console.error("[UnifiedOcrController.processDocument]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * POST /api/ocr/create-document
   * Create a new document in the system directly from OCR extracted data
   */
  async createDocumentFromOcr(req, res) {
    try {
      const orgId = req.user?.organisationId || req.user?.organisation_id || req.user?.organization_id || 1;
      const userId = req.user?.id || req.user?.userId || null;
      const userName = req.user?.full_name || req.user?.name || req.user?.email || "System User";
      const { ocrData, rawText, fileName, title, documentType, category } = req.body;

      const newDoc = await UnifiedOcrService.createDocumentFromOcr({
        ocrData,
        rawText,
        fileName,
        title,
        documentType: documentType || "Invoice",
        category: category || "General",
        organisationId: orgId,
        userId,
        userName,
        req,
      });

      return res.status(201).json({
        success: true,
        message: "Document created from OCR extraction successfully.",
        data: newDoc,
      });
    } catch (err) {
      console.error("[UnifiedOcrController.createDocumentFromOcr]", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = unifiedOcrController;
