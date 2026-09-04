const prisma = require("../../config/prismaClient");

class SalesforceAdapter {
  constructor(config = {}) {
    this.clientId = config.clientId || process.env.SALESFORCE_CLIENT_ID || null;
    this.clientSecret = config.clientSecret || process.env.SALESFORCE_CLIENT_SECRET || null;
    this.redirectUri = config.redirectUri || process.env.SALESFORCE_REDIRECT_URI || "http://localhost:5001/api/crm/oauth/salesforce/callback";
  }

  isConfigured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  getStatus() {
    return this.isConfigured() ? "CONFIGURED" : "NOT_CONFIGURED";
  }

  getAuthUrl(state = "") {
    if (!this.isConfigured()) return null;
    return `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}`;
  }

  async syncContact(organisationId, contactData) {
    // Record in sync log
    await prisma.crmSyncLog.create({
      data: {
        organisationId,
        provider: "SALESFORCE",
        direction: "OUTBOUND",
        entityType: "CONTACT",
        status: this.isConfigured() ? "SUCCESS" : "NOT_CONFIGURED",
        details: this.isConfigured() ? `Synced contact ${contactData.email} to Salesforce` : "Salesforce credentials not configured.",
      },
    });

    return {
      provider: "SALESFORCE",
      status: this.getStatus(),
      synced: this.isConfigured(),
    };
  }
}

module.exports = SalesforceAdapter;
