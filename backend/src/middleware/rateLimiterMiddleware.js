/**
 * In-Memory Rate Limiting Middleware
 * Protects auth endpoints, AI endpoints, and API endpoints against brute force & abuse.
 */

const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // default: 15 mins
  const max = options.max || 100; // default: 100 requests per window
  const message = options.message || "Too many requests, please try again later.";
  const keyGenerator = options.keyGenerator || ((req) => req.ip || req.headers["x-forwarded-for"] || "unknown");

  const hits = new Map();

  // Periodic cleanup
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, Math.min(windowMs, 60000));

  return (req, res, next) => {
    // Skip in development/test if specified
    if (process.env.DISABLE_RATE_LIMIT === "true") {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let record = hits.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfterMs: record.resetTime - now,
      });
    }

    next();
  };
};

/**
 * Pre-configured rate limiters for specific routes
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 20, // 20 login attempts per 15 minutes per IP
  message: "Too many login attempts. Please try again in 15 minutes.",
});

const aiLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 30, // 30 AI requests per minute
  message: "AI rate limit exceeded. Please wait a moment before sending more requests.",
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many API requests. Please slow down.",
});

module.exports = {
  createRateLimiter,
  authLimiter,
  aiLimiter,
  apiLimiter,
};
