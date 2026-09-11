/**
 * Platform Settings Service
 *
 * Central singleton service that reads Super Admin-configured platform settings
 * from the database and provides them to all modules. Uses TTL-based caching so
 * changes made in Super Admin take effect within 60 seconds across every module,
 * with zero code changes or server restarts required.
 */

const prisma = require("../config/prismaClient");

let settingsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

let aiRoutingCache = null;
let aiRoutingTimestamp = 0;

let ocrRoutingCache = null;
let ocrRoutingTimestamp = 0;

class PlatformSettingsService {
  static invalidateCache() {
    settingsCache = null;
    cacheTimestamp = 0;
    aiRoutingCache = null;
    aiRoutingTimestamp = 0;
    ocrRoutingCache = null;
    ocrRoutingTimestamp = 0;
  }

  static async getAll() {
    const now = Date.now();
    if (settingsCache && now - cacheTimestamp < CACHE_TTL_MS) return settingsCache;
    try {
      const rows = await prisma.platformSetting.findMany().catch(() => []);
      const settings = {};
      for (const row of rows) {
        try { settings[row.key] = JSON.parse(row.value); } catch { settings[row.key] = row.value; }
      }
      settingsCache = settings;
      cacheTimestamp = now;
      return settings;
    } catch (err) {
      console.warn("[PlatformSettingsService] Could not load settings:", err.message);
      return settingsCache || {};
    }
  }

  static async get(key, defaultValue = null) {
    const all = await PlatformSettingsService.getAll();
    return all[key] !== undefined ? all[key] : defaultValue;
  }

  static async set(key, value) {
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    await prisma.platformSetting.upsert({
      where: { key },
      update: { value: stringValue, updatedAt: new Date() },
      create: { key, value: stringValue },
    }).catch((err) => console.warn("[PlatformSettingsService] Persist notice:", err.message));
    PlatformSettingsService.invalidateCache();
  }

  static async getAIRoutingConfig() {
    const now = Date.now();
    if (aiRoutingCache && now - aiRoutingTimestamp < CACHE_TTL_MS) return aiRoutingCache;
    try {
      const config = await prisma.aIRoutingConfig.findFirst({ orderBy: { updatedAt: "desc" } }).catch(() => null);
      aiRoutingCache = config || {
        routingEnabled: true,
        primaryProviderCode: process.env.AI_PRIMARY_PROVIDER || "gemini",
        primaryModel: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
        fallbackProviderCode: "gemini",
        fallbackModel: "gemini-1.5-flash-latest",
        fallbackEnabled: true,
      };
      aiRoutingTimestamp = now;
      return aiRoutingCache;
    } catch (err) {
      return { routingEnabled: true, primaryProviderCode: "gemini", primaryModel: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp", fallbackEnabled: true };
    }
  }

  static async getOCRRoutingConfig() {
    const now = Date.now();
    if (ocrRoutingCache && now - ocrRoutingTimestamp < CACHE_TTL_MS) return ocrRoutingCache;
    try {
      const config = await prisma.oCRRoutingConfig.findFirst({ orderBy: { updatedAt: "desc" } }).catch(() => null);
      ocrRoutingCache = config || { primaryEngineCode: "TESSERACT", fallbackEngineCode: "TESSERACT", fallbackEnabled: true, defaultLanguage: "eng", autoRotate: true, deskew: true, denoise: true, enhanceImage: true, confidenceThreshold: 80.0, layoutDetection: true, tableDetection: true };
      ocrRoutingTimestamp = now;
      return ocrRoutingCache;
    } catch {
      return { primaryEngineCode: "TESSERACT", fallbackEnabled: true, defaultLanguage: "eng" };
    }
  }

  static async isFeatureEnabled(featureKey, defaultEnabled = true) {
    const settings = await PlatformSettingsService.getAll();
    const featureFlags = settings.feature_flags || {};
    return featureFlags[featureKey] !== undefined ? Boolean(featureFlags[featureKey]) : defaultEnabled;
  }

  static async getActiveAIProvider() {
    const routingConfig = await PlatformSettingsService.getAIRoutingConfig();
    if (routingConfig?.routingEnabled && routingConfig?.primaryProviderCode) {
      return { providerCode: routingConfig.primaryProviderCode, model: routingConfig.primaryModel || (process.env.GEMINI_MODEL || "gemini-2.0-flash-exp") };
    }
    return { providerCode: "gemini", model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp" };
  }

  static async getActiveOCREngine() {
    const config = await PlatformSettingsService.getOCRRoutingConfig();
    return { primaryEngine: config.primaryEngineCode || "TESSERACT", fallbackEngine: config.fallbackEngineCode || "TESSERACT", fallbackEnabled: config.fallbackEnabled !== false, language: config.defaultLanguage || "eng" };
  }
}

module.exports = PlatformSettingsService;
