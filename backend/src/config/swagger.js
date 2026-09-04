const path = require("path");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Enterprise AI Document Automation API",
      version: "1.0.0",
      description:
        "Comprehensive REST API documentation for Enterprise AI Document Automation platform. Supports Super Admin, Organisation Admin, and Department Manager workflows with AI-powered document processing, OCR, automated invitations, approvals, and team management.",
      contact: {
        name: "DocuCore AI Engineering Support",
        email: "support@docucore.ai",
      },
    },
    servers: [
      {
        url: "http://localhost:5001/api",
        description: "Local Development API Server (/api base)",
      },
      {
        url: "http://localhost:5001",
        description: "Local Root Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT Bearer token in the format: Bearer <token>",
        },
      },
      schemas: {
        StandardSuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Operation completed successfully." },
            data: { type: "object" },
          },
        },
        StandardErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Invalid request parameters or unauthorized action." },
          },
        },
      },
    },
    tags: [
      { name: "Auth & Security", description: "Authentication, password reset, and session verification endpoints" },
      { name: "Invitations", description: "Public invitation token verification and account activation" },
      { name: "Organisations (Super Admin)", description: "Super Admin organisation management & sub-resources" },
      { name: "Organisation Admins (Super Admin)", description: "Super Admin organisation admin credentials & access" },
      { name: "Companies", description: "Corporate company profiles & entities" },
      { name: "Email Service", description: "Automated Nodemailer email delivery & test endpoints" },
      { name: "AI Providers & Models", description: "AI engine configurations, API keys, and models" },
      { name: "Super Admin - Dashboard", description: "Global system analytics, telemetry, and activity logs" },
      { name: "Super Admin - Storage", description: "Cloud storage providers, volume stats, and retention policies" },
      { name: "Super Admin - Subscriptions", description: "Tiered subscription plans and customer allocations" },
      { name: "Super Admin - AI Management", description: "AI usage logs, latency metrics, and prompt management" },
      { name: "Super Admin - Audit Logs", description: "Enterprise audit log trails and compliance records" },
      { name: "Super Admin - Support", description: "Super Admin support ticket queue and operations" },
      { name: "Super Admin - Settings", description: "Global platform settings, SMTP, and authentication policies" },
      { name: "Super Admin - Modules", description: "Feature module toggles and RBAC access matrices" },
      { name: "Super Admin - Billing", description: "Revenue telemetry, customer invoices, and payment gateways" },
      { name: "Org Admin - AI Tools", description: "Organisation AI document processing tools" },
      { name: "Org Admin - Analytics", description: "Organisation document metrics & processing analytics" },
      { name: "Org Admin - Team", description: "Organisation team members, invites, and roles" },
      { name: "Org Admin - AI Doc Builder", description: "Document builder templates and automated generation" },
      { name: "Org Admin - Integrations", description: "Cloud connectors, webhooks, and third-party sync" },
      { name: "Org Admin - Settings", description: "Organisation preferences, branding, and security policies" },
      { name: "Org Admin - Support", description: "Organisation support helpdesk and ticket tracking" },
      { name: "Department Manager - Core", description: "Department Manager dashboard, documents, templates, teams, and approvals" },
      { name: "Department Manager - AI Tools & OCR", description: "Local OCR engine & AI tool document analysis" },
      { name: "Employee - Dashboard", description: "Employee personal KPI dashboard, quick actions, and recent activities" },
      { name: "Employee - Documents", description: "Employee document lifecycle (Upload, Create, Edit, Draft, Submit, Archive, Delete)" },
      { name: "Employee - Templates", description: "Read-only organization document templates and dynamic draft generation" },
      { name: "Employee - Tasks", description: "Assigned tasks from Team Leaders / Managers with collaborative notes" },
      { name: "Employee - Approvals", description: "Employee approval tracking, rejection review, and correction resubmissions" },
      { name: "Employee - AI Tools", description: "Assisted AI document processing tools (OCR, Summarizer, Q&A, Translate, Rewrite)" },
      { name: "Employee - Notifications", description: "Personal notifications queue and preference controls" },
      { name: "Employee - Profile", description: "Employee profile details, password updates, and active session management" },
    ],
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../routes/**/*.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

const swaggerUiOptions = {
  customSiteTitle: "DocuCore AI - API Documentation",
  customCss: `
    .swagger-ui .topbar { background-color: #0f172a; border-bottom: 2px solid #274690; }
    .swagger-ui .topbar .topbar-wrapper .link { color: #fff; font-weight: 800; font-family: sans-serif; }
    .swagger-ui .info .title { color: #1e293b; font-weight: 800; }
    .swagger-ui .btn.authorize { background-color: #274690; color: #fff; border-color: #274690; }
    .swagger-ui .btn.authorize svg { fill: #fff; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: "none",
    filter: true,
    tagsSorter: "alpha",
  },
};

module.exports = {
  swaggerUi,
  swaggerSpec,
  swaggerUiOptions,
};
