const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

// ─── Environment Variable Normalizer & Aliases ────────────────────────────────
const emailUser = (
  process.env.SMTP_USER ||
  process.env.EMAIL_USER ||
  process.env.MAIL_USER ||
  ""
).trim();

const emailPass = (
  process.env.SMTP_PASSWORD ||
  process.env.SMTP_PASS ||
  process.env.EMAIL_PASS ||
  process.env.MAIL_PASS ||
  ""
).trim().replace(/\s+/g, "");

const smtpHost = (
  process.env.SMTP_HOST ||
  process.env.EMAIL_HOST ||
  "smtp.gmail.com"
).trim();

const smtpPort = Number(
  process.env.SMTP_PORT ||
  process.env.EMAIL_PORT ||
  (smtpHost.includes("gmail") ? 587 : 587)
);

const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

const hasMailCredentials = Boolean(emailUser && emailPass);

function maskUser(user) {
  if (!user || user.length <= 4) return "****";
  const [name, domain] = user.split("@");
  if (!domain) return `${user.slice(0, 2)}****`;
  return `${name.slice(0, 2)}***@${domain}`;
}

function createTransporter(targetPort = smtpPort, secureFlag = smtpSecure) {
  if (!hasMailCredentials) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  // If using standard Gmail with default host
  if (smtpHost === "smtp.gmail.com" && targetPort === 587) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }

  // Custom SMTP configuration
  return nodemailer.createTransport({
    host: smtpHost,
    port: targetPort,
    secure: secureFlag,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
}

const resilientTransporter = {
  getSenderEmail() {
    return (
      process.env.SMTP_FROM ||
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM_EMAIL ||
      emailUser ||
      "gourshikha2001@gmail.com"
    );
  },

  getSenderName() {
    return (
      process.env.SMTP_FROM_NAME ||
      process.env.EMAIL_FROM_NAME ||
      "DocuCore AI"
    );
  },

  async sendMail(mailOptions) {
    const senderEmail = this.getSenderEmail();
    const senderName = this.getSenderName();
    const defaultFrom = `"${senderName}" <${senderEmail}>`;
    const finalMailOptions = {
      ...mailOptions,
      from: mailOptions.from || defaultFrom,
    };

    // 1. Check for HTTPS REST Email API (Resend) - 100% immune to cloud SMTP port blocks
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: finalMailOptions.from,
            to: Array.isArray(finalMailOptions.to) ? finalMailOptions.to : [finalMailOptions.to],
            subject: finalMailOptions.subject,
            html: finalMailOptions.html,
            text: finalMailOptions.text,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          console.log(`[MailConfig] Successfully dispatched email via Resend HTTPS API. ID: ${data.id}`);
          return { messageId: data.id, success: true };
        } else {
          console.warn(`[MailConfig] Resend API notice: ${data.message || JSON.stringify(data)}. Falling back to SMTP...`);
        }
      } catch (httpErr) {
        console.warn(`[MailConfig] Resend HTTPS dispatch notice: ${httpErr.message}`);
      }
    }

    // 2. Check for HTTPS REST Email API (Brevo) - 100% immune to cloud SMTP port blocks
    if (process.env.BREVO_API_KEY) {
      try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": process.env.BREVO_API_KEY.trim(),
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: (Array.isArray(finalMailOptions.to) ? finalMailOptions.to : [finalMailOptions.to]).map((t) => ({ email: t })),
            subject: finalMailOptions.subject,
            htmlContent: finalMailOptions.html,
            textContent: finalMailOptions.text,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          console.log(`[MailConfig] Successfully dispatched email via Brevo HTTPS API. MessageId: ${data.messageId}`);
          return { messageId: data.messageId, success: true };
        } else {
          console.warn(`[MailConfig] Brevo API notice: ${data.message || JSON.stringify(data)}. Falling back to SMTP...`);
        }
      } catch (httpErr) {
        console.warn(`[MailConfig] Brevo HTTPS dispatch notice: ${httpErr.message}`);
      }
    }

    if (!hasMailCredentials) {
      console.warn("[MailConfig] SMTP credentials not detected. Simulating dispatch.");
      const fallbackTransporter = nodemailer.createTransport({ jsonTransport: true });
      return fallbackTransporter.sendMail(finalMailOptions);
    }

    try {
      // 3. Primary SMTP Transporter (service: gmail or configured host)
      const primaryTransporter = createTransporter(smtpPort, smtpSecure);
      const info = await primaryTransporter.sendMail(finalMailOptions);
      return info;
    } catch (primaryErr) {
      console.warn(`[MailConfig] Primary SMTP dispatch attempt notice: ${primaryErr.message}`);

      // 4. Automated fallback: Port 587 STARTTLS direct
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: smtpHost,
          port: 587,
          secure: false,
          auth: {
            user: emailUser,
            pass: emailPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          connectionTimeout: 6000,
          greetingTimeout: 6000,
          socketTimeout: 8000,
        });

        const fallbackInfo = await fallbackTransporter.sendMail(finalMailOptions);
        return fallbackInfo;
      } catch (fallbackErr) {
        console.error(`[MailConfig] All SMTP delivery routes failed. Error: ${fallbackErr.message}`);
        throw fallbackErr;
      }
    }
  },

  async verify(callback) {
    if (!hasMailCredentials && !process.env.RESEND_API_KEY && !process.env.BREVO_API_KEY) {
      if (callback) return callback(null, true);
      return true;
    }

    if (process.env.RESEND_API_KEY || process.env.BREVO_API_KEY) {
      if (callback) return callback(null, true);
      return true;
    }

    const transporter = createTransporter();
    return transporter.verify(callback);
  },
};

// Safe startup logging without logging raw passwords
if (process.env.RESEND_API_KEY) {
  console.log(`[MailConfig] Configured Resend HTTPS Email API (Port 443 Cloud Safe).`);
} else if (process.env.BREVO_API_KEY) {
  console.log(`[MailConfig] Configured Brevo HTTPS Email API (Port 443 Cloud Safe).`);
} else if (hasMailCredentials) {
  console.log(`[MailConfig] SMTP configuration loaded for sender: ${maskUser(emailUser)} on ${smtpHost}:${smtpPort}`);
} else {
  console.warn(`[MailConfig] WARNING: SMTP credentials (SMTP_USER / SMTP_PASS or EMAIL_USER / EMAIL_PASS) not configured.`);
}

module.exports = resilientTransporter;






