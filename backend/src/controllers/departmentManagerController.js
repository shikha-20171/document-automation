/**
 * Department Manager Main Controller Aggregator
 * Re-exports from modular sub-controllers for backward compatibility
 */
const dashboard = require("./departmentManagerDashboardController");
const documents = require("./departmentManagerDocumentsController");
const templates = require("./departmentManagerTemplatesController");
const teams = require("./departmentManagerTeamsController");
const approvals = require("./departmentManagerApprovalsController");
const reports = require("./departmentManagerReportsController");
const notifications = require("./departmentManagerNotificationsController");
const profile = require("./departmentManagerProfileController");

module.exports = {
  ...dashboard,
  ...documents,
  ...templates,
  ...teams,
  ...approvals,
  ...reports,
  ...notifications,
  ...profile,
};
