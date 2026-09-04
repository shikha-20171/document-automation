const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

const emailUser = (process.env.EMAIL_USER || "").trim();
const emailPass = (process.env.EMAIL_PASS || "").trim().replace(/\s+/g, "");

const hasMailCredentials = Boolean(emailUser && emailPass);

let transportConfig;

if (hasMailCredentials) {
  const isGmail = emailUser.toLowerCase().includes("@gmail.com") || process.env.SMTP_HOST === "smtp.gmail.com";
  
  if (isGmail && !process.env.SMTP_PORT) {
    transportConfig = {
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };
  } else {
    transportConfig = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 15000,
    };
  }
} else {
  transportConfig = {
    jsonTransport: true,
  };
}

const transporter = nodemailer.createTransport(transportConfig);

if (hasMailCredentials) {
  console.log(`[MailConfig] Configured SMTP transporter for user: ${emailUser}`);
} else {
  console.warn(`[MailConfig] WARNING: EMAIL_USER / EMAIL_PASS not set. Using JSON fallback mailer.`);
}

module.exports = transporter;

