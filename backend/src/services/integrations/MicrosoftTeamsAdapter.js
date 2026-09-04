const axios = require("axios");

/**
 * Real Microsoft Teams / Graph API Adapter
 * Supports OAuth 2.0 and Webhook card dispatching
 */
class MicrosoftTeamsAdapter {
  constructor(config = {}) {
    this.clientId = config.clientId || process.env.MICROSOFT_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.MICROSOFT_CLIENT_SECRET;
    this.redirectUri = config.redirectUri || process.env.MICROSOFT_REDIRECT_URI || "http://localhost:5001/api/integrations/microsoft_teams/callback";
    this.tenantId = config.tenantId || process.env.MICROSOFT_TENANT_ID || "common";
  }

  isConfigured() {
    return Boolean(this.clientId && this.clientSecret);
  }

  getAuthUrl(state = "") {
    if (!this.clientId) {
      throw new Error("Microsoft Teams integration not configured. Missing MICROSOFT_CLIENT_ID.");
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      response_mode: "query",
      scope: "https://graph.microsoft.com/User.Read https://graph.microsoft.com/ChannelMessage.Send offline_access",
      state,
    });

    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCode(code) {
    const response = await axios.post(
      `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    const data = response.data;
    const profile = await this.getAccountInfo(data.access_token);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null,
      expiresIn: data.expires_in,
      expiresAt: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      accountName: profile?.displayName || "Microsoft User",
      accountEmail: profile?.userPrincipalName || profile?.mail || "teams@microsoft.internal",
    };
  }

  async getAccountInfo(accessToken) {
    try {
      const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 8000,
      });
      return response.data;
    } catch {
      return null;
    }
  }

  async testConnection(accessToken) {
    const startTime = Date.now();
    try {
      if (!accessToken) {
        return {
          success: false,
          status: "NOT_CONFIGURED",
          error: "Microsoft Teams token missing. Connect via OAuth or check credentials.",
        };
      }

      const response = await axios.get("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 8000,
      });

      return {
        success: true,
        status: "CONNECTED",
        latencyMs: Date.now() - startTime,
        accountName: response.data.displayName,
        accountEmail: response.data.mail || response.data.userPrincipalName,
      };
    } catch (err) {
      return {
        success: false,
        status: "CONNECTION_FAILED",
        latencyMs: Date.now() - startTime,
        error: err.response?.data?.error?.message || err.message,
      };
    }
  }

  /**
   * Send notification via Webhook or Graph API
   */
  async sendNotification({ webhookUrl, title, message, facts = [] }) {
    if (!webhookUrl) throw new Error("Webhook URL required for Teams notification.");

    const payload = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: "0076D7",
      summary: title || "DocuCore Notification",
      sections: [
        {
          activityTitle: title || "DocuCore Document Event",
          activitySubtitle: new Date().toLocaleString(),
          text: message,
          facts: facts.map((f) => ({ name: f.name, value: f.value })),
          markdown: true,
        },
      ],
    };

    const response = await axios.post(webhookUrl, payload, { timeout: 10000 });
    return { success: true, status: response.status, sentAt: new Date().toISOString() };
  }
}

module.exports = MicrosoftTeamsAdapter;
