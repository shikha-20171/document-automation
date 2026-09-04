const ESignatureService = require("../services/eSignatureService");

const getAuthContext = (req) => ({
  organisationId: req.user?.organisation_id || req.user?.organization_id || 1,
  userId: req.user?.id || 1,
});

/**
 * POST /api/e-sign/envelopes
 * Create e-signature envelope
 */
const createEnvelope = async (req, res, next) => {
  try {
    const { organisationId, userId } = getAuthContext(req);
    const { documentId, title, signers, signingOrder } = req.body;

    if (!documentId) {
      return res.status(400).json({ success: false, message: "documentId is required." });
    }

    const envelope = await ESignatureService.createEnvelope({
      organisationId,
      documentId,
      title,
      signers,
      signingOrder,
      createdById: userId,
    });

    res.status(201).json({
      success: true,
      message: "E-signature envelope created and sent to recipients.",
      data: envelope,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/e-sign/envelopes/:envelopeId/sign
 * Sign envelope recipient step
 */
const signEnvelope = async (req, res, next) => {
  try {
    const { envelopeId } = req.params;
    const { recipientId, signatureData } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Browser";

    const result = await ESignatureService.signEnvelope({
      envelopeId,
      recipientId,
      signatureData,
      ipAddress,
      userAgent,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/e-sign/envelopes
 * List e-signature envelopes
 */
const listEnvelopes = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const envelopes = await ESignatureService.listEnvelopes(organisationId);
    res.json({ success: true, data: envelopes });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/e-sign/envelopes/:id
 * Get envelope details and certificate
 */
const getEnvelopeById = async (req, res, next) => {
  try {
    const { organisationId } = getAuthContext(req);
    const envelope = await ESignatureService.getEnvelopeById(req.params.id, organisationId);

    if (!envelope) {
      return res.status(404).json({ success: false, message: "Signature envelope not found." });
    }

    res.json({ success: true, data: envelope });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEnvelope,
  signEnvelope,
  listEnvelopes,
  getEnvelopeById,
};
