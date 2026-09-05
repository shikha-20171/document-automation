const path = require("path");
const dns = require("dns");
const util = require("util");
const nodemailer = require("nodemailer");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();

// Global preference for IPv4
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
    console.warn(`[MailConfig] DNS lookupAsync notice for ${hostname}:`, err.message);
  }
  return hostname;
}

function createDirectTransporter(hostIp, servername = "smtp.gmail.com") {
  if (!hasMailCredentials) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  const targetPort = Number(process.env.SMTP_PORT) || 465;

  return nodemailer.createTransport({
    host: hostIp,
    port: targetPort,
    secure: targetPort === 465 || process.env.SMTP_SECURE === "true",
    lookup: (hostname, options, callback) => {
      return dns.lookup(hostname, { ...(options || {}), family: 4 }, callback);
    },
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      servername: servername,
      rejectUnauthorized: false,
    },
    pool: true,
    maxConnections: 5,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

const defaultTargetHost = process.env.SMTP_HOST || "smtp.gmail.com";
const baseTransporter = createDirectTransporter(defaultTargetHost, defaultTargetHost);

// Resilient wrapper that guarantees direct IPv4 dispatch in cloud hosting environments (Render / AWS)
const resilientTransporter = {
  async sendMail(mailOptions) {
    if (!hasMailCredentials) {
      console.warn("[MailConfig] EMAIL_USER or EMAIL_PASS missing. Simulating mail send.");
      return baseTransporter.sendMail(mailOptions);
    }

    const hostName = process.env.SMTP_HOST || "smtp.gmail.com";
    try {
      const ipv4 = await getIPv4Host(hostName);
      const activeTransporter = createDirectTransporter(ipv4, hostName);
      return await activeTransporter.sendMail(mailOptions);
    } catch (err) {
      console.warn(`[MailConfig] IPv4 dispatch retry with fallback for ${hostName}:`, err.message);
      return await baseTransporter.sendMail(mailOptions);
    }
  },
  async verify(callback) {
    try {
      const hostName = process.env.SMTP_HOST || "smtp.gmail.com";
      const ipv4 = await getIPv4Host(hostName);
      const activeTransporter = createDirectTransporter(ipv4, hostName);
      return await activeTransporter.verify(callback);
    } catch (err) {
      if (callback) return callback(err);
      throw err;
    }
  },
};

if (hasMailCredentials) {
  console.log(`[MailConfig] Configured resilient IPv4 SMTP transporter for user: ${emailUser}`);
} else {
  console.warn(`[MailConfig] WARNING: EMAIL_USER / EMAIL_PASS not set. Using JSON fallback mailer.`);
}

module.exports = resilientTransporter;



