/**
 * Multi-Tenancy Middleware
 * Ensures all operations are scoped to the current user's organisation.
 */

const requireTenant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const userRole = (req.user.role || "").toUpperCase();

  // Super Admin can optionally specify organisationId via header/query/param
  if (userRole === "SUPER_ADMIN") {
    const overrideOrgId =
      req.headers["x-organisation-id"] ||
      req.query.organisationId ||
      req.query.organisation_id ||
      req.params.organisationId ||
      req.params.orgId;

    if (overrideOrgId) {
      req.organisationId = parseInt(overrideOrgId, 10);
      return next();
    }
  }

  // Normal users must belong to an organisation
  const orgId = req.user.organisationId || req.user.organisation_id;

  if (!orgId && userRole !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "User is not associated with any organisation.",
    });
  }

  req.organisationId = orgId ? parseInt(orgId, 10) : null;
  next();
};

/**
 * Validates that requested entity organisation matches current tenant organisation
 */
const validateTenantAccess = (entityOrgId, req) => {
  if (!entityOrgId) return true;
  if (req.user && req.user.role === "SUPER_ADMIN") return true;
  return Number(entityOrgId) === Number(req.organisationId);
};

module.exports = {
  requireTenant,
  validateTenantAccess,
};
