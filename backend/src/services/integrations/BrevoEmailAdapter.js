/**
 * Enterprise Brevo (Sendinblue) HTTPS Email API Adapter
 * Connects directly to Brevo Transactional Email REST API (Port 443 HTTPS).
 * 100% immune to cloud container SMTP port blocks.
 */
class BrevoEmailAdapter {
  constructor(config = {}) {
    this.apiKey = (config.apiKey || process.env.BREVO_API_KEY || "").trim();
    this.fromEmail = (config.fromEmail || process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.EMAIL_USER || "gourshikha2001@gmail.com").trim();
    this.fromName = (config.fromName || process.env.SMTP_FROM_NAME || "DocuCore AI").trim();
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  /**
   * Test Connection / Validate API Key with Brevo API
   */
  async testConnection() {
    const startTime = Date.now();
    if (!this.isConfigured()) {
      return {
        success: false,
        status: "NOT_CONFIGURED",
        error: "Brevo API Key is missing. Please configure your Brevo API key.",
      };
    }

    try {
      const response = await fetch("https://api.brevo.com/v3/account", {
        method: "GET",
        headers: {
          "api-key": this.apiKey,
          "Accept": "application/json",
        },
      });

      const data = await response.json();
      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          status: "CONNECTED",
          latencyMs,
          email: data.email,
          companyName: data.companyName,
          plan: data.plan?.[0]?.type || "FREE",
          credits: data.plan?.[0]?.credits || 300,
          message: `Brevo REST API verified successfully. Account: ${data.email} (${data.companyName || "Active"}).`,
        };
      } else {
        let errorMsg = data.message || "Invalid Brevo API Key or unauthorized access.";
        if (this.apiKey.startsWith("xsmtpsib-")) {
          errorMsg = "You provided a Brevo SMTP Key (xsmtpsib-...). For HTTPS REST API delivery (best on Render/Vercel port 443), copy your API Key (starting with xkeysib-...) from Brevo Dashboard -> Top-right profile -> SMTP & API -> API Keys tab.";
        }
        return {
          success: false,
          status: "CONNECTION_FAILED",
          latencyMs,
          error: errorMsg,
        };
      }
    } catch (err) {
      return {
        success: false,
        status: "CONNECTION_FAILED",
        latencyMs: Date.now() - startTime,
        error: err.message || "Failed to reach Brevo HTTPS API.",
      };
    }
  }

  /**
   * Send Transactional Email via Brevo REST API
   */
  async sendMail({ to, subject, html, text, fromEmail, fromName }) {
    if (!this.isConfigured()) {
      throw new Error("Brevo API Key is not configured.");
    }

    const recipients = (Array.isArray(to) ? to : [to]).map((recipient) => {
      if (typeof recipient === "string") return { email: recipient.trim() };
      return recipient;
    });

    const sender = {
      email: fromEmail || this.fromEmail,
      name: fromName || this.fromName,
    };

    const payload = {
      sender,
      to: recipients,
      subject,
      htmlContent: html || `<p>${text || ""}</p>`,
    };

    if (text) payload.textContent = text;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Brevo HTTP error (${response.status})`);
    }

    return {
      success: true,
      messageId: data.messageId,
      sentAt: new Date().toISOString(),
    };
  }
}

module.exports = BrevoEmailAdapter;
