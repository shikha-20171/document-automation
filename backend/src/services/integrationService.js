const crypto = require("crypto");
const { integrationRepository } = require("../repositories");

/**
 * Integration Service
 * Handles third-party integrations, secure API key generation, and webhooks
 */

const integrationService = {
  /**
   * Get connected integrations for an organisation
   */
  async getIntegrations(organisationId) {
    return await integrationRepository.getOrgIntegrations(organisationId);
  },

  /**
   * Connect or update third-party integration
   */
  async connectIntegration(organisationId, provider, data) {
    return await integrationRepository.createOrUpdateIntegration(organisationId, provider, data);
  },

  /**
   * Disconnect integration
   */
  async disconnectIntegration(id) {
    return await integrationRepository.deleteIntegration(id);
  },

  /**
   * Get API keys for organisation
   */
  async getApiKeys(organisationId) {
    return await integrationRepository.getOrgApiKeys(organisationId);
  },

  /**
   * Generate a new secure API Key
   */
  async generateApiKey({ organisationId, name, permissions, createdById }) {
    if (!organisationId || !name) {
      throw new Error("Organisation ID and API key name are required.");
    }

    // Generate random secure token: doc_live_xxxxxxxx
    const rawKey = `doc_live_${crypto.randomBytes(24).toString("hex")}`;
    const keyPrefix = rawKey.slice(0, 14) + "...";
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const record = await integrationRepository.createApiKey({
      organisationId,
      name,
      keyPrefix,
      keyHash,
      permissions: permissions || ["*"],
      createdById,
    });

    return {
      apiKeyRecord: record,
      rawKey, // Only returned once upon creation!
    };
  },

  /**
   * Revoke API key
   */
  async revokeApiKey(id) {
    return await integrationRepository.revokeApiKey(id);
  },

  /**
   * Get webhooks for organisation
   */
  async getWebhooks(organisationId) {
    return await integrationRepository.getOrgWebhooks(organisationId);
  },

  /**
   * Create webhook endpoint
   */
  async createWebhook({ organisationId, url, events, createdById }) {
    if (!organisationId || !url) {
      throw new Error("Organisation ID and Webhook URL are required.");
    }

    const secret = `whsec_${crypto.randomBytes(20).toString("hex")}`;

    return await integrationRepository.createWebhook({
      organisationId,
      url,
      events: events || ["document.created", "approval.status_changed"],
      secret,
      createdById,
    });
  },

  /**
   * Delete webhook
   */
  async deleteWebhook(id) {
    return await integrationRepository.deleteWebhook(id);
  },
};

module.exports = integrationService;
