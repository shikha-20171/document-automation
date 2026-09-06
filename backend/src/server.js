const path = require("path");
const dns = require("dns");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

// Globally prefer IPv4 DNS resolution to prevent cloud ENETUNREACH errors on IPv6
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

// Global BigInt JSON serialization support
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    const intVal = Number(this);
    return Number.isSafeInteger(intVal) ? intVal : this.toString();
  };
}

const app = require("./app");
const pool = require("./config/db");
const redis = require("./config/redis");
const { ensureDefaultAccountsExist } = require("./services/authService");

const PORT = process.env.PORT || 5001;

app.locals.db = {
  connected: false,
  error: null,
};

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);

  // 1. Asynchronously seed demo accounts once in background (non-blocking)
  ensureDefaultAccountsExist().catch((err) => {
    console.warn("Background seed notice:", err.message);
  });

  // 2. Keep-alive ping mechanism to prevent Render free-tier idle spin-down
  const pingUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.BACKEND_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://document-automation-backend-1jte.onrender.com"
      : null);

  if (pingUrl) {
    const https = pingUrl.startsWith("https") ? require("https") : require("http");
    // Ping every 9 minutes (Render sleeps after 15 mins)
    setInterval(() => {
      try {
        const target = `${pingUrl.replace(/\/+$/, "")}/health`;
        https.get(target, (res) => {
          // Keep-alive successful
        }).on("error", () => {});
      } catch (e) {}
    }, 9 * 60 * 1000);
  }
});

pool
  .connect()
  .then((client) => {
    app.locals.db.connected = true;
    app.locals.db.error = null;
    client.release();
    console.log(" PostgreSQL Connected");
  })
  .catch((err) => {
    app.locals.db.connected = false;
    app.locals.db.error = err.message;
    console.error(" Database Connection Failed");
    console.error(err);
  });
