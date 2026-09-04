const os = require("os");
const prisma = require("../config/prismaClient");
const redis = require("../config/redis");

let systemMaintenanceState = {
  isMaintenanceMode: false,
  message: "DocuCore AI platform is under scheduled maintenance. We will be back online shortly.",
  updatedAt: new Date().toISOString(),
  allowedIps: ["127.0.0.1", "::1"],
};

let featureFlags = {
  ai_tools: true,
  workflows: true,
  ocr_pipeline: true,
  e_signatures: true,
  external_webhooks: true,
  api_keys: true,
  audit_logging: true,
};

/**
 * Public Basic Health Check
 * GET /api/system/health
 */
const getSystemHealth = async (req, res) => {
  const start = Date.now();
  let dbStatus = "HEALTHY";
  let redisStatus = "HEALTHY";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbStatus = "DEGRADED";
  }

  try {
    if (redis && typeof redis.ping === "function") {
      await redis.ping();
    }
  } catch (e) {
    redisStatus = "DEGRADED";
  }

  const responseTimeMs = Date.now() - start;

  res.status(200).json({
    status: dbStatus === "HEALTHY" && redisStatus === "HEALTHY" ? "UP" : "DEGRADED",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    redis: redisStatus,
    responseTimeMs,
    environment: process.env.NODE_ENV || "development",
  });
};

/**
 * Deep Super Admin Observability Metrics
 * GET /api/super-admin/system/metrics
 */
const getSystemMetrics = async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const [totalUsers, totalDocs, totalJobs] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.document.count().catch(() => 0),
      prisma.aILog.count().catch(() => 0),
    ]);

    res.status(200).json({
      success: true,
      data: {
        server: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          uptimeSeconds: Math.floor(process.uptime()),
          cpuCount: cpus.length,
          cpuModel: cpus[0]?.model || "Multi-Core CPU",
          cpuLoadAvg: loadAvg,
          memoryUsage: {
            rssMB: (memoryUsage.rss / (1024 * 1024)).toFixed(2),
            heapUsedMB: (memoryUsage.heapUsed / (1024 * 1024)).toFixed(2),
            heapTotalMB: (memoryUsage.heapTotal / (1024 * 1024)).toFixed(2),
            systemFreeMB: (freeMem / (1024 * 1024)).toFixed(2),
            systemTotalMB: (totalMem / (1024 * 1024)).toFixed(2),
            memoryPressurePercent: (((totalMem - freeMem) / totalMem) * 100).toFixed(1),
          },
        },
        database: {
          engine: "PostgreSQL 16",
          status: "CONNECTED",
          totalUsers,
          totalDocuments: totalDocs,
          totalAiExecutions: totalJobs,
        },
        redis: {
          status: redis?.status || "ready",
          host: process.env.REDIS_HOST || "127.0.0.1",
          port: process.env.REDIS_PORT || 6379,
        },
        featureFlags,
        maintenanceMode: systemMaintenanceState,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Toggle Maintenance Mode
 * POST /api/super-admin/system/maintenance
 */
const toggleMaintenanceMode = async (req, res) => {
  try {
    const { isMaintenanceMode, message } = req.body;
    systemMaintenanceState = {
      isMaintenanceMode: Boolean(isMaintenanceMode),
      message: message || systemMaintenanceState.message,
      updatedAt: new Date().toISOString(),
      allowedIps: systemMaintenanceState.allowedIps,
    };

    res.status(200).json({
      success: true,
      message: `System maintenance mode is now ${systemMaintenanceState.isMaintenanceMode ? "ENABLED" : "DISABLED"}`,
      data: systemMaintenanceState,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Toggle Feature Flags
 * POST /api/super-admin/system/feature-flags
 */
const updateFeatureFlags = async (req, res) => {
  try {
    const updates = req.body;
    featureFlags = {
      ...featureFlags,
      ...updates,
    };

    res.status(200).json({
      success: true,
      message: "Feature flags updated successfully.",
      data: featureFlags,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSystemHealth,
  getSystemMetrics,
  toggleMaintenanceMode,
  updateFeatureFlags,
};
