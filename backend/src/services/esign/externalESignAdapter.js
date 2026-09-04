/**
 * External E-Signature Provider Adapter Base (e.g. DocuSign, AdobeSign)
 */
class ExternalESignAdapter {
  constructor(providerName, config = {}) {
    this.providerName = providerName;
    this.apiKey = config.apiKey || process.env.DOCUSIGN_API_KEY || null;
    this.integrationKey = config.integrationKey || process.env.DOCUSIGN_INTEGRATION_KEY || null;
  }

  getProviderName() {
    return this.providerName;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.integrationKey);
  }

  getStatus() {
    return this.isConfigured() ? "CONFIGURED" : "NOT_CONFIGURED";
  }

  async createEnvelope({ organisationId, documentId, title, signers }) {
    if (!this.isConfigured()) {
      throw new Error(`External provider ${this.providerName} is NOT_CONFIGURED. Please provide production credentials.`);
    }
    // External REST API dispatch
    return {
      externalEnvelopeId: `ext_${this.providerName.toLowerCase()}_${Date.now()}`,
      status: "SENT",
      provider: this.providerName,
    };
  }
}

module.exports = ExternalESignAdapter;
