const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const isNeonOrSsl =
  (process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.includes("neon.tech") ||
      process.env.DATABASE_URL.includes("sslmode="))) ||
  process.env.NODE_ENV === "production";

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isNeonOrSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 60000, // 60s idle timeout to avoid frequent SSL handshake latency to Neon
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || undefined,
      database: process.env.DB_NAME,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

// Handle idle pool client errors gracefully
pool.on("error", (err) => {
  console.warn("Notice: PG pool idle client notice (recovering):", err.message);
});

module.exports = pool;