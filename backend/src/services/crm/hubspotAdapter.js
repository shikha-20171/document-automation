const prisma = require("../../config/prismaClient");

class HubSpotAdapter {
  constructor(config = {}) {
    this.clientId = config.clientId || process.env.HUBSPOT_CLIENT_ID || null;
    this.clientSecret = config.clientSecret || process.env.HUBSPOT_CLIENT_SECRET || null;
    this.redirectUri = config.redirectUri || process.env.HUBSPOT_REDIRECT_URI || "http://localhost:5001/api/crm/oauth/hubspot/callback";
  }

  isConfigured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  getStatus() {
    return this.isConfigured() ? "CONFIGURED" : "NOT_CONFIGURED";
  }

  getAuthUrl(state = "") {
    if (!this.isConfigured()) return null;
    return `https://app.hubspot.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=crm.objects.contacts.read%20crm.objects.contacts.write&state=${state}`;
  }

  async syncContact(organisationId, contactData) {
    await prisma.crmSyncLog.create({
      data: {
        organisationId,
        provider: "HUBSPOT",
        direction: "OUTBOUND",
        entityType: "CONTACT",
        status: this.isConfigured() ? "SUCCESS" : "NOT_CONFIGURED",
        details: this.isConfigured() ? `Synced contact ${contactData.email} to HubSpot` : "HubSpot credentials not configured.",
      },
    });

    return {
      provider: "HUBSPOT",
      status: this.getStatus(),
      synced: this.isConfigured(),
    };
  }
}

module.exports = HubSpotAdapter;
