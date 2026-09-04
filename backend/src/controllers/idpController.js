const DocumentIntelligenceService = require("../services/documentIntelligenceService");

const getAuthContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || 1,
});

/**
 * POST /api/idp/process
 * Process document for IDP classification & structured entity extraction
 */
const processDocument = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const { documentId, filePath, mimeType, documentName, textContent } = req.body;

    let result;
    if (filePath) {
      result = await DocumentIntelligenceService.processDocument({
        organisationId,
        documentId,
        filePath,
        mimeType: mimeType || "application/pdf",
        documentName,
      });
    } else if (textContent) {
      const docType = DocumentIntelligenceService.classifyDocument(textContent);
      const { structured, confidence } = DocumentIntelligenceService.extractEntities(textContent, docType);
      result = {
        documentType: docType,
        confidenceScore: confidence,
        structuredData: structured,
      };
    } else {
      return res.status(400).json({ success: false, message: "filePath or textContent is required." });
    }

    res.status(200).json({
      success: true,
      message: "Document analyzed and structured entities extracted successfully.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/idp/extractions
 * List IDP extraction history
 */
const listExtractions = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const extractions = await DocumentIntelligenceService.listExtractions(organisationId);
    res.json({ success: true, data: extractions });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/idp/extractions/:id
 * Get single extraction record
 */
const getExtractionById = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const extraction = await DocumentIntelligenceService.getExtractionById(req.params.id, organisationId);

    if (!extraction) {
      return res.status(404).json({ success: false, message: "Extraction record not found." });
    }

    res.json({ success: true, data: extraction });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  processDocument,
  listExtractions,
  getExtractionById,
};
