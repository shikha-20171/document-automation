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
    if (!hasMailCredentials) {
      console.warn("[MailConfig] SMTP credentials not detected. Simulating dispatch.");
      const fallbackTransporter = nodemailer.createTransport({ jsonTransport: true });
      return fallbackTransporter.sendMail(mailOptions);
    }

    const defaultFrom = `"${this.getSenderName()}" <${this.getSenderEmail()}>`;
    const finalMailOptions = {
      ...mailOptions,
      from: mailOptions.from || defaultFrom,
    };

    try {
      // 1. Primary Transporter (service: gmail or configured host)
      const primaryTransporter = createTransporter(smtpPort, smtpSecure);
      const info = await primaryTransporter.sendMail(finalMailOptions);
      return info;
    } catch (primaryErr) {
      console.warn(`[MailConfig] Primary SMTP dispatch attempt notice: ${primaryErr.message}`);

      // 2. Automated fallback: Port 587 STARTTLS direct
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
    if (!hasMailCredentials) {
      if (callback) return callback(null, true);
      return true;
    }

    const transporter = createTransporter();
    return transporter.verify(callback);
  },
};

// Safe startup logging without logging raw passwords
if (hasMailCredentials) {
  console.log(`[MailConfig] SMTP configuration loaded for sender: ${maskUser(emailUser)} on ${smtpHost}:${smtpPort}`);
} else {
  console.warn(`[MailConfig] WARNING: SMTP credentials (SMTP_USER / SMTP_PASS or EMAIL_USER / EMAIL_PASS) not configured.`);
}

module.exports = resilientTransporter;






