const authMiddleware = require("./authMiddleware");
const roleMiddleware = require("./roleMiddleware");
const tenantMiddleware = require("./tenantMiddleware");
const rateLimiterMiddleware = require("./rateLimiterMiddleware");
const validationMiddleware = require("./validationMiddleware");
const apiKeyMiddleware = require("./apiKeyMiddleware");
const auditLoggerMiddleware = require("./auditLoggerMiddleware");
const uploadMiddleware = require("./uploadMiddleware");
const errorMiddleware = require("./errorMiddleware");

module.exports = {
  // Auth
  verifyToken: authMiddleware.verifyToken || authMiddleware,
  authenticate: authMiddleware.authenticate || authMiddleware,
  optionalAuth: authMiddleware.optionalAuth,

  // RBAC Roles
  authorizeRoles: roleMiddleware.authorizeRoles,
  requireRole: roleMiddleware.requireRole,
  isSuperAdmin: roleMiddleware.isSuperAdmin,
  isOrgAdmin: roleMiddleware.isOrgAdmin,
  isDepartmentManager: roleMiddleware.isDepartmentManager,
  isTeamLeader: roleMiddleware.isTeamLeader,
  isStaffOrAbove: roleMiddleware.isStaffOrAbove,

  // Multi-Tenancy
  requireTenant: tenantMiddleware.requireTenant,
  validateTenantAccess: tenantMiddleware.validateTenantAccess,

  // Rate Limiting
  createRateLimiter: rateLimiterMiddleware.createRateLimiter,
  authLimiter: rateLimiterMiddleware.authLimiter,
  aiLimiter: rateLimiterMiddleware.aiLimiter,
  apiLimiter: rateLimiterMiddleware.apiLimiter,

  // Validation
  validate: validationMiddleware.validate,
  validateRequiredFields: validationMiddleware.validateRequiredFields,

  // API Key Auth
  verifyApiKey: apiKeyMiddleware.verifyApiKey,

  // Audit Logging
  auditLogger: auditLoggerMiddleware.auditLogger || auditLoggerMiddleware,

  // Upload
  upload: uploadMiddleware,

  // Error Handling
  errorMiddleware,
  ApiError: errorMiddleware.ApiError,
};
