const axios = require("axios");

/**
 * Real Slack Integration Adapter
 * Uses official Slack OAuth 2.0 and Web API (chat.postMessage, conversations.list, auth.test)
 */
class SlackAdapter {
  constructor(config = {}) {
    this.clientId = config.clientId || process.env.SLACK_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.SLACK_CLIENT_SECRET;
    this.redirectUri = config.redirectUri || process.env.SLACK_REDIRECT_URI || "http://localhost:5001/api/integrations/slack/callback";
    this.botToken = config.botToken || process.env.SLACK_BOT_TOKEN;
  }

  isConfigured() {
    return Boolean((this.clientId && this.clientSecret) || this.botToken);
  }

  /**
   * Generate Slack OAuth URL
   */
  getAuthUrl(state = "") {
    if (!this.clientId) {
      throw new Error("Slack integration is not configured. Missing SLACK_CLIENT_ID.");
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: "chat:write,channels:read,groups:read,users:read,incoming-webhook",
      redirect_uri: this.redirectUri,
      state,
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  /**
   * Exchange code for Slack Bot Token
   */
  async exchangeCode(code) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("Slack credentials not configured.");
    }

    const response = await axios.post(
      "https://slack.com/api/oauth.v2.access",
      new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    if (!response.data.ok) {
      throw new Error(`Slack OAuth error: ${response.data.error || "Token exchange failed"}`);
    }

    const data = response.data;
    const token = data.access_token;
    const team = data.team || {};
    const authedUser = data.authed_user || {};

    return {
      accessToken: token,
      teamId: team.id,
      teamName: team.name,
      botUserId: data.bot_user_id,
      accountName: team.name || "Slack Workspace",
      accountEmail: authedUser.id ? `user_${authedUser.id}@slack.internal` : `${team.name}@slack`,
      incomingWebhook: data.incoming_webhook?.url || null,
      incomingChannel: data.incoming_webhook?.channel || null,
    };
  }

  /**
   * Test Connection: Ping Slack auth.test API
   */
  async testConnection(token = this.botToken) {
    const startTime = Date.now();
    try {
      if (!token) {
        return {
          success: false,
          status: "NOT_CONFIGURED",
          error: "Slack token missing. Connect via OAuth or configure SLACK_BOT_TOKEN in .env.",
        };
      }

      const response = await axios.post(
        "https://slack.com/api/auth.test",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        }
      );

      if (!response.data.ok) {
        return {
          success: false,
          status: "CONNECTION_FAILED",
          latencyMs: Date.now() - startTime,
          error: response.data.error || "Slack auth test failed.",
        };
      }

      return {
        success: true,
        status: "CONNECTED",
        latencyMs: Date.now() - startTime,
        teamName: response.data.team,
        teamId: response.data.team_id,
        botUser: response.data.user,
        accountName: `${response.data.team} (${response.data.user})`,
      };
    } catch (err) {
      return {
        success: false,
        status: "CONNECTION_FAILED",
        latencyMs: Date.now() - startTime,
        error: err.response?.data?.error || err.message,
      };
    }
  }

  /**
   * List public and private channels
   */
  async listChannels(token = this.botToken) {
    const response = await axios.get("https://slack.com/api/conversations.list", {
      headers: { Authorization: `Bearer ${token}` },
      params: { types: "public_channel,private_channel", limit: 50 },
      timeout: 8000,
    });

    if (!response.data.ok) {
      throw new Error(`Slack API error: ${response.data.error}`);
    }

    return (response.data.channels || []).map((ch) => ({
      id: ch.id,
      name: ch.name,
      isPrivate: ch.is_private,
      numMembers: ch.num_members,
    }));
  }

  /**
   * Send a rich message to a Slack channel
   */
  async sendMessage(token = this.botToken, { channel = "#general", text, blocks }) {
    if (!text && !blocks) throw new Error("Message text or blocks required.");

    const payload = {
      channel,
      text: text || "DocuCore Automated Notification",
    };
    if (blocks) payload.blocks = blocks;

    const response = await axios.post("https://slack.com/api/chat.postMessage", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      timeout: 10000,
    });

    if (!response.data.ok) {
      throw new Error(`Slack postMessage failed: ${response.data.error}`);
    }

    return {
      messageId: response.data.ts,
      channel: response.data.channel,
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Send structured Document Approval notification card
   */
  async sendApprovalNotification(token = this.botToken, { channel, documentTitle, requestedBy, documentUrl, approvalUrl }) {
    const blocks = [
      {
        type: "header",
        text: { type: "plain_text", text: "📄 DocuCore Document Approval Alert", emoji: true },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Document:*\n${documentTitle}` },
          { type: "mrkdwn", text: `*Requested By:*\n${requestedBy || "DocuCore User"}` },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Document", emoji: true },
            url: documentUrl || "http://localhost:3000/org-admin/documents",
            style: "primary",
          },
        ],
      },
    ];

    return this.sendMessage(token, {
      channel,
      text: `Document Approval Request: ${documentTitle}`,
      blocks,
    });
  }
}

module.exports = SlackAdapter;
