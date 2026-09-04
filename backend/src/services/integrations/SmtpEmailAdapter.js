const nodemailer = require("nodemailer");

/**
 * Enterprise SMTP & Email Provider Adapter
 * Handles transactional workflow emails: Document Created, Approval Required, Signed, Completed
 */
class SmtpEmailAdapter {
  constructor(config = {}) {
    this.host = config.host || process.env.SMTP_HOST;
    this.port = Number(config.port || process.env.SMTP_PORT || 587);
    this.secure = config.secure !== undefined ? Boolean(config.secure) : Boolean(process.env.SMTP_SECURE === "true" || this.port === 465);
    this.user = config.user || process.env.SMTP_USER;
    this.pass = config.pass || process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
    this.fromEmail = config.fromEmail || process.env.SMTP_FROM_EMAIL || this.user;
    this.fromName = config.fromName || process.env.SMTP_FROM_NAME || "DocuCore Automated Notifications";
  }

  isConfigured() {
    return Boolean(this.host && this.user && this.pass);
  }

  getTransporter() {
    if (!this.isConfigured()) {
      throw new Error("SMTP email credentials are not configured. Ensure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are set.");
    }

    return nodemailer.createTransport({
      host: this.host,
      port: this.port,
      secure: this.secure,
      auth: {
        user: this.user,
        pass: this.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Test Connection: Ping SMTP server
   */
  async testConnection() {
    const startTime = Date.now();
    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          status: "NOT_CONFIGURED",
          error: "SMTP configuration missing. Configure SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.",
        };
      }

      const transporter = this.getTransporter();
      await transporter.verify();

      return {
        success: true,
        status: "CONNECTED",
        latencyMs: Date.now() - startTime,
        host: this.host,
        port: this.port,
        fromEmail: this.fromEmail,
        message: `SMTP server "${this.host}:${this.port}" verified successfully.`,
      };
    } catch (err) {
      return {
        success: false,
        status: "CONNECTION_FAILED",
        latencyMs: Date.now() - startTime,
        error: err.message || "Failed to verify SMTP server credentials.",
      };
    }
  }

  /**
   * Send arbitrary email
   */
  async sendMail({ to, subject, text, html, attachments = [] }) {
    const transporter = this.getTransporter();
    const info = await transporter.sendMail({
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to,
      subject,
      text,
      html: html || `<div style="font-family:sans-serif;padding:20px;color:#1e293b;">${text.replace(/\n/g, "<br/>")}</div>`,
      attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response,
      sentAt: new Date().toISOString(),
    };
  }

  /**
   * Send Document Workflow Event Email
   */
  async sendWorkflowEmail({ to, eventType, documentName, recipientName, actionUrl, customMessage }) {
    const eventTitles = {
      DOCUMENT_CREATED: `Document Created: ${documentName}`,
      APPROVAL_REQUIRED: `Action Required: Document Approval for ${documentName}`,
      APPROVAL_APPROVED: `Document Approved: ${documentName}`,
      APPROVAL_REJECTED: `Document Rejected: ${documentName}`,
      SIGNATURE_REQUIRED: `Signature Required: ${documentName}`,
      SIGNATURE_COMPLETED: `Document Signed Successfully: ${documentName}`,
      WORKFLOW_FAILED: `Workflow Execution Alert: ${documentName}`,
    };

    const subject = eventTitles[eventType] || `DocuCore Document Notification: ${documentName}`;
    const safeName = recipientName || "User";

    const htmlContent = `
      <div style="font-family:Arial, sans-serif; background-color: #f8fafc; padding: 30px 20px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="background: #274690; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 18px; font-weight: bold;">DocuCore Enterprise Automation</h2>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 14px; margin-top: 0;">Hello <strong>${safeName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6;">
              This is an automated notification regarding the document: <strong>${documentName}</strong>.
            </p>
            ${customMessage ? `<div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; font-size: 13px; margin: 16px 0;">${customMessage}</div>` : ""}
            ${
              actionUrl
                ? `<div style="margin: 24px 0;">
                    <a href="${actionUrl}" style="background: #274690; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-block;">
                      Open Document in DocuCore
                    </a>
                  </div>`
                : ""
            }
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #64748b; margin-bottom: 0;">
              This is an automated message from DocuCore Document Automation Platform.
            </p>
          </div>
        </div>
      </div>
    `;

    return this.sendMail({
      to,
      subject,
      text: `Hello ${safeName},\n\nDocument event "${eventType}" on "${documentName}".\n${customMessage || ""}\n\nView at: ${actionUrl || "http://localhost:3000"}`,
      html: htmlContent,
    });
  }
}

module.exports = SmtpEmailAdapter;
