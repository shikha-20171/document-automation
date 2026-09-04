/**
 * Centralized Granular Permission & Resource Scope Engine
 * Enforces strict SaaS role hierarchy and multi-tier scoping:
 * ORGANISATION -> DEPARTMENT -> TEAM -> OWN/ASSIGNED
 */

const ROLE_RANKS = {
  SUPER_ADMIN: 100,
  ORGANISATION_ADMIN: 80,
  DEPARTMENT_MANAGER: 60,
  TEAM_LEADER: 40,
  STAFF: 20,
  EMPLOYEE: 20,
};

const DEFAULT_ROLE_PERMISSIONS = {
  ORGANISATION_ADMIN: [
    "documents.*", "templates.*", "ai.*", "workflow.*", "approval.*",
    "crm.*", "esign.*", "forms.*", "reports.*", "users.*", "settings.*", "tasks.*"
  ],
  DEPARTMENT_MANAGER: [
    "documents.view", "documents.create", "documents.edit", "documents.share", "documents.download",
    "templates.view", "templates.create", "templates.edit",
    "ai.generate", "ai.ocr", "ai.qa", "ai.compare", "ai.summarize",
    "workflow.create", "workflow.execute", "workflow.manage",
    "approval.approve", "approval.reject", "approval.delegate", "approval.escalate",
    "crm.view", "esign.send", "esign.sign", "forms.create", "forms.manage",
    "reports.view", "tasks.*", "members.view"
  ],
  TEAM_LEADER: [
    "documents.view", "documents.create", "documents.edit", "documents.share", "documents.download",
    "templates.view",
    "ai.generate", "ai.ocr", "ai.qa", "ai.summarize",
    "workflow.execute", "approval.approve", "approval.reject",
    "esign.send", "esign.sign", "reports.view", "tasks.*", "members.view"
  ],
  EMPLOYEE: [
    "documents.view", "documents.create", "documents.edit", "documents.download", "documents.share",
    "templates.view", "templates.fill",
    "ai.generate", "ai.ocr", "ai.qa", "ai.summarize",
    "approval.submit", "esign.sign", "tasks.view", "tasks.update", "tasks.comment"
  ],
  STAFF: [
    "documents.view", "documents.create", "documents.edit", "documents.download", "documents.share",
    "templates.view", "templates.fill",
    "ai.generate", "ai.ocr", "ai.qa", "ai.summarize",
    "approval.submit", "esign.sign", "tasks.view", "tasks.update", "tasks.comment"
  ],
};

function normalizeRole(role) {
  if (!role) return "EMPLOYEE";
  const r = String(role).trim().toUpperCase().replace(/\s+/g, "_");
  if (r === "ORG_ADMIN") return "ORGANISATION_ADMIN";
  if (r === "DEPT_MANAGER") return "DEPARTMENT_MANAGER";
  if (r === "TEAM_LEAD") return "TEAM_LEADER";
  return r;
}

/**
 * Checks whether user has permission and is within resource scope
 */
function hasPermission(user, permission, resource = {}) {
  if (!user) return false;
  const role = normalizeRole(user.role || user.rawRole);

  // Super Admin has platform scope
  if (role === "SUPER_ADMIN") return true;

  // Verify Organisation Isolation
  const userOrgId = Number(user.organisation_id || user.organization_id || user.organisationId);
  const resOrgId = Number(resource.organisation_id || resource.organisationId);
  if (resOrgId && userOrgId && userOrgId !== resOrgId) {
    return false; // Strict tenant boundary breach
  }

  // 1. Check Granular Permission Grant
  const granted = DEFAULT_ROLE_PERMISSIONS[role] || [];
  const customPermissions = Array.isArray(user.custom_permissions) ? user.custom_permissions : [];
  const allPermissions = [...granted, ...customPermissions];

  const permCategory = permission.split(".")[0];
  const hasExact = allPermissions.includes(permission);
  const hasWildcard = allPermissions.includes(`${permCategory}.*`) || allPermissions.includes("*");

  if (!hasExact && !hasWildcard) {
    return false;
  }

  // 2. Check Resource Scope Hierarchy
  if (role === "ORGANISATION_ADMIN") {
    return true; // Full tenant scope
  }

  if (role === "DEPARTMENT_MANAGER") {
    // If resource is department-scoped, must match user's department
    if (resource.department_id && user.department_id) {
      return Number(resource.department_id) === Number(user.department_id);
    }
    return true;
  }

  if (role === "TEAM_LEADER") {
    // If resource is team-scoped, must match user's team
    if (resource.team_id && user.team_id) {
      return Number(resource.team_id) === Number(user.team_id);
    }
    return true;
  }

  if (role === "EMPLOYEE" || role === "STAFF") {
    // Employee can access only owned or assigned resource
    if (resource.created_by_user_id || resource.assigned_to_id || resource.userId) {
      const ownerId = Number(resource.created_by_user_id || resource.assigned_to_id || resource.userId);
      const currentUserId = Number(user.id || user.userId);
      if (ownerId && currentUserId && ownerId !== currentUserId) {
        return false;
      }
    }
    return true;
  }

  return true;
}

/**
 * Express Middleware generator for checking permission
 */
function requirePermission(permission, getResourceFn = null) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    let resource = {};
    if (typeof getResourceFn === "function") {
      try {
        resource = await getResourceFn(req);
      } catch (err) {
        return res.status(500).json({ success: false, message: "Error resolving resource for authorization." });
      }
    } else {
      resource = {
        organisation_id: req.user.organisation_id,
        department_id: req.body?.department_id || req.query?.department_id,
        team_id: req.body?.team_id || req.query?.team_id,
      };
    }

    const permitted = hasPermission(req.user, permission, resource);
    if (!permitted) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. You lack permission '${permission}' or are outside the allowed resource scope.`,
      });
    }

    next();
  };
}

module.exports = {
  hasPermission,
  requirePermission,
  normalizeRole,
  ROLE_RANKS,
  DEFAULT_ROLE_PERMISSIONS,
};
