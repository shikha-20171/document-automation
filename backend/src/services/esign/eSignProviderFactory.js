const InternalESignProvider = require("./internalESignProvider");
const ExternalESignAdapter = require("./externalESignAdapter");

class ESignProviderFactory {
  static getProvider(providerName = "INTERNAL") {
    const p = providerName.toUpperCase();
    if (p === "DOCUSIGN" || p === "ADOBE_SIGN") {
      return new ExternalESignAdapter(p);
    }
    return InternalESignProvider;
  }

  static getSupportedProviders() {
    return [
      { code: "INTERNAL", name: "DocuCore Cryptographic E-Sign", type: "INTERNAL_ENGINE", status: "CONFIGURED" },
      { code: "DOCUSIGN", name: "DocuSign eSignature API", type: "REAL_PROVIDER", status: process.env.DOCUSIGN_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED" },
      { code: "ADOBE_SIGN", name: "Adobe Acrobat Sign API", type: "REAL_PROVIDER", status: process.env.ADOBE_SIGN_API_KEY ? "CONFIGURED" : "NOT_CONFIGURED" },
    ];
  }
}

module.exports = ESignProviderFactory;
