const SalesforceAdapter = require("./salesforceAdapter");
const HubSpotAdapter = require("./hubspotAdapter");
const ZohoCrmAdapter = require("./zohoCrmAdapter");

class CrmProviderFactory {
  static getAdapter(providerName = "SALESFORCE") {
    const p = providerName.toUpperCase();
    if (p === "SALESFORCE") return new SalesforceAdapter();
    if (p === "HUBSPOT") return new HubSpotAdapter();
    if (p === "ZOHO_CRM" || p === "ZOHO") return new ZohoCrmAdapter();
    throw new Error(`Unsupported CRM provider: ${providerName}`);
  }

  static getSupportedProviders() {
    const sf = new SalesforceAdapter();
    const hs = new HubSpotAdapter();
    const zh = new ZohoCrmAdapter();

    return [
      { code: "INTERNAL", name: "DocuCore PostgreSQL CRM", type: "INTERNAL_ENGINE", status: "CONFIGURED" },
      { code: "SALESFORCE", name: "Salesforce CRM", type: "REAL_PROVIDER", status: sf.getStatus() },
      { code: "HUBSPOT", name: "HubSpot CRM", type: "REAL_PROVIDER", status: hs.getStatus() },
      { code: "ZOHO_CRM", name: "Zoho CRM", type: "REAL_PROVIDER", status: zh.getStatus() },
    ];
  }
}

module.exports = CrmProviderFactory;
