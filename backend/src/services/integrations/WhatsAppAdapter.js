const axios = require("axios");

/**
 * Enterprise WhatsApp Business API Adapter
 * Uses Meta WhatsApp Cloud API (Graph API)
 */
class WhatsAppAdapter {
  constructor(config = {}) {
    this.accessToken = config.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = config.businessAccountId || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    this.apiVersion = "v21.0";
  }

  isConfigured() {
    return Boolean(this.accessToken && this.phoneNumberId);
  }

  /**
   * Test Connection: Verify Phone Number ID and Meta Token
   */
  async testConnection() {
    const startTime = Date.now();
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          status: "NOT_CONFIGURED",
          error: "WhatsApp configuration missing. Configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
        };
      }

      const response = await axios.get(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          params: { fields: "verified_name,display_phone_number,quality_rating,code_verification_status" },
          timeout: 8000,
        }
      );

      const data = response.data || {};
      return {
        success: true,
        status: "CONNECTED",
        latencyMs: Date.now() - startTime,
        verifiedName: data.verified_name || "WhatsApp Business Account",
        displayPhoneNumber: data.display_phone_number || this.phoneNumberId,
        qualityRating: data.quality_rating || "GREEN",
        verificationStatus: data.code_verification_status || "VERIFIED",
        message: `WhatsApp Business API verified for ${data.display_phone_number || this.phoneNumberId}.`,
      };
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      return {
        success: false,
        status: "CONNECTION_FAILED",
        latencyMs: Date.now() - startTime,
        error: errorMsg,
      };
    }
  }

  /**
   * Send WhatsApp Template or Text Message
   */
  async sendMessage({ to, templateName = "hello_world", languageCode = "en_US", components = [], text = "" }) {
    if (!this.isConfigured()) {
      throw new Error("WhatsApp Business API is not configured.");
    }

    if (!to) {
      throw new Error("Recipient phone number is required (E.164 format, e.g. +919876543210).");
    }

    const cleanTo = to.replace(/[^0-9]/g, "");

    let payload;
    if (text) {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: { preview_url: true, body: text },
      };
    } else {
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: components.length > 0 ? components : undefined,
        },
      };
    }

    const response = await axios.post(
      `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const messageId = response.data?.messages?.[0]?.id;
    return {
      success: true,
      messageId,
      recipient: cleanTo,
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Send Document Event Notification via WhatsApp
   */
  async sendDocumentNotification({ to, documentName, eventType = "APPROVAL_REQUIRED", actionUrl }) {
    const textMessage = `*DocuCore Document Notification*\n\nDocument: *${documentName}*\nEvent: *${eventType.replace(/_/g, " ")}*\n\nView details: ${actionUrl || "http://localhost:3000"}`;
    return this.sendMessage({ to, text: textMessage });
  }
}

module.exports = WhatsAppAdapter;
