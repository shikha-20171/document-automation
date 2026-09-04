const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

redis.connect().catch((err) => {
  console.warn("Redis connection notice:", err.message);
});

redis.on("connect", () => {
  console.log(" Redis Connected");
});

redis.on("error", (err) => {
  console.warn(" Redis Warning:", err.message);
});

module.exports = redis;
module.exports.redis = redis;