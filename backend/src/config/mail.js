const path = require("path");
const dns = require("dns");
const util = require("util");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const lookupAsync = util.promisify(dns.lookup);

const emailUser = (process.env.EMAIL_USER || "").trim();
const emailPass = (process.env.EMAIL_PASS || "").trim().replace(/\s+/g, "");

const hasMailCredentials = Boolean(emailUser && emailPass);

async function getIPv4Host(hostname) {
  try {
    const res = await lookupAsync(hostname, { family: 4 });
    if (res && res.address) {
      return res.address;
    }
  } catch (err) {
    console.warn(`[MailConfig] DNS lookup notice for ${hostname}:`, err.message);
  }
  return hostname;
}

function createTransporterForPort(hostIp, port, servername = "smtp.gmail.com") {
  const isSecure = port === 465 || process.env.SMTP_SECURE === "true";
  return nodemailer.createTransport({
    host: hostIp,
    port: port,
    secure: isSecure,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      servername: servername,
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

// Resilient wrapper with port failover (587 -> 465) and direct IPv4 resolution
const resilientTransporter = {
  async sendMail(mailOptions) {
    if (!hasMailCredentials) {
      console.warn("[MailConfig] EMAIL_USER or EMAIL_PASS missing. Using JSON simulation.");
      const fallbackTransporter = nodemailer.createTransport({ jsonTransport: true });
      return fallbackTransporter.sendMail(mailOptions);
    }

    const hostName = process.env.SMTP_HOST || "smtp.gmail.com";
    const hostIp = await getIPv4Host(hostName);
    const portsToTry = process.env.SMTP_PORT
      ? [Number(process.env.SMTP_PORT)]
      : [587, 465];

    let lastError = null;
    for (const port of portsToTry) {
      try {
        const transporter = createTransporterForPort(hostIp, port, hostName);
        const info = await transporter.sendMail(mailOptions);
        return info;
      } catch (err) {
        lastError = err;
        console.warn(`[MailConfig] Dispatch on port ${port} notice: ${err.message}. Retrying fallback port...`);
      }
    }

    throw lastError || new Error("Failed to dispatch email across available SMTP ports.");
  },

  async verify(callback) {
    if (!hasMailCredentials) {
      if (callback) return callback(null, true);
      return true;
    }

    const hostName = process.env.SMTP_HOST || "smtp.gmail.com";
    const hostIp = await getIPv4Host(hostName);
    const portsToTry = process.env.SMTP_PORT ? [Number(process.env.SMTP_PORT)] : [587, 465];

    let lastError = null;
    for (const port of portsToTry) {
      try {
        const transporter = createTransporterForPort(hostIp, port, hostName);
        const res = await transporter.verify();
        if (callback) return callback(null, res);
        return res;
      } catch (err) {
        lastError = err;
      }
    }

    if (callback) return callback(lastError);
    throw lastError;
  },
};

if (hasMailCredentials) {
  console.log(`[MailConfig] Configured resilient multi-port IPv4 SMTP transporter for user: ${emailUser}`);
} else {
  console.warn(`[MailConfig] WARNING: EMAIL_USER / EMAIL_PASS not set. Using JSON fallback mailer.`);
}

module.exports = resilientTransporter;




