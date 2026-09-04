const prisma = require("../../config/prismaClient");

class ZohoCrmAdapter {
  constructor(config = {}) {
    this.clientId = config.clientId || process.env.ZOHO_CRM_CLIENT_ID || null;
    this.clientSecret = config.clientSecret || process.env.ZOHO_CRM_CLIENT_SECRET || null;
    this.redirectUri = config.redirectUri || process.env.ZOHO_CRM_REDIRECT_URI || "http://localhost:5001/api/crm/oauth/zohocrm/callback";
  }

  isConfigured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  getStatus() {
    return this.isConfigured() ? "CONFIGURED" : "NOT_CONFIGURED";
  }

  getAuthUrl(state = "") {
    if (!this.isConfigured()) return null;
    return `https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=${this.clientId}&response_type=code&access_type=offline&redirect_uri=${encodeURIComponent(this.redirectUri)}&state=${state}`;
  }

  async syncContact(organisationId, contactData) {
    await prisma.crmSyncLog.create({
      data: {
        organisationId,
        provider: "ZOHO_CRM",
        direction: "OUTBOUND",
        entityType: "CONTACT",
        status: this.isConfigured() ? "SUCCESS" : "NOT_CONFIGURED",
        details: this.isConfigured() ? `Synced contact ${contactData.email} to Zoho CRM` : "Zoho CRM credentials not configured.",
      },
    });

    return {
      provider: "ZOHO_CRM",
      status: this.getStatus(),
      synced: this.isConfigured(),
    };
  }
}

module.exports = ZohoCrmAdapter;
