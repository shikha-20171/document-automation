const AuditLogService = require("../services/auditLogService");

/**
 * List paginated and filtered platform audit logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const result = await AuditLogService.getLogs(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit overview KPIs & metrics
 */
const getAuditOverview = async (req, res, next) => {
  try {
    const result = await AuditLogService.getOverviewMetrics(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get security events
 */
const getSecurityEvents = async (req, res, next) => {
  try {
    const result = await AuditLogService.getSecurityEvents(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin actions
 */
const getAdminActions = async (req, res, next) => {
  try {
    const result = await AuditLogService.getAdminActions(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single audit log detail
 */
const getAuditLogById = async (req, res, next) => {
  try {
    const result = await AuditLogService.getLogById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "Audit log entry not found.",
    });
  }
};

/**
 * Export audit logs (CSV or JSON) with active filters
 */
const exportAuditLogs = async (req, res, next) => {
  try {
    const format = (req.query.format || "csv").toLowerCase();
    const exportResult = await AuditLogService.exportLogs(req.query, format, req.user, req);

    res.setHeader("Content-Type", exportResult.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${exportResult.filename}"`);
    return res.send(exportResult.data);
  } catch (error) {
    next(error);
  }
};

/**
 * Record a custom platform audit log entry (internal / programmatic)
 */
const createAuditLog = async (req, res, next) => {
  try {
    const log = await AuditLogService.log({
      ...req.body,
      req,
    });

    return res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditOverview,
  getSecurityEvents,
  getAdminActions,
  getAuditLogById,
  exportAuditLogs,
  createAuditLog,
};
