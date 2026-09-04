const express = require("express");
const router = express.Router();
const {
  getAuditLogs,
  getAuditOverview,
  getSecurityEvents,
  getAdminActions,
  getAuditLogById,
  exportAuditLogs,
  createAuditLog,
} = require("../controllers/superAdminAuditLogController");
const verifyToken = require("../middleware/authMiddleware");

// RBAC Middleware: Restrict access exclusively to SUPER_ADMIN
const requireSuperAdmin = (req, res, next) => {
  const role = (req.user?.role || req.user?.rawRole || "").toUpperCase().replace(/\s+/g, "_");
  if (role === "SUPER_ADMIN" || role === "SUPERADMIN") {
    return next();
  }
  return res.status(403).json({
    success: false,
    code: "FORBIDDEN",
    message: "You do not have permission to access platform audit logs. Super Admin access required.",
  });
};

// Apply auth and Super Admin RBAC across all audit log routes
router.use(verifyToken);
router.use(requireSuperAdmin);

// Overview & Telemetry KPIs
router.get("/overview", getAuditOverview);
router.get("/summary", getAuditOverview); // Backward compatibility alias

// Filtered categories
router.get("/security-events", getSecurityEvents);
router.get("/admin-actions", getAdminActions);

// Filter-aware Export
router.get("/export", exportAuditLogs);

// Activity Logs with search, filter, pagination, sorting
router.get("/", getAuditLogs);

// Specific Log Entry (by id or eventId)
router.get("/:id", getAuditLogById);

// Programmatic Log Entry Creation
router.post("/", createAuditLog);

module.exports = router;
