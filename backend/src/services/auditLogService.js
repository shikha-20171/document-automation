const prisma = require("../config/prismaClient");
const { v4: uuidv4 } = require("uuid");

// Sensitive keys to always sanitize and never store in audit logs
const SENSITIVE_KEYS = [
  "password",
  "password_hash",
  "passwordhash",
  "token",
  "access_token",
  "accesstoken",
  "refresh_token",
  "refreshtoken",
  "secret",
  "secret_key",
  "secretkey",
  "api_key",
  "apikey",
  "authorization",
  "auth_header",
  "bearer",
  "private_key",
  "client_secret",
  "raw_response",
  "document_content",
  "extracted_text",
];

/**
 * Recursively sanitize an object by stripping or masking sensitive keys
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((s) => lowerKey.includes(s));

    if (isSensitive) {
      if (typeof value === "string" && value.length >= 6 && (lowerKey.includes("key") || lowerKey.includes("token"))) {
        sanitized[`${key}Masked`] = `••••••••••••${value.slice(-4)}`;
      } else {
        sanitized[key] = "[REDACTED]";
      }
    } else if (value !== null && typeof value === "object") {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Extract browser and operating system details from user-agent
 */
const parseUserAgent = (userAgent = "") => {
  let browser = "Chrome/Modern Browser";
  let operatingSystem = "Enterprise OS";

  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edge") || userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";

  if (userAgent.includes("Windows")) operatingSystem = "Windows";
  else if (userAgent.includes("Mac OS") || userAgent.includes("Macintosh")) operatingSystem = "macOS";
  else if (userAgent.includes("Linux")) operatingSystem = "Linux";
  else if (userAgent.includes("Android")) operatingSystem = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) operatingSystem = "iOS";

  return { browser, operatingSystem };
};

/**
 * Centralized Production Audit Log Service
 */
class AuditLogService {
  /**
   * Log an immutable audit event
   */
  static async log({
    actorUserId = null,
    actorId = null,
    actorName = "Super Admin",
    actorRole = "SUPER_ADMIN",
    actorType = "SUPER_ADMIN",
    organisationId = null,
    organisationName = "Platform",
    module = "PLATFORM",
    action = "PLATFORM_ACTION",
    resourceType = "PLATFORM",
    resourceId = null,
    resourceName = null,
    severity = "INFO",
    status = "SUCCESS",
    result = "SUCCESS",
    beforeData = null,
    afterData = null,
    oldValues = null,
    newValues = null,
    metadata = {},
    retentionUntil = null,
    req = null,
  }) {
    try {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
      const randPart = Math.floor(10000 + Math.random() * 90000);
      const eventId = `EVT-${datePart}-${randPart}`;

      const requestId = req?.headers?.["x-request-id"] || req?.id || `req_${uuidv4().slice(0, 8)}`;
      const ipAddress =
        req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
        req?.ip ||
        req?.connection?.remoteAddress ||
        "127.0.0.1";
      const userAgent = req?.headers?.["user-agent"] || "Platform API Client";
      const { browser, operatingSystem } = parseUserAgent(userAgent);

      const effectiveBefore = beforeData || oldValues || null;
      const effectiveAfter = afterData || newValues || null;

      const sanitizedBefore = sanitizeData(effectiveBefore);
      const sanitizedAfter = sanitizeData(effectiveAfter);
      const sanitizedMeta = sanitizeData(metadata);

      const detailsObj = {
        action,
        organisationName: organisationName || "Platform",
        requestId,
        beforeData: sanitizedBefore,
        afterData: sanitizedAfter,
        metadata: sanitizedMeta,
      };

      const normalizedSeverity = ["INFO", "WARNING", "CRITICAL"].includes((severity || "").toUpperCase())
        ? severity.toUpperCase()
        : "INFO";

      const normalizedResult = (status || result || "SUCCESS").toUpperCase() === "FAILED" ? "FAILED" : "SUCCESS";

      const auditEntry = await prisma.auditLog.create({
        data: {
          eventId,
          actorUserId: actorUserId ? String(actorUserId) : actorId ? String(actorId) : null,
          actorName: String(actorName || "System Actor"),
          actorRole: String(actorRole || "SUPER_ADMIN"),
          actorType: (actorType || "SUPER_ADMIN").toUpperCase() === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ORG_ADMIN",
          organisationId: organisationId ? String(organisationId) : null,
          organisationName: String(organisationName || "Platform"),
          module: (module || "PLATFORM").toUpperCase() === "SECURITY" ? "SECURITY" : "PLATFORM",
          action: String(action || "GENERAL_ACTION").toUpperCase(),
          resourceType: resourceType ? String(resourceType) : "PLATFORM",
          resourceId: resourceId ? String(resourceId) : null,
          resourceName: resourceName ? String(resourceName) : resourceType || "Resource",
          severity: normalizedSeverity,
          status: normalizedResult,
          result: normalizedResult,
          ipAddress: String(ipAddress).slice(0, 100),
          userAgent: String(userAgent),
          browser,
          operatingSystem,
          location: "Secure Cloud Node",
          requestId: String(requestId),
          beforeData: sanitizedBefore,
          afterData: sanitizedAfter,
          metadata: sanitizedMeta,
          details: detailsObj,
          retentionUntil: retentionUntil ? new Date(retentionUntil) : null,
        },
      });

      return auditEntry;
    } catch (error) {
      console.error("[AuditLogService] Failed to record audit log:", error.message);
      return null;
    }
  }

  /**
   * Helper alias for createAuditLog
   */
  static async createAuditLog(params) {
    return this.log(params);
  }

  /**
   * Build Prisma `where` clause from query parameters
   */
  static buildWhereClause(query = {}) {
    const {
      search,
      organisationId,
      actorUserId,
      actor,
      role,
      action,
      resourceType,
      severity,
      status,
      result,
      startDate,
      endDate,
      dateFrom,
      dateTo,
      module,
      category,
    } = query;

    const where = {};

    if (organisationId && organisationId !== "ALL") {
      where.organisationId = String(organisationId);
    }

    if (actorUserId && actorUserId !== "ALL") {
      where.actorUserId = String(actorUserId);
    } else if (actor && actor.trim()) {
      where.actorName = { contains: actor.trim(), mode: "insensitive" };
    }

    if (role && role !== "ALL") {
      where.actorRole = { contains: role.trim(), mode: "insensitive" };
    }

    if (action && action !== "ALL") {
      where.action = { contains: action.trim(), mode: "insensitive" };
    }

    if (resourceType && resourceType !== "ALL") {
      where.resourceType = { contains: resourceType.trim(), mode: "insensitive" };
    }

    if (severity && severity !== "ALL") {
      where.severity = severity.toUpperCase() === "CRITICAL" ? "CRITICAL" : severity.toUpperCase() === "WARNING" ? "WARNING" : "INFO";
    }

    const activeStatus = status || result;
    if (activeStatus && activeStatus !== "ALL") {
      where.status = activeStatus.toUpperCase() === "FAILED" ? "FAILED" : "SUCCESS";
    }

    const activeModule = module || category;
    if (activeModule && activeModule !== "ALL") {
      where.module = activeModule.toUpperCase() === "SECURITY" ? "SECURITY" : "PLATFORM";
    }

    const from = startDate || dateFrom;
    const to = endDate || dateTo;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      where.OR = [
        { eventId: { contains: cleanSearch, mode: "insensitive" } },
        { action: { contains: cleanSearch, mode: "insensitive" } },
        { actorName: { contains: cleanSearch, mode: "insensitive" } },
        { actorRole: { contains: cleanSearch, mode: "insensitive" } },
        { resourceType: { contains: cleanSearch, mode: "insensitive" } },
        { resourceName: { contains: cleanSearch, mode: "insensitive" } },
        { resourceId: { contains: cleanSearch, mode: "insensitive" } },
        { organisationName: { contains: cleanSearch, mode: "insensitive" } },
        { ipAddress: { contains: cleanSearch, mode: "insensitive" } },
        { requestId: { contains: cleanSearch, mode: "insensitive" } },
      ];
    }

    return where;
  }

  /**
   * Format single log output for frontend
   */
  static formatLog(log) {
    return {
      id: log.id,
      eventId: log.eventId,
      createdAt: log.createdAt,
      timestamp: log.createdAt.toISOString(),
      actorUserId: log.actorUserId || log.actorId,
      actorName: log.actorName,
      actorRole: log.actorRole || "SUPER_ADMIN",
      actorType: log.actorType,
      organisationId: log.organisationId,
      organisationName: log.organisationName || log.details?.organisationName || "Platform",
      module: log.module,
      action: log.action,
      resourceType: log.resourceType || "PLATFORM",
      resourceId: log.resourceId,
      resourceName: log.resourceName,
      severity: log.severity,
      status: log.status || log.result || "SUCCESS",
      ipAddress: log.ipAddress || "127.0.0.1",
      userAgent: log.userAgent,
      browser: log.browser,
      operatingSystem: log.operatingSystem,
      location: log.location,
      requestId: log.requestId || log.details?.requestId || `req_${log.eventId}`,
      beforeData: log.beforeData || log.details?.beforeData || log.details?.oldValues || null,
      afterData: log.afterData || log.details?.afterData || log.details?.newValues || null,
      metadata: log.metadata || log.details?.metadata || {},
      retentionUntil: log.retentionUntil,
    };
  }

  /**
   * Get paginated audit logs
   */
  static async getLogs(query = {}) {
    const {
      page = 1,
      limit = 25,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * take;

    const where = this.buildWhereClause(query);

    const validSortFields = ["createdAt", "action", "severity", "status", "actorName", "organisationName"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { [sortField]: sortOrder === "asc" ? "asc" : "desc" },
        skip,
        take,
      }),
    ]);

    const totalPages = Math.ceil(total / take) || 1;

    return {
      success: true,
      data: logs.map(this.formatLog),
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages,
        hasPrev: pageNum > 1,
        hasNext: pageNum < totalPages,
      },
    };
  }

  /**
   * Get dedicated security events
   */
  static async getSecurityEvents(query = {}) {
    const securityActions = [
      "LOGIN_SUCCESS",
      "LOGIN_FAILED",
      "LOGOUT",
      "PASSWORD_CHANGED",
      "PASSWORD_RESET_REQUESTED",
      "PASSWORD_RESET_COMPLETED",
      "MFA_ENABLED",
      "MFA_DISABLED",
      "MFA_FAILED",
      "SESSION_CREATED",
      "SESSION_REVOKED",
      "ACCOUNT_LOCKED",
      "ACCOUNT_UNLOCKED",
      "SECURITY_SETTING_CHANGED",
      "AUDIT_LOG_EXPORTED",
    ];

    const baseWhere = this.buildWhereClause(query);
    const where = {
      ...baseWhere,
      OR: [
        { action: { in: securityActions } },
        { severity: { in: ["WARNING", "CRITICAL"] } },
        { action: { contains: "LOGIN", mode: "insensitive" } },
        { action: { contains: "SECURITY", mode: "insensitive" } },
        { action: { contains: "MFA", mode: "insensitive" } },
        { action: { contains: "PASSWORD", mode: "insensitive" } },
      ],
    };

    const pageNum = Math.max(1, parseInt(query.page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
    const skip = (pageNum - 1) * take;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    const totalPages = Math.ceil(total / take) || 1;

    return {
      success: true,
      data: logs.map(this.formatLog),
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages,
      },
    };
  }

  /**
   * Get dedicated admin actions
   */
  static async getAdminActions(query = {}) {
    const baseWhere = this.buildWhereClause(query);
    const where = {
      ...baseWhere,
      OR: [
        { actorRole: { in: ["SUPER_ADMIN", "ORGANISATION_ADMIN", "ADMIN"] } },
        { action: { startsWith: "ORGANISATION_" } },
        { action: { startsWith: "USER_" } },
        { action: { startsWith: "AI_" } },
        { action: { startsWith: "OCR_" } },
        { action: { startsWith: "STORAGE_" } },
        { action: { startsWith: "PLATFORM_" } },
        { action: { startsWith: "SECURITY_" } },
      ],
    };

    const pageNum = Math.max(1, parseInt(query.page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
    const skip = (pageNum - 1) * take;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    const totalPages = Math.ceil(total / take) || 1;

    return {
      success: true,
      data: logs.map(this.formatLog),
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages,
      },
    };
  }

  /**
   * Get KPI metrics & real database charts for Super Admin Overview
   */
  static async getOverviewMetrics(query = {}) {
    const days = parseInt(query.days, 10) || 7;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const timelineStart = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      eventsToday,
      successfulEvents,
      failedEvents,
      criticalEvents,
      securityEvents,
      adminActions,
      activeOrganisations,
      timelineLogs,
      topActionsRaw,
      topOrgsRaw,
      topRolesRaw,
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.auditLog.count({ where: { status: "SUCCESS" } }),
      prisma.auditLog.count({ where: { status: "FAILED" } }),
      prisma.auditLog.count({ where: { severity: "CRITICAL" } }),
      prisma.auditLog.count({
        where: {
          OR: [
            { action: { contains: "LOGIN" } },
            { action: { contains: "MFA" } },
            { action: { contains: "PASSWORD" } },
            { action: { contains: "SECURITY" } },
            { action: { contains: "DENIED" } },
            { severity: { in: ["WARNING", "CRITICAL"] } },
          ],
        },
      }),
      prisma.auditLog.count({
        where: {
          OR: [
            { actorRole: "SUPER_ADMIN" },
            { action: { startsWith: "ORGANISATION_" } },
            { action: { startsWith: "AI_" } },
            { action: { startsWith: "OCR_" } },
            { action: { startsWith: "PLATFORM_" } },
            { action: { startsWith: "PLAN_" } },
          ],
        },
      }),
      prisma.organisation.count({
        where: { status: { in: ["ACTIVE", "active", "INVITED", "pending"] } },
      }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: timelineStart } },
        select: { createdAt: true, status: true, action: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ["organisationName"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
      prisma.auditLog.groupBy({
        by: ["actorRole"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    // Build timeline buckets across the requested interval
    const timelineMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      timelineMap[dateStr] = { date: dateStr, total: 0, success: 0, failed: 0, security: 0 };
    }

    timelineLogs.forEach((log) => {
      const logDate = new Date(log.createdAt);
      const dateStr = logDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (timelineMap[dateStr]) {
        timelineMap[dateStr].total += 1;
        if (log.status === "SUCCESS") timelineMap[dateStr].success += 1;
        if (log.status === "FAILED") timelineMap[dateStr].failed += 1;
        if (["LOGIN_FAILED", "MFA_FAILED", "SECURITY_SETTING_CHANGED", "CROSS_TENANT_ACCESS_ATTEMPT", "PERMISSION_DENIED"].some(a => log.action.includes(a))) {
          timelineMap[dateStr].security += 1;
        }
      }
    });

    const eventsOverTime = Object.values(timelineMap);

    const eventsByAction = topActionsRaw.map((a) => ({
      action: a.action,
      count: a._count.id,
    }));

    const eventsByOrganisation = topOrgsRaw.map((o) => ({
      organisation: o.organisationName || "Platform System",
      count: o._count.id,
    }));

    const eventsByRole = topRolesRaw.map((r) => ({
      role: r.actorRole || "SUPER_ADMIN",
      count: r._count.id,
    }));

    return {
      success: true,
      data: {
        totalEvents,
        eventsToday,
        successfulEvents,
        failedEvents,
        securityEvents,
        criticalEvents,
        adminActions,
        activeOrganisations,
        charts: {
          eventsOverTime,
          eventsByAction,
          eventsByOrganisation,
          eventsByRole,
          successVsFailed: {
            success: successfulEvents,
            failed: failedEvents,
          },
        },
      },
    };
  }

  /**
   * Helper alias for getSummary
   */
  static async getSummary() {
    return this.getOverviewMetrics();
  }

  /**
   * Get single audit log detail by ID
   */
  static async getLogById(id) {
    const log = await prisma.auditLog.findFirst({
      where: {
        OR: [{ id: String(id) }, { eventId: String(id) }],
      },
    });

    if (!log) {
      throw new Error("Audit log entry not found.");
    }

    return {
      success: true,
      data: this.formatLog(log),
    };
  }

  /**
   * Export audit logs as CSV or JSON and self-audit the export action
   */
  static async exportLogs(query = {}, format = "csv", user = null, req = null) {
    const result = await this.getLogs({ ...query, limit: 2000, page: 1 });
    const logs = result.data || [];

    // Self-audit the export operation (never infinite loops because AUDIT_LOG_EXPORTED doesn't trigger export)
    await this.log({
      actorUserId: user?.id,
      actorName: user?.name || user?.full_name || "Super Admin",
      actorRole: user?.role || "SUPER_ADMIN",
      organisationId: user?.organisationId || null,
      organisationName: "Platform",
      module: "SECURITY",
      action: "AUDIT_LOG_EXPORTED",
      resourceType: "AUDIT_LOG",
      resourceId: `export_${format}`,
      resourceName: `Audit Log Export (${format.toUpperCase()})`,
      severity: "WARNING",
      status: "SUCCESS",
      result: "SUCCESS",
      metadata: {
        exportedCount: logs.length,
        exportFormat: format,
        appliedFilters: query,
      },
      req,
    });

    if (format.toLowerCase() === "json") {
      return {
        format: "json",
        contentType: "application/json",
        filename: `audit-logs-${Date.now()}.json`,
        data: JSON.stringify(logs, null, 2),
      };
    }

    // CSV Format with proper quotes & sanitization
    const headers = [
      "Event ID",
      "Timestamp",
      "Actor Name",
      "Actor Role",
      "Organisation",
      "Action",
      "Resource Type",
      "Resource ID",
      "Status",
      "Severity",
      "IP Address",
      "Request ID",
      "Before Data",
      "After Data",
    ];

    const rows = logs.map((l) => [
      `"${l.eventId}"`,
      `"${l.timestamp}"`,
      `"${(l.actorName || "").replace(/"/g, '""')}"`,
      `"${l.actorRole || ""}"`,
      `"${(l.organisationName || "").replace(/"/g, '""')}"`,
      `"${l.action}"`,
      `"${l.resourceType || ""}"`,
      `"${l.resourceId || ""}"`,
      `"${l.status}"`,
      `"${l.severity}"`,
      `"${l.ipAddress || ""}"`,
      `"${l.requestId || ""}"`,
      `"${JSON.stringify(l.beforeData || {}).replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.afterData || {}).replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return {
      format: "csv",
      contentType: "text/csv",
      filename: `audit-logs-${Date.now()}.csv`,
      data: csvContent,
    };
  }
}

module.exports = AuditLogService;
