/**
 * Team Leader Main Controller Aggregator
 * Re-exports from modular sub-controllers for backward compatibility
 */
const dashboard = require("./teamLeaderDashboardController");
const team = require("./teamLeaderTeamController");
const documents = require("./teamLeaderDocumentsController");
const templates = require("./teamLeaderTemplatesController");
const tasks = require("./teamLeaderTasksController");
const approvals = require("./teamLeaderApprovalsController");
const workflow = require("./teamLeaderWorkflowController");
const aiTools = require("./teamLeaderAiToolsController");
const reports = require("./teamLeaderReportsController");
const notifications = require("./teamLeaderNotificationsController");
const profile = require("./teamLeaderProfileController");
const support = require("./teamLeaderSupportController");

module.exports = {
  ...dashboard,
  ...team,
  ...documents,
  ...templates,
  ...tasks,
  ...approvals,
  ...workflow,
  ...aiTools,
  ...reports,
  ...notifications,
  ...profile,
  ...support,
};
