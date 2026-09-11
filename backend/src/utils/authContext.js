/**
 * Auth Context Helper
 *
 * Extracts and validates the authenticated user's context from the request.
 * Uses the JWT claims set by authMiddleware. Returns null orgId if not present
 * rather than silently falling back to org #1.
 */

/**
 * Get organisation ID from request. Returns null if not authenticated.
 * Callers should handle null (return 401/403 if org is required).
 */
function getOrgId(req) {
  const id = req.user?.organisationId || req.user?.organisation_id || req.user?.organization_id;
  return id ? Number(id) : null;
}

/**
 * Get organisation ID with safe fallback for read-only public/shared endpoints.
 * Use getOrgId() for all write operations.
 */
function getOrgIdSafe(req, fallback = 1) {
  const id = getOrgId(req);
  return id !== null ? id : fallback;
}

/**
 * Get user ID from request
 */
function getUserId(req) {
  return req.user?.id || req.user?.userId || null;
}

/**
 * Get user role from request
 */
function getUserRole(req) {
  return (req.user?.role || "EMPLOYEE").toUpperCase();
}

/**
 * Get full auth context from request
 */
function getAuthContext(req) {
  return {
    orgId: getOrgId(req),
    userId: getUserId(req),
    role: getUserRole(req),
    email: req.user?.email || null,
    name: req.user?.full_name || req.user?.name || null,
    departmentId: req.user?.department_id || req.user?.departmentId ? parseInt(req.user.department_id || req.user.departmentId, 10) : null,
    teamId: req.user?.team_id || req.user?.teamId ? parseInt(req.user.team_id || req.user.teamId, 10) : null,
  };
}

module.exports = { getOrgId, getOrgIdSafe, getUserId, getUserRole, getAuthContext };
