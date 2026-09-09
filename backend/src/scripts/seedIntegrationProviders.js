const prisma = require("../config/prismaClient");

const INITIAL_PROVIDERS = [
  {
    providerKey: "google_workspace",
    providerName: "Google Workspace",
    category: "STORAGE",
    authenticationType: "oauth2",
    logoUrl: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
    documentationUrl: "https://developers.google.com/drive/api/guides/about-sdk",
    description: "Cloud file storage, Google Drive exports, and Google Docs collaboration for enterprise contracts.",
    isEnabled: true,
    isActive: true,
    configurationSchema: {
      fields: [
        { key: "clientId", label: "OAuth Client ID", type: "text", required: true, placeholder: "your-google-client-id", helpText: "From Google Cloud Console > APIs & Services > Credentials" },
        { key: "clientSecret", label: "OAuth Client Secret", type: "password", required: true, placeholder: "your-google-client-secret", helpText: "Your Google OAuth 2.0 Web Client Secret" },
        { key: "redirectUri", label: "Authorized Redirect URI", type: "readonly", default: "http://localhost:5001/api/integrations/google/callback", helpText: "Add to Google Cloud Console Authorized redirect URIs" },
      ],
    },
    requiredScopes: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    supportedFeatures: ["document_sync", "pdf_export", "folder_creation", "team_drive"],
  },
  {
    providerKey: "microsoft_365",
    providerName: "Microsoft 365",
    category: "PRODUCTIVITY",
    authenticationType: "oauth2",
    logoUrl: "https://res-1.cdn.office.net/files/fabric-cdn-prod_20221209.001/assets/brand-icons/product/svg/onedrive_32x1.svg",
    documentationUrl: "https://learn.microsoft.com/en-us/graph/api/resources/onedrive",
    description: "OneDrive document repository sync, SharePoint storage, and Office 365 document automation.",
    isEnabled: true,
    isActive: true,
    configurationSchema: {
      fields: [
        { key: "clientId", label: "Application (Client) ID", type: "text", required: true, placeholder: "Azure App Client ID UUID", helpText: "Azure Portal > App Registrations > Overview" },
        { key: "clientSecret", label: "Client Secret Value", type: "password", required: true, placeholder: "Azure Client Secret Value", helpText: "Azure Portal > Certificates & secrets" },
        { key: "tenantId", label: "Directory (Tenant) ID", type: "text", required: true, default: "common", placeholder: "common or Azure Tenant UUID", helpText: "Use 'common' for multi-tenant Microsoft accounts" },
        { key: "redirectUri", label: "Redirect URI", type: "readonly", default: "http://localhost:5001/api/integrations/microsoft/callback", helpText: "Add to Azure App Registration Web Redirect URIs" },
      ],
    },
    requiredScopes: ["Files.ReadWrite.All", "User.Read", "offline_access"],
    supportedFeatures: ["onedrive_sync", "sharepoint_export", "automated_backup"],
  },
  {
    providerKey: "slack",
    providerName: "Slack",
    category: "COMMUNICATION",
    authenticationType: "oauth2",
    logoUrl: "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png",
    documentationUrl: "https://api.slack.com/authentication/oauth-v2",
    description: "Instant notifications, document approval alerts, and contract workflow dispatch in Slack channels.",
    isEnabled: true,
    isActive: true,
    configurationSchema: {
      fields: [
        { key: "clientId", label: "Slack Client ID", type: "text", required: true, placeholder: "Slack App Client ID", helpText: "From api.slack.com > Basic Information" },
        { key: "clientSecret", label: "Slack Client Secret", type: "password", required: true, placeholder: "Slack App Client Secret", helpText: "From api.slack.com > Basic Information" },
        { key: "signingSecret", label: "Signing Secret (Optional)", type: "password", required: false, placeholder: "Slack App Signing Secret" },
        { key: "redirectUri", label: "OAuth Redirect URL", type: "readonly", default: "http://localhost:5001/api/integrations/slack/callback" },
      ],
    },
    requiredScopes: ["chat:write", "channels:read", "incoming-webhook", "users:read"],
    supportedFeatures: ["approval_notifications", "contract_alerts", "channel_broadcast"],
  },
  {
    providerKey: "brevo",
    providerName: "Brevo (Sendinblue)",
    category: "COMMUNICATION",
    authenticationType: "api_key",
    logoUrl: "https://assets.brevo.com/assets/favicon/apple-touch-icon.png",
    documentationUrl: "https://developers.brevo.com/reference/getting-started-1",
    description: "High-deliverability transactional email dispatch, OTP validation, and e-signature invitations.",
    isEnabled: true,
    isActive: true,
    configurationSchema: {
      fields: [
        { key: "apiKey", label: "Brevo v3 API Key", type: "password", required: true, placeholder: "your-brevo-api-key", helpText: "From Brevo Dashboard > SMTP & API > API Keys" },
        { key: "senderEmail", label: "Default Sender Email", type: "email", required: true, placeholder: "notifications@yourcompany.com" },
        { key: "senderName", label: "Default Sender Name", type: "text", required: false, placeholder: "DocuCore Automated Deliveries", default: "DocuCore Automated Deliveries" },
      ],
    },
    requiredScopes: ["smtp_relay", "templates_send", "tracking"],
    supportedFeatures: ["transactional_emails", "signing_invitations", "delivery_tracking"],
  },
  {
    providerKey: "whatsapp_business",
    providerName: "WhatsApp Business (Meta)",
    category: "COMMUNICATION",
    authenticationType: "api_key",
    logoUrl: "https://static.whatsapp.net/rsrc.php/v3/yP/r/rNqcCO-5Yiq.png",
    documentationUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    description: "Automated document alerts, instant approvals, and verified PDF notifications via WhatsApp Cloud API.",
    isEnabled: true,
    isActive: true,
    configurationSchema: {
      fields: [
        { key: "phoneNumberId", label: "Phone Number ID", type: "text", required: true, placeholder: "10564...", helpText: "From Meta Developers > WhatsApp > API Setup" },
        { key: "wabaId", label: "WhatsApp Business Account ID", type: "text", required: true, placeholder: "WABA ID" },
        { key: "accessToken", label: "Permanent System User Access Token", type: "password", required: true, placeholder: "EAA...", helpText: "System User Token with whatsapp_business_messaging permission" },
        { key: "appSecret", label: "Meta App Secret (Optional)", type: "password", required: false, placeholder: "For webhook signature validation" },
      ],
    },
    requiredScopes: ["whatsapp_business_messaging", "whatsapp_business_management"],
    supportedFeatures: ["document_sharing", "instant_approvals", "interactive_buttons"],
  },
  {
    providerKey: "microsoft_teams",
    providerName: "Microsoft Teams",
    category: "COMMUNICATION",
    authenticationType: "oauth2",
    logoUrl: "https://statics.teams.cdn.office.net/evergreen-assets/apps/teams_app_icon.png",
    documentationUrl: "https://learn.microsoft.com/en-us/microsoftteams/platform/",
    description: "Send actionable adaptive cards, approval flows, and channel notifications in Microsoft Teams.",
    isEnabled: true,
    isActive: true,
    configurationSchema: {
      fields: [
        { key: "clientId", label: "Application (Client) ID", type: "text", required: true, placeholder: "Azure App Client ID UUID" },
        { key: "clientSecret", label: "Client Secret Value", type: "password", required: true, placeholder: "Azure Client Secret Value" },
        { key: "tenantId", label: "Directory (Tenant) ID", type: "text", required: true, default: "common" },
        { key: "redirectUri", label: "Redirect URI", type: "readonly", default: "http://localhost:5001/api/integrations/teams/callback" },
      ],
    },
    requiredScopes: ["Chat.ReadWrite", "ChannelMessage.Send", "TeamsActivity.Send", "offline_access"],
    supportedFeatures: ["adaptive_cards", "team_notifications", "approval_actions"],
  },
];

async function seedIntegrationProviders() {
  console.log("Seeding integration providers...");
  for (const p of INITIAL_PROVIDERS) {
    const record = await prisma.integrationProvider.upsert({
      where: { providerKey: p.providerKey },
      update: {
        providerName: p.providerName,
        category: p.category,
        authenticationType: p.authenticationType,
        logoUrl: p.logoUrl,
        documentationUrl: p.documentationUrl,
        description: p.description,
        configurationSchema: p.configurationSchema,
        requiredScopes: p.requiredScopes,
        supportedFeatures: p.supportedFeatures,
        isEnabled: p.isEnabled,
        isActive: p.isActive,
      },
      create: {
        providerKey: p.providerKey,
        providerName: p.providerName,
        category: p.category,
        authenticationType: p.authenticationType,
        logoUrl: p.logoUrl,
        documentationUrl: p.documentationUrl,
        description: p.description,
        configurationSchema: p.configurationSchema,
        requiredScopes: p.requiredScopes,
        supportedFeatures: p.supportedFeatures,
        isEnabled: p.isEnabled,
        isActive: p.isActive,
      },
    });
    console.log(`✓ Provider seeded: ${record.providerName} (${record.providerKey}) [${record.id}]`);
  }
  console.log("All 6 integration providers seeded successfully.");
}

if (require.main === module) {
  seedIntegrationProviders()
    .catch((err) => {
      console.error("Error seeding integration providers:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = seedIntegrationProviders;
