const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization Bearer header or cookies
 */
const verifyToken = (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (authHeader) {
      token = authHeader;
    }

    // 2. Fallback check cookie
    if (!token && req.cookies) {
      token = req.cookies.token || req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide a valid token.",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "document-automation-dev-secret"
    );

    // Normalize and attach user info
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.id || decoded.userId,
      email: decoded.email,
      role: (decoded.role || "STAFF").toUpperCase().replace(/\s+/g, "_"),
      rawRole: decoded.role,
      organisationId: decoded.organisationId || decoded.organisation_id || null,
      organisation_id: decoded.organisationId || decoded.organisation_id || null,
      departmentId: decoded.departmentId || decoded.department_id || null,
      department_id: decoded.departmentId || decoded.department_id || null,
      teamId: decoded.teamId || decoded.team_id || null,
      team_id: decoded.teamId || decoded.team_id || null,
      locationId: decoded.locationId || decoded.location_id || null,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session has timed out or expired. Please log in again.",
        expired: true,
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or unauthorized access token.",
    });
  }
};

/**
 * Optional Authentication Middleware
 * If token exists and is valid, attaches req.user; otherwise proceeds without failing.
 */
const optionalAuth = (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (authHeader) {
      token = authHeader;
    } else if (req.cookies) {
      token = req.cookies.token || req.cookies.access_token;
    }

    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "document-automation-dev-secret"
      );
      req.user = {
        id: decoded.id || decoded.userId,
        userId: decoded.id || decoded.userId,
        email: decoded.email,
        role: (decoded.role || "STAFF").toUpperCase().replace(/\s+/g, "_"),
        rawRole: decoded.role,
        organisationId: decoded.organisationId || decoded.organisation_id || null,
        organisation_id: decoded.organisationId || decoded.organisation_id || null,
        locationId: decoded.locationId || decoded.location_id || null,
      };
    }
  } catch (err) {
    // Ignore error for optional auth
    req.user = null;
  }
  next();
};

// Export as both function and object for backwards compatibility
module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
module.exports.authenticate = verifyToken;
module.exports.optionalAuth = optionalAuth;
