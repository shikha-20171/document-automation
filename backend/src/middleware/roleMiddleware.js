/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated user has one of the allowed roles.
 */

// Normalized role mapper
const normalizeRole = (role) => {
  if (!role) return "";
  return String(role).trim().toUpperCase().replace(/\s+/g, "_");
};

/**
 * Authorize specific roles
 * @param  {...string|string[]} allowedRoles - List of allowed roles (e.g. 'SUPER_ADMIN', 'ORGANISATION_ADMIN')
 */
const authorizeRoles = (...allowedRoles) => {
  const flattenedRoles = allowedRoles
    .flat()
    .map((r) => normalizeRole(r));

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before checking permissions.",
      });
    }

    const userRole = normalizeRole(req.user.role || req.user.rawRole);

    // Super Admin has universal access
    if (userRole === "SUPER_ADMIN") {
      return next();
    }

    const hasPermission = flattenedRoles.includes(userRole);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. You do not have permission to perform this action. Required role: [${flattenedRoles.join(", ")}]. Current role: ${userRole}.`,
      });
    }

    next();
  };
};

/**
 * Predefined Role Middleware Shortcuts
 */
const isSuperAdmin = authorizeRoles("SUPER_ADMIN");
const isOrgAdmin = authorizeRoles("SUPER_ADMIN", "ORGANISATION_ADMIN");
const isDepartmentManager = authorizeRoles("SUPER_ADMIN", "ORGANISATION_ADMIN", "DEPARTMENT_MANAGER");
const isTeamLeader = authorizeRoles("SUPER_ADMIN", "ORGANISATION_ADMIN", "DEPARTMENT_MANAGER", "TEAM_LEADER");
const isStaffOrAbove = authorizeRoles("SUPER_ADMIN", "ORGANISATION_ADMIN", "DEPARTMENT_MANAGER", "TEAM_LEADER", "STAFF", "EMPLOYEE");

module.exports = {
  authorizeRoles,
  requireRole: authorizeRoles,
  isSuperAdmin,
  isOrgAdmin,
  isDepartmentManager,
  isTeamLeader,
  isStaffOrAbove,
  normalizeRole,
};
