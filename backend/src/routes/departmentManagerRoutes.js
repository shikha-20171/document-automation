const express = require("express");
const router = express.Router();

const dashboardRoutes = require("./departmentManagerDashboardRoutes");
const documentsRoutes = require("./departmentManagerDocumentsRoutes");
const templatesRoutes = require("./departmentManagerTemplatesRoutes");
const teamsRoutes = require("./departmentManagerTeamsRoutes");
const approvalsRoutes = require("./departmentManagerApprovalsRoutes");
const reportsRoutes = require("./departmentManagerReportsRoutes");
const notificationsRoutes = require("./departmentManagerNotificationsRoutes");
const profileRoutes = require("./departmentManagerProfileRoutes");

/**
 * Department Manager Sub-module Routes
 */
router.use("/dashboard", dashboardRoutes);
router.use("/documents", documentsRoutes);
router.use("/templates", templatesRoutes);
router.use("/team", teamsRoutes);
router.use("/teams", teamsRoutes);
router.use("/approvals", approvalsRoutes);
router.use("/reports", reportsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/profile", profileRoutes);

module.exports = router;
