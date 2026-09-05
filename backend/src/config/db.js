const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const isNeonOrSsl =
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("sslmode=require")) ||
  process.env.NODE_ENV === "production";

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: isNeonOrSsl ? { rejectUnauthorized: false } : undefined,
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || undefined,
      database: process.env.DB_NAME,
    };

const pool = new Pool(poolConfig);

module.exports = pool;