const express = require("express");
const router = express.Router();

const dashboardRoutes = require("./teamLeaderDashboardRoutes");
const teamRoutes = require("./teamLeaderTeamRoutes");
const documentsRoutes = require("./teamLeaderDocumentsRoutes");
const templatesRoutes = require("./teamLeaderTemplatesRoutes");
const tasksRoutes = require("./teamLeaderTasksRoutes");
const approvalsRoutes = require("./teamLeaderApprovalsRoutes");
const workflowRoutes = require("./teamLeaderWorkflowRoutes");
const aiToolsRoutes = require("./teamLeaderAiToolsRoutes");
const reportsRoutes = require("./teamLeaderReportsRoutes");
const notificationsRoutes = require("./teamLeaderNotificationsRoutes");
const profileRoutes = require("./teamLeaderProfileRoutes");
const supportRoutes = require("./teamLeaderSupportRoutes");

/**
 * Team Leader Sub-module Routes
 */
router.use("/dashboard", dashboardRoutes);
router.use("/my-team", teamRoutes);
router.use("/team", teamRoutes);
router.use("/documents", documentsRoutes);
router.use("/templates", templatesRoutes);
router.use("/tasks", tasksRoutes);
router.use("/approvals", approvalsRoutes);
router.use("/workflow", workflowRoutes);
router.use("/ai-tools", aiToolsRoutes);
router.use("/reports", reportsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/profile", profileRoutes);
router.use("/support", supportRoutes);

module.exports = router;
