const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});
require("dotenv").config();

// Global BigInt JSON serialization support
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    const intVal = Number(this);
    return Number.isSafeInteger(intVal) ? intVal : this.toString();
  };
}

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const organisationRoutes = require("./routes/organisationRoutes");
const organisationAdminRoutes = require("./routes/organisationAdminRoutes");
const companyRoutes = require("./routes/companyRoutes");
const emailRoutes = require("./routes/emailRoutes");
const aiProviderRoutes = require("./routes/aiProviderRoutes");
const aiModelRoutes = require("./routes/aiModelRoutes");
const superAdminDashboardRoutes = require("./routes/superAdminDashboardRoutes");
const superAdminStorageRoutes = require("./routes/superAdminStorageRoutes");
const superAdminSubscriptionRoutes = require("./routes/superAdminSubscriptionRoutes");
const superAdminAiManagementRoutes = require("./routes/superAdminAiManagementRoutes");
const superAdminAuditLogRoutes = require("./routes/superAdminAuditLogRoutes");
const superAdminSupportRoutes = require("./routes/superAdminSupportRoutes");
const superAdminSettingsRoutes = require("./routes/superAdminSettingsRoutes");
const superAdminModulesRoutes = require("./routes/superAdminModulesRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

/*  Middlewares  */

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5001",
  "http://127.0.0.1:5001",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any vercel deployment
      if (origin.endsWith(".vercel.app") || origin.includes("vercel.app")) {
        return callback(null, true);
      }
      // Allow local development
      if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
        return callback(null, true);
      }
      if (allowedOrigins.some((allowed) => allowed && origin.startsWith(allowed.replace(/\/+$/, "")))) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  })
);

app.use(express.json({ limit: "50mb" }));

const { swaggerUi, swaggerSpec, swaggerUiOptions } = require("./config/swagger");

app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cookieParser());

// Static file serving for uploads & documents
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Enterprise AI Document Automation Backend Running 🚀",
    docsUrl: "http://localhost:5001/api-docs",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    app: "up",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    app: "up",
  });
});

/*  API Routes & Aliases */

// Direct Auth Aliases for root /auth calls
app.use("/auth", authRoutes);
app.use("/auth/invitation", require("./routes/invitationRoutes"));
app.use("/api/auth", authRoutes);
app.use("/api/auth/invitation", require("./routes/invitationRoutes"));

app.use("/api/organisations", organisationRoutes);
app.use("/organisations", organisationRoutes);
app.use("/api/organisation-admins", organisationAdminRoutes);
app.use("/api/companies", companyRoutes);
app.use("/companies", companyRoutes);
app.use("/api/send-email", emailRoutes);
app.use("/api/ai/providers", aiProviderRoutes);
app.use("/api/ai/models", aiModelRoutes);
app.use("/api/public", require("./routes/publicSubscriptionRoutes"));
app.use("/api/organisation", require("./routes/organisationSubscriptionRoutes"));
app.use("/api/super-admin/ai", require("./routes/superAdminAiRoutes"));
app.use("/api/super-admin/ocr", require("./routes/superAdminOcrRoutes"));

/*  Super Admin Module Routes  */
app.use("/api/super-admin/dashboard", superAdminDashboardRoutes);
app.use("/api/super-admin/organisations", organisationRoutes);
app.use("/api/super-admin/storage", superAdminStorageRoutes);
app.use("/api/super-admin/subscriptions", superAdminSubscriptionRoutes);
app.use("/api/super-admin/ai-management", superAdminAiManagementRoutes);
app.use("/api/super-admin/audit-logs", superAdminAuditLogRoutes);
app.use("/api/super-admin/support", superAdminSupportRoutes);
app.use("/api/super-admin/settings", superAdminSettingsRoutes);
app.use("/api/super-admin/billing", require("./routes/superAdminBillingRoutes"));
app.use("/api/super-admin/platform", require("./routes/superAdminPlatformRoutes"));
app.use("/api/super-admin/feature-flags", require("./routes/superAdminPlatformRoutes"));
app.use("/api/super-admin/announcements", require("./routes/superAdminPlatformRoutes"));
app.use("/api/super-admin/automation", require("./routes/superAdminPlatformRoutes"));
app.use("/api/super-admin/platform-integrations", require("./routes/superAdminIntegrationsRoutes"));
app.use("/api/super-admin/integrations", require("./routes/superAdminIntegrationsRoutes"));
app.use("/api/super-admin/users-access", require("./routes/superAdminUserRoutes"));
app.use("/api/super-admin/users", require("./routes/superAdminUserRoutes"));
app.use("/api/super-admin/analytics", require("./routes/superAdminAnalyticsRoutes"));
app.use("/api/super-admin/templates", require("./routes/superAdminTemplatesRoutes"));
app.use("/api/super-admin/monitoring", require("./routes/superAdminMonitoringRoutes"));
app.use("/api/super-admin/system-monitoring", require("./routes/superAdminMonitoringRoutes"));
app.use("/api/super-admin/cms", require("./routes/superAdminCmsRoutes"));
app.use("/api/super-admin/modules", superAdminModulesRoutes);

/*  Organisation Admin Module Routes  */
app.use("/api/org-admin/documents", require("./routes/orgDocumentsRoutes"));
app.use("/api/documents", require("./routes/orgDocumentsRoutes"));
app.use("/api/org-admin/ai-tools", require("./routes/orgAiToolsRoutes"));
app.use("/api/org-admin/analytics", require("./routes/orgAnalyticsRoutes"));
app.use("/api/org-admin/team", require("./routes/orgTeamRoutes"));
app.use("/api/org-admin/workflows", require("./routes/orgWorkflowRoutes"));
app.use("/api/org-admin/ai-builder", require("./routes/orgDocBuilderRoutes"));
app.use("/api/integrations", require("./routes/orgIntegrationsRoutes"));
app.use("/api/org-admin/integrations", require("./routes/orgIntegrationsRoutes"));
app.use("/api/org-admin/settings", require("./routes/orgSettingsRoutes"));
app.use("/api/org-admin/support", require("./routes/orgSupportRoutes"));
app.use("/api/org-admin/notifications", require("./routes/orgNotificationsRoutes"));
app.use("/api/notifications", require("./routes/orgNotificationsRoutes"));

/*  Department Manager Module Routes  */
app.use("/api/department-manager/dashboard", require("./routes/departmentManagerDashboardRoutes"));
app.use("/api/department-manager/documents", require("./routes/departmentManagerDocumentsRoutes"));
app.use("/api/department-manager/templates", require("./routes/departmentManagerTemplatesRoutes"));
app.use("/api/department-manager/team", require("./routes/departmentManagerTeamsRoutes"));
app.use("/api/department-manager/teams", require("./routes/departmentManagerTeamsRoutes"));
app.use("/api/department-manager/approvals", require("./routes/departmentManagerApprovalsRoutes"));
app.use("/api/department-manager/reports", require("./routes/departmentManagerReportsRoutes"));
app.use("/api/department-manager/notifications", require("./routes/departmentManagerNotificationsRoutes"));
app.use("/api/department-manager/profile", require("./routes/departmentManagerProfileRoutes"));
app.use("/api/department-manager/ai-tools", require("./routes/departmentManagerAiToolsRoutes"));
app.use("/api/department-manager", require("./routes/departmentManagerRoutes"));

/*  Team Leader Module Routes  */
app.use("/api/team-leader/dashboard", require("./routes/teamLeaderDashboardRoutes"));
app.use("/api/team-leader/my-team", require("./routes/teamLeaderTeamRoutes"));
app.use("/api/team-leader/team", require("./routes/teamLeaderTeamRoutes"));
app.use("/api/team-leader/documents", require("./routes/teamLeaderDocumentsRoutes"));
app.use("/api/team-leader/templates", require("./routes/teamLeaderTemplatesRoutes"));
app.use("/api/team-leader/tasks", require("./routes/teamLeaderTasksRoutes"));
app.use("/api/team-leader/approvals", require("./routes/teamLeaderApprovalsRoutes"));
app.use("/api/team-leader/workflow", require("./routes/teamLeaderWorkflowRoutes"));
app.use("/api/team-leader/workflows", require("./routes/teamLeaderWorkflowRoutes"));
app.use("/api/team-leader/ai-tools", require("./routes/teamLeaderAiToolsRoutes"));
app.use("/api/team-leader/reports", require("./routes/teamLeaderReportsRoutes"));
app.use("/api/team-leader/notifications", require("./routes/teamLeaderNotificationsRoutes"));
app.use("/api/team-leader/profile", require("./routes/teamLeaderProfileRoutes"));
app.use("/api/team-leader/support", require("./routes/teamLeaderSupportRoutes"));
app.use("/api/team-leader", require("./routes/teamLeaderRoutes"));

app.use("/api/employee", require("./routes/employeeRoutes"));
app.use("/api/ai", require("./routes/aiGatewayRoutes"));
/*  Governance & Compliance (Phase 12)  */
app.use("/api/governance", require("./routes/governanceRoutes"));
app.use("/api/org-admin/governance", require("./routes/governanceRoutes"));
app.use("/api/super-admin/governance", require("./routes/governanceRoutes"));

/*  Monitoring & Observability (Phase 13)  */
app.use("/api/system", require("./routes/systemRoutes"));
app.use("/api/super-admin/system", require("./routes/systemRoutes"));
app.use("/api/super-admin/monitoring", require("./routes/systemRoutes"));

/*  Backup & Disaster Recovery (Phase 14)  */
app.use("/api/super-admin/disaster-recovery", require("./routes/disasterRecoveryRoutes"));

/*  Enterprise Document Automation Suite  */
app.use("/api/crm", require("./routes/crmRoutes"));
app.use("/api/org-admin/clients-crm", require("./routes/crmRoutes"));
app.use("/api/bulk-generation", require("./routes/bulkGenerationRoutes"));
app.use("/api/org-admin/bulk-generation", require("./routes/bulkGenerationRoutes"));
app.use("/api/idp", require("./routes/idpRoutes"));
app.use("/api/org-admin/idp", require("./routes/idpRoutes"));
app.use("/api/e-sign", require("./routes/eSignatureRoutes"));
app.use("/api/e-signature", require("./routes/eSignatureRoutes"));
app.use("/api/org-admin/e-sign", require("./routes/eSignatureRoutes"));
app.use("/api/ai-agent", require("./routes/aiAgentRoutes"));
app.use("/api/org-admin/ai-agent", require("./routes/aiAgentRoutes"));
app.use("/api/forms", require("./routes/formRoutes"));
app.use("/api/org-admin/forms", require("./routes/formRoutes"));
app.use("/api/documents", require("./routes/documentSearchRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/org-admin/tasks", require("./routes/taskRoutes"));
app.use("/api/organisation", require("./routes/orgGovernanceRoutes"));
app.use("/api/org-admin/governance-policy", require("./routes/orgGovernanceRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/usage", require("./routes/usageRoutes"));
app.use("/api/org-admin/usage", require("./routes/usageRoutes"));
app.use("/api/super-admin/usage", require("./routes/usageRoutes"));

app.use("/api/documents/from-ai", async (req, res, next) => {
  try {
    const data = await require("./services/aiDocumentService").saveAiContentAsDocument(req);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

/*  Error Middleware  */

app.use(errorMiddleware);

module.exports = app;
