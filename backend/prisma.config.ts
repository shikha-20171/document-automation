import path from "node:path";
import { defineConfig } from "prisma/config";
import "dotenv/config";

// Load .env from backend root
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  migrate: {
    async adapter() {
      const { Pool } = require("pg");
      const { PrismaPg } = require("@prisma/adapter-pg");
      const pool = new Pool({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl:
          process.env.DIRECT_URL?.includes("neon.tech") ||
          process.env.DATABASE_URL?.includes("neon.tech") ||
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : undefined,
      });
      return new PrismaPg(pool);
    },
  },
});
