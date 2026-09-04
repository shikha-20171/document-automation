const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  createEnvelope,
  signEnvelope,
  listEnvelopes,
  getEnvelopeById,
} = require("../controllers/eSignatureController");

router.use(verifyToken);

router.post("/envelopes", createEnvelope);
router.get("/envelopes", listEnvelopes);
router.get("/envelopes/:id", getEnvelopeById);
router.post("/envelopes/:envelopeId/sign", signEnvelope);

module.exports = router;
