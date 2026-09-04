const ESignProviderFactory = require("./esign/eSignProviderFactory");

class ESignatureService {
  static getProviders() {
    return ESignProviderFactory.getSupportedProviders();
  }

  static async createEnvelope({ organisationId, documentId, title, signers, signingOrder = "SEQUENTIAL", createdById, provider = "INTERNAL" }) {
    const activeProvider = ESignProviderFactory.getProvider(provider);
    return await activeProvider.createEnvelope({ organisationId, documentId, title, signers, signingOrder, createdById });
  }

  static async signEnvelope({ envelopeId, recipientId, signatureData, ipAddress, userAgent, provider = "INTERNAL" }) {
    const activeProvider = ESignProviderFactory.getProvider(provider);
    return await activeProvider.signEnvelope({ envelopeId, recipientId, signatureData, ipAddress, userAgent });
  }

  static async getEnvelopeById(envelopeId, organisationId, provider = "INTERNAL") {
    const activeProvider = ESignProviderFactory.getProvider(provider);
    return await activeProvider.getEnvelopeById(envelopeId, organisationId);
  }

  static async listEnvelopes(organisationId, provider = "INTERNAL") {
    const activeProvider = ESignProviderFactory.getProvider(provider);
    return await activeProvider.listEnvelopes(organisationId);
  }
}

module.exports = ESignatureService;

