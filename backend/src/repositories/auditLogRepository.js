const prisma = require("../config/prismaClient");

/**
 * Audit Log Repository
 * Handles AuditLog and ActivityLog database operations
 */

const getLogs = async ({
  organisationId,
  user,
  action,
  page = 1,
  limit = 30,
} = {}) => {
  const where = {};
  if (organisationId) where.organisation_id = Number(organisationId);
  if (user) where.user = { contains: user, mode: "insensitive" };
  if (action) where.action = { contains: action, mode: "insensitive" };

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      skip,
      take,
      orderBy: { timestamp: "desc" },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
};

const createLog = async ({ organisation_id, action, user, ip_address, details }) => {
  return await prisma.activityLog.create({
    data: {
      organisation_id: Number(organisation_id),
      action,
      user: user || "System",
      ip_address: ip_address || null,
      details: typeof details === "object" ? JSON.stringify(details) : details,
    },
  });
};

/* Super Admin Audit Logs */
const getSuperAdminAuditLogs = async ({ page = 1, limit = 50, action, severity } = {}) => {
  const where = {};
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (severity) where.severity = severity;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    // Fallback to activityLog
    return await getLogs({ page, limit, action });
  }
};

module.exports = {
  getLogs,
  createLog,
  getSuperAdminAuditLogs,
};
