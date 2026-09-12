const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { isOrgAdmin } = require("../middleware/roleMiddleware");
const {
  getFilterOptions,
  getAnalyticsOverview,
  getDocumentActivity,
  getStatusDistribution,
  getDocumentTypes,
  getDocumentAnalytics,
  getAiAnalytics,
  getWorkflowAnalytics,
  getApprovalAnalytics,
  getDepartmentAnalytics,
  getBranchAnalytics,
  getUserTeamAnalytics,
  getSignatureAnalytics,
  getClientAnalytics,
  getBottlenecks,
  getRecentActivity,
  getTopDocuments,
  getReportTable,
  exportReport,
  getStorageAnalytics,
} = require("../controllers/orgAnalyticsController");

// Strict Tenant & Org Admin RBAC Protection
router.use(verifyToken);
router.use(isOrgAdmin);

// Filter Metadata
router.get("/filters", getFilterOptions);
router.get("/filter-options", getFilterOptions);

// Overview & KPIs
router.get("/", getAnalyticsOverview);
router.get("/overview", getAnalyticsOverview);
router.get("/data", getAnalyticsOverview);

// Time-Series Document Activity
router.get("/activity", getDocumentActivity);

// Status Distribution (Pie / Donut)
router.get("/status-distribution", getStatusDistribution);

// Document Types
router.get("/document-types", getDocumentTypes);
router.get("/documents", getDocumentAnalytics);

// AI Automation Consumption
router.get("/ai", getAiAnalytics);

// Workflow & Stage Funnel Performance
router.get("/workflow", getWorkflowAnalytics);

// Approval Performance & Approvers
router.get("/approvals", getApprovalAnalytics);

// Department Performance
router.get("/departments", getDepartmentAnalytics);

// Branch Performance
router.get("/branches", getBranchAnalytics);

// User Activity
router.get("/users", getUserTeamAnalytics);
router.get("/team", getUserTeamAnalytics);

// Signature Performance
router.get("/signatures", getSignatureAnalytics);

// Client Document Activity
router.get("/clients", getClientAnalytics);

// Workflow Bottlenecks & Insights
router.get("/bottlenecks", getBottlenecks);

// Recent Document Activity Timeline
router.get("/recent-activity", getRecentActivity);

// Top / Most Active Documents
router.get("/top-documents", getTopDocuments);

// Detailed Document Report Table (Paginated)
router.get("/report", getReportTable);

// Export Report (CSV, JSON, Excel)
router.get("/export", exportReport);

// Storage Analytics
router.get("/storage", getStorageAnalytics);

module.exports = router;
