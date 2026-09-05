const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

const emailUser = (process.env.EMAIL_USER || "").trim();
const emailPass = (process.env.EMAIL_PASS || "").trim().replace(/\s+/g, "");

const hasMailCredentials = Boolean(emailUser && emailPass);

function createTransporter() {
  if (!hasMailCredentials) {
    console.warn("[MailConfig] EMAIL_USER or EMAIL_PASS not configured. Using JSON fallback.");
    return nodemailer.createTransport({ jsonTransport: true });
  }

  // 1. Custom SMTP configuration if explicitly provided
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465 || process.env.SMTP_SECURE === "true",
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

  // 2. Standard Gmail Service Transporter
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

const resilientTransporter = {
  async sendMail(mailOptions) {
    if (!hasMailCredentials) {
      console.warn("[MailConfig] EMAIL_USER / EMAIL_PASS missing. Simulating dispatch.");
      const fallbackTransporter = nodemailer.createTransport({ jsonTransport: true });
      return fallbackTransporter.sendMail(mailOptions);
    }

    try {
      const primaryTransporter = createTransporter();
      const info = await primaryTransporter.sendMail(mailOptions);
      return info;
    } catch (primaryErr) {
      console.warn(`[MailConfig] Primary Gmail dispatch encountered: ${primaryErr.message}`);

      // If primary failed, attempt port 587 STARTTLS direct fallback
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
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

        const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
        return fallbackInfo;
      } catch (fallbackErr) {
        console.error(`[MailConfig] All SMTP methods failed. Error: ${fallbackErr.message}`);
        throw fallbackErr;
      }
    }
  },

  async verify(callback) {
    if (!hasMailCredentials) {
      if (callback) return callback(null, true);
      return true;
    }

    const transporter = createTransporter();
    return transporter.verify(callback);
  },
};

if (hasMailCredentials) {
  console.log(`[MailConfig] Configured Gmail SMTP transporter for: ${emailUser}`);
} else {
  console.warn(`[MailConfig] WARNING: EMAIL_USER / EMAIL_PASS not set.`);
}

module.exports = resilientTransporter;





