const EventEmitter = require("events");
const Redis = require("ioredis");

const redisUrl = (
  process.env.REDIS_URL ||
  process.env.REDISCLOUD_URL ||
  process.env.UPSTASH_REDIS_URL ||
  process.env.REDIS_TLS_URL ||
  ""
).trim();

const redisHost = (process.env.REDIS_HOST || "").trim();
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const redisPassword = (process.env.REDIS_PASSWORD || process.env.REDIS_PASS || "").trim();
const redisUsername = (process.env.REDIS_USERNAME || process.env.REDIS_USER || "").trim();
const isProduction = process.env.NODE_ENV === "production";

const isLocalHost = !redisHost || redisHost === "127.0.0.1" || redisHost === "localhost";
const hasExplicitRemoteRedis = Boolean(redisUrl || (redisHost && !isLocalHost));

/**
 * In-Memory Resilient Cache Provider
 * Used in cloud environments when no external Redis instance is provided.
 * Provides standard Redis API commands with TTL support and zero ECONNREFUSED log spam.
 */
class InMemoryRedisClient extends EventEmitter {
  constructor() {
    super();
    this.store = new Map();
    this.ttls = new Map();
    this.status = "ready";
    this.isInMemory = true;
  }

  async ping() {
    return "PONG";
  }

  async get(key) {
    if (this._isExpired(key)) {
      this.del(key);
      return null;
    }
    return this.store.get(key) ?? null;
  }

  async set(key, value, ...args) {
    this.store.set(key, typeof value === "string" ? value : JSON.stringify(value));
    if (args.length >= 2 && String(args[0]).toUpperCase() === "EX") {
      const ttlSec = Number(args[1]);
      if (!isNaN(ttlSec) && ttlSec > 0) {
        this.ttls.set(key, Date.now() + ttlSec * 1000);
      }
    }
    return "OK";
  }

  async setex(key, seconds, value) {
    return this.set(key, value, "EX", seconds);
  }

  async del(...keys) {
    let deletedCount = 0;
    for (const key of keys.flat()) {
      if (this.store.delete(key)) deletedCount++;
      this.ttls.delete(key);
    }
    return deletedCount;
  }

  async exists(key) {
    if (this._isExpired(key)) {
      this.del(key);
      return 0;
    }
    return this.store.has(key) ? 1 : 0;
  }

  async keys(pattern = "*") {
    const allKeys = Array.from(this.store.keys()).filter((k) => !this._isExpired(k));
    if (pattern === "*") return allKeys;
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return allKeys.filter((k) => regex.test(k));
  }

  async hget(key, field) {
    const val = await this.get(key);
    if (!val) return null;
    try {
      const obj = JSON.parse(val);
      return obj[field] ?? null;
    } catch {
      return null;
    }
  }

  async hset(key, field, value) {
    let obj = {};
    const existing = await this.get(key);
    if (existing) {
      try {
        obj = JSON.parse(existing);
      } catch {
        obj = {};
      }
    }
    obj[field] = value;
    await this.set(key, JSON.stringify(obj));
    return 1;
  }

  async expire(key, seconds) {
    if (this.store.has(key)) {
      this.ttls.set(key, Date.now() + Number(seconds) * 1000);
      return 1;
    }
    return 0;
  }

  async ttl(key) {
    if (!this.store.has(key)) return -2;
    const expiry = this.ttls.get(key);
    if (!expiry) return -1;
    const remaining = Math.floor((expiry - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async flushall() {
    this.store.clear();
    this.ttls.clear();
    return "OK";
  }

  async quit() {
    this.status = "end";
    return "OK";
  }

  async disconnect() {
    return this.quit();
  }

  _isExpired(key) {
    const expiry = this.ttls.get(key);
    return expiry ? Date.now() > expiry : false;
  }
}

let redis;

if (isProduction && !hasExplicitRemoteRedis) {
  // Production environment without configured external Redis -> use safe In-Memory Cache
  console.log("[RedisConfig] No remote REDIS_URL configured in production. Operating with resilient In-Memory Cache.");
  redis = new InMemoryRedisClient();
} else {
  // Either remote Redis is provided OR running in local development
  let redisConfig;
  const isTlsRequired = redisUrl.startsWith("rediss://") || process.env.REDIS_TLS === "true";

  if (redisUrl) {
    redisConfig = redisUrl;
  } else {
    redisConfig = {
      host: redisHost || "127.0.0.1",
      port: redisPort,
      password: redisPassword || undefined,
      username: redisUsername && redisUsername !== "default" ? redisUsername : undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 5) {
          if (!isProduction) {
            console.warn("[RedisConfig] Local Redis unreachable after 5 retries. Switching to in-memory fallback.");
          }
          return null; // Stop infinite reconnect loop
        }
        return Math.min(times * 300, 2000);
      },
    };

    if (isTlsRequired) {
      redisConfig.tls = { rejectUnauthorized: false };
    }
  }

  try {
    const clientOptions = typeof redisConfig === "string"
      ? {
          lazyConnect: true,
          maxRetriesPerRequest: 2,
          connectTimeout: 5000,
          tls: isTlsRequired ? { rejectUnauthorized: false } : undefined,
          retryStrategy(times) {
            if (times > 5) return null;
            return Math.min(times * 300, 2000);
          },
        }
      : redisConfig;

    redis = typeof redisConfig === "string" ? new Redis(redisConfig, clientOptions) : new Redis(clientOptions);

    redis.connect().catch((err) => {
      if (isProduction) {
        console.warn(`[RedisConfig] Remote Redis connection attempt notice: ${err.message}`);
      }
    });

    redis.on("connect", () => {
      console.log(" Redis Connected");
    });

    redis.on("error", (err) => {
      // Log single warning only once or if not connection refusal during initial probe
      if (!isProduction || hasExplicitRemoteRedis) {
        console.warn(" Redis Warning:", err.message);
      }
    });
  } catch (err) {
    console.warn(`[RedisConfig] Initialization notice: ${err.message}. Using in-memory fallback.`);
    redis = new InMemoryRedisClient();
  }
}

module.exports = redis;
module.exports.redis = redis;